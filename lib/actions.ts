'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from './types'

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
