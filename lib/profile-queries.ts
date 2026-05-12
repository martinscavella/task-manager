// Query di lettura profilo e preferenze.
// NON marcato 'use server' — usare solo da Server Components.

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

export interface Profile {
  first_name: string | null
  last_name: string | null
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

export const DEFAULT_WIDGETS = ['stats', 'overdue', 'recent', 'completed_week', 'due_today', 'by_status', 'by_priority', 'by_label', 'streak', 'weekly_chart', 'next_due', 'quick_actions']

export const DEFAULT_PREFS: UserPreferences = {
  default_view: 'list',
  default_sort: 'created_desc',
  show_completed: true,
  compact_cards: false,
  dashboard_widgets: DEFAULT_WIDGETS,
}

// cache() di React deduplica getUser() nell'intera request — chiamata una volta sola
const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function getProfile(): Promise<Profile | null> {
  const user = await getAuthUser()
  if (!user) return null
  const userId = user.id

  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name, role, company, bio, phone, timezone, avatar_url')
        .eq('user_id', userId)
        .maybeSingle()
      return data as Profile | null
    },
    [`profile-${userId}`],
    { tags: [`profile-${userId}`], revalidate: 60 }
  )()
}

export async function getPreferences(): Promise<UserPreferences> {
  const user = await getAuthUser()
  if (!user) return DEFAULT_PREFS
  const userId = user.id

  const data = await unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      return data
    },
    [`prefs-${userId}`],
    { tags: [`prefs-${userId}`], revalidate: 60 }
  )()

  if (!data) return DEFAULT_PREFS
  return {
    default_view: data.default_view ?? DEFAULT_PREFS.default_view,
    default_sort: data.default_sort ?? DEFAULT_PREFS.default_sort,
    show_completed: data.show_completed ?? DEFAULT_PREFS.show_completed,
    compact_cards: data.compact_cards ?? DEFAULT_PREFS.compact_cards,
    dashboard_widgets: Array.isArray(data.dashboard_widgets) && data.dashboard_widgets.length > 0
      ? data.dashboard_widgets
      : DEFAULT_WIDGETS,
  }
}
