'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateTaskInput, UpdateTaskInput, Task } from '@/lib/types'

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
  
  const { error } = await supabase.from('tasks').insert({
    title: input.title,
    priority: input.priority ?? 2,
    status: input.status ?? 'TO_BE_STARTED',
    label: input.label ?? null,
    due_date: input.due_date ?? null,
    note: input.note ?? null,
  })

  if (error) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateTask(input: UpdateTaskInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { id, ...updates } = input
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
