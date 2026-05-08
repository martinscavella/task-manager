'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from './types'

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return data as Task[]
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Error fetching task:', error)
    return null
  }

  return data as Task
}

export async function createTask(input: CreateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Non autenticato' }

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
    user_id: user.id,
  }])

  if (error) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'page')
  return { success: true }
}

export async function updateTask(input: UpdateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { id, ...updates } = input

  if (updates.status === 'COMPLETED') {
    (updates as Record<string, unknown>).completed_at = new Date().toISOString()
  } else if (updates.status && updates.status !== 'COMPLETED') {
    (updates as Record<string, unknown>).completed_at = null
  }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating task:', error)
    return { success: false, error: error.message }
  }

  // Invalida solo le pagine effettivamente toccate
  revalidatePath('/', 'page')
  revalidatePath(`/tasks/${id}`, 'page')
  return { success: true }
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<{ success: boolean; error?: string }> {
  return updateTask({ id, status })
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'page')
  return { success: true }
}

export async function signOut(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getTaskAnalytics() {
  const supabase = await createClient()
  const { data: tasks, error } = await supabase.from('tasks').select('*')

  if (error || !tasks) {
    return {
      total: 0,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<number, number>,
      completedThisWeek: 0,
      completedThisMonth: 0,
      overdue: 0,
      avgCompletionTime: 0,
    }
  }

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
      const createdDate = new Date(task.created_at)
      totalCompletionTime += completedDate.getTime() - createdDate.getTime()
      completedCount++
    }

    if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
      const dueDate = new Date(task.due_date)
      if (dueDate < now) overdue++
    }
  }

  const avgCompletionTime = completedCount > 0
    ? Math.round(totalCompletionTime / completedCount / (1000 * 60 * 60 * 24))
    : 0

  return {
    total: tasks.length,
    byStatus,
    byPriority,
    completedThisWeek,
    completedThisMonth,
    overdue,
    avgCompletionTime,
  }
}
