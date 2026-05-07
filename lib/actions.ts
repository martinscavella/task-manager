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

export async function createTask(input: CreateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').insert([{
    title: input.title,
    priority: input.priority ?? 3,
    status: input.status ?? 'TO_BE_STARTED',
    label: input.label ?? null,
    due_date: input.due_date ?? null,
    note: input.note ?? null,
  }])

  if (error) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'max')
  return { success: true }
}

export async function updateTask(input: UpdateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { id, ...updates } = input
  
  // If status is being changed to COMPLETED, set completed_at
  if (updates.status === 'COMPLETED') {
    (updates as Record<string, unknown>).completed_at = new Date().toISOString()
  } else if (updates.status && updates.status !== 'COMPLETED') {
    // If status changes away from COMPLETED, clear completed_at
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

  revalidatePath('/', 'max')
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

  revalidatePath('/', 'max')
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
    // Count by status
    byStatus[task.status] = (byStatus[task.status] || 0) + 1

    // Count by priority
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1

    // Count completed tasks
    if (task.completed_at) {
      const completedDate = new Date(task.completed_at)
      if (completedDate >= weekAgo) completedThisWeek++
      if (completedDate >= monthAgo) completedThisMonth++

      // Calculate completion time
      const createdDate = new Date(task.created_at)
      const completionTime = completedDate.getTime() - createdDate.getTime()
      totalCompletionTime += completionTime
      completedCount++
    }

    // Count overdue tasks
    if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
      const dueDate = new Date(task.due_date)
      if (dueDate < now) overdue++
    }
  }

  const avgCompletionTime = completedCount > 0 
    ? Math.round(totalCompletionTime / completedCount / (1000 * 60 * 60 * 24)) // in days
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
