'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Profile {
  full_name: string | null
  role: string | null
  company: string | null
  bio: string | null
  phone: string | null
  timezone: string | null
  avatar_url: string | null
}

export interface UserPreferences {
  default_view: 'list' | 'grid' | 'kanban'
  default_sort: 'created_desc' | 'created_asc' | 'priority' | 'due_date'
  show_completed: boolean
  compact_cards: boolean
  dashboard_widgets: string[]
}

const DEFAULT_PREFS: UserPreferences = {
  default_view: 'list',
  default_sort: 'created_desc',
  show_completed: true,
  compact_cards: false,
  dashboard_widgets: ['stats', 'overdue', 'recent', 'completed_week'],
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('full_name, role, company, bio, phone, timezone, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  return data as Profile | null
}

export async function upsertProfile(profile: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autenticato' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...profile }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  // Sincronizza full_name anche nei metadata auth
  if (profile.full_name !== undefined) {
    await supabase.auth.updateUser({ data: { full_name: profile.full_name } })
  }

  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { success: true }
}

export async function getPreferences(): Promise<UserPreferences> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PREFS

  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return DEFAULT_PREFS
  return {
    default_view: data.default_view ?? DEFAULT_PREFS.default_view,
    default_sort: data.default_sort ?? DEFAULT_PREFS.default_sort,
    show_completed: data.show_completed ?? DEFAULT_PREFS.show_completed,
    compact_cards: data.compact_cards ?? DEFAULT_PREFS.compact_cards,
    dashboard_widgets: data.dashboard_widgets ?? DEFAULT_PREFS.dashboard_widgets,
  }
}

export async function upsertPreferences(prefs: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autenticato' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'page')
  return { success: true }
}
