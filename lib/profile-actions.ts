'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile, UserPreferences } from './profile-queries'

export type { Profile, UserPreferences } from './profile-queries'
export { getProfile, getPreferences } from './profile-queries'

export async function upsertProfile(profile: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autenticato' }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.full_name || null
  const payload = { ...profile, full_name: fullName }

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } })

  revalidatePath('/', 'layout')
  revalidatePath('/settings')
  return { success: true }
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
