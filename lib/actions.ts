'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from './types'

// ─── cached data fetchers ────────────────────────────────────────────────────
// Ogni funzione cacheable viene wrappata in unstable_cache con tag specifici.
// Le mutation invalidano solo i tag necessari.

async function _getTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getTasks:', error); return [] }
  return data as Task[]
}

async function _getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) { console.error('getTaskById:', error); return null }
  return data as Task
}

// Sidebar: seleziona solo i campi necessari per la lista
async function _getTasksSidebar(userId: string): Promise<Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'label' | 'due_date'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,status,priority,label,due_date')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getTasksSidebar:', error); return [] }
  return data as Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'label' | 'due_date'>[]
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const cached = unstable_cache(
    () => _getTasks(user.id),
    [`tasks-list-${user.id}`],
    { tags: [`tasks-${user.id}`], revalidate: 30 }
  )
  return cached()
}

export async function getTasksSidebar(): Promise<Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'label' | 'due_date'>[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const cached = unstable_cache(
    () => _getTasksSidebar(user.id),
    [`tasks-sidebar-${user.id}`],
    { tags: [`tasks-${user.id}`], revalidate: 30 }
  )
  return cached()
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const cached = unstable_cache(
    () => _getTaskById(id),
    [`task-${id}`],
    { tags: [`task-${id}`, `tasks-${user.id}`], revalidate: 30 }
  )
  return cached()
}

// Analytics calcolate in-process dai task già in cache (zero query aggiuntive)
export async function getTaskAnalytics() {
  const tasks = await getTasks()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const byStatus: Record<string, number> = {}
  const byPriority: Record<number, number> = {}
  let completedThisWeek = 0
  let completedThisMonth = 0
  let overdue = 0
  let totalCompletionTime = 0
  let completedCount = 0

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
    if (task.completed_at) {
      const completedDate = new Date(task.completed_at)
      if (completedDate >= weekAgo) completedThisWeek++
      if (completedDate >= monthAgo) completedThisMonth++
      totalCompletionTime += completedDate.getTime() - new Date(task.created_at).getTime()
      completedCount++
    }
    if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
      if (new Date(task.due_date) < now) overdue++
    }
  }

  return {
    total: tasks.length,
    byStatus,
    byPriority,
    completedThisWeek,
    completedThisMonth,
    overdue,
    avgCompletionTime: completedCount > 0
      ? Math.round(totalCompletionTime / completedCount / (1000 * 60 * 60 * 24))
      : 0,
  }
}

// ─── mutations ───────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function createTask(input: CreateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Non autenticato' }

  const { error } = await supabase.from('tasks').insert([{
    title: input.title,
    priority: input.priority ?? 3,
    status: input.status ?? 'TO_BE_STARTED',
    label: input.label ?? null,
    due_date: input.due_date ?? null,
    note: input.note ?? null,
    jira_url: input.jira_url ?? null,
    jira_key: input.jira_key ?? null,
    code: input.code ?? null,
    info: input.info ?? null,
    user_id: userId,
  }])

  if (error) { console.error('createTask:', error); return { success: false, error: error.message } }

  revalidateTag(`tasks-${userId}`)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateTask(input: UpdateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Non autenticato' }

  const { id, ...updates } = input

  if (updates.status === 'COMPLETED') {
    (updates as Record<string, unknown>).completed_at = new Date().toISOString()
  } else if (updates.status && updates.status !== 'COMPLETED') {
    (updates as Record<string, unknown>).completed_at = null
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)

  if (error) { console.error('updateTask:', error); return { success: false, error: error.message } }

  // Invalida il tag del singolo task + la lista
  revalidateTag(`task-${id}`)
  revalidateTag(`tasks-${userId}`)
  revalidatePath(`/tasks/${id}`, 'page')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<{ success: boolean; error?: string }> {
  return updateTask({ id, status })
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Non autenticato' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) { console.error('deleteTask:', error); return { success: false, error: error.message } }

  revalidateTag(`task-${id}`)
  revalidateTag(`tasks-${userId}`)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/landing')
}
