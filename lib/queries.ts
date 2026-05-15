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
 * Storico cross-task per un singolo component_ref.
 * Usato da /components/[ref].
 */
export async function getComponentHistory(
  componentRef: string
): Promise<(ActionLogEntry & { task_title: string; task_label: string | null })[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_action_logs')
    .select('*, tasks!inner(id, title, label)')
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

/**
 * Lista aggregata di tutti i componenti distinti che hanno almeno una voce
 * nel log. Usata dalla pagina /components.
 *
 * Usa tasks!inner per soddisfare la RLS policy che verifica user_id su tasks.
 */
export interface ComponentSummary {
  component_ref: string
  total_changes: number
  task_count: number
  metadata_type: string
  technology: string
  last_modified: string
  last_change_status: string
}

export async function getAllComponents(): Promise<ComponentSummary[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()

  // Join con tasks!inner: la RLS su tasks filtra automaticamente per user_id
  const { data, error } = await supabase
    .from('task_action_logs')
    .select('component_ref, task_id, metadata_type, technology, change_status, created_at, tasks!inner(id)')
    .not('component_ref', 'is', null)
    .neq('component_ref', '')
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllComponents:', error); return [] }

  // Aggrega client-side in un solo passaggio
  const map = new Map<string, ComponentSummary & { _task_ids: Set<string> }>()

  for (const row of (data ?? []) as any[]) {
    const ref: string = row.component_ref
    if (!ref) continue

    if (!map.has(ref)) {
      map.set(ref, {
        component_ref: ref,
        total_changes: 1,
        task_count: 1,
        metadata_type: row.metadata_type,
        technology: row.technology,
        last_modified: row.created_at,
        last_change_status: row.change_status,
        _task_ids: new Set([row.task_id]),
      })
    } else {
      const entry = map.get(ref)!
      entry.total_changes += 1
      entry._task_ids.add(row.task_id)
      entry.task_count = entry._task_ids.size
      // last_modified è già il più recente (query ordinata DESC)
    }
  }

  return Array.from(map.values())
    .map(({ _task_ids, ...rest }) => rest)
    .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime())
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
