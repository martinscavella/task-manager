// Data fetchers con unstable_cache.
// NON marcato 'use server' — unstable_cache non è compatibile con Server Actions.
// Usare questo file solo da Server Components e da actions.ts per le read.

import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import type { Task } from './types'

type TaskSummary = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'label' | 'due_date'>

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

const fetchTasksCached = (userId: string) =>
  unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) { console.error('fetchTasks:', error); return [] }
      return data as Task[]
    },
    [`tasks-list-${userId}`],
    { tags: [`tasks-${userId}`], revalidate: 30 }
  )()

const fetchTaskByIdCached = (id: string, userId: string) =>
  unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) { console.error('fetchTaskById:', error); return null }
      return data as Task
    },
    [`task-${id}`],
    { tags: [`task-${id}`, `tasks-${userId}`], revalidate: 30 }
  )()

const fetchTasksSidebarCached = (userId: string) =>
  unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('id,title,status,priority,label,due_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) { console.error('fetchTasksSidebar:', error); return [] }
      return data as TaskSummary[]
    },
    [`tasks-sidebar-${userId}`],
    { tags: [`tasks-${userId}`], revalidate: 30 }
  )()

export async function getTasks(): Promise<Task[]> {
  const userId = await getUserId()
  if (!userId) return []
  return fetchTasksCached(userId)
}

export async function getTaskById(id: string): Promise<Task | null> {
  const userId = await getUserId()
  if (!userId) return null
  return fetchTaskByIdCached(id, userId)
}

export async function getTasksSidebar(): Promise<TaskSummary[]> {
  const userId = await getUserId()
  if (!userId) return []
  return fetchTasksSidebarCached(userId)
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
