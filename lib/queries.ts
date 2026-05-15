// Data fetchers per Server Components.
// NON marcato 'use server'.

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Task, ActionLogEntry } from './types'

type TaskSummary = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'label' | 'due_date'>

const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getTasks = cache(async (): Promise<Task[]> => {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchTasks:', error); return [] }
  return data as Task[]
})

export const getTaskById = cache(async (id: string): Promise<Task | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) { console.error('fetchTaskById:', error); return null }
  return data as Task
})

export const getTasksSidebar = cache(async (): Promise<TaskSummary[]> => {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,status,priority,label,due_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchTasksSidebar:', error); return [] }
  return data as TaskSummary[]
})

export const getActionLogsByTaskId = cache(async (taskId: string): Promise<ActionLogEntry[]> => {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_action_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getActionLogsByTaskId:', error); return [] }
  return data as ActionLogEntry[]
})

/**
 * Restituisce tutto lo storico cross-task per un dato component_ref.
 * Usato dalla pagina /components/[name].
 */
export async function getComponentHistory(
  componentRef: string
): Promise<(ActionLogEntry & { task_title: string; task_label: string | null })[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  // Join con tasks per ottenere titolo e label
  const { data, error } = await supabase
    .from('task_action_logs')
    .select(`
      *,
      tasks!inner(title, label, id)
    `)
    .eq('component_ref', componentRef)
    .order('created_at', { ascending: false })

  if (error) { console.error('getComponentHistory:', error); return [] }

  return (data ?? []).map((row: any) => ({
    ...row,
    task_title: row.tasks?.title ?? '',
    task_label: row.tasks?.label ?? null,
    task_id:    row.tasks?.id ?? row.task_id,
  }))
}

export async function getTaskAnalytics() {
  const tasks = await getTasks()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const byStatus: Record<string, number> = {}
  const byPriority: Record<number, number> = {}
  let completedThisWeek = 0, completedThisMonth = 0, overdue = 0
  let totalCompletionTime = 0, completedCount = 0

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
    if (task.completed_at) {
      const cd = new Date(task.completed_at)
      if (cd >= weekAgo) completedThisWeek++
      if (cd >= monthAgo) completedThisMonth++
      totalCompletionTime += cd.getTime() - new Date(task.created_at).getTime()
      completedCount++
    }
    if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
      if (new Date(task.due_date) < now) overdue++
    }
  }

  return {
    total: tasks.length, byStatus, byPriority,
    completedThisWeek, completedThisMonth, overdue,
    avgCompletionTime: completedCount > 0
      ? Math.round(totalCompletionTime / completedCount / (1000 * 60 * 60 * 24))
      : 0,
  }
}
