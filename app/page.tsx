import { getTasks, getTaskAnalytics } from '@/lib/actions'
import { getProfile, getPreferences } from '@/lib/profile-actions'
import { createClient } from '@/lib/supabase/server'
import { HomeClient } from '@/components/home-client'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

// Rimuoviamo force-dynamic: le mutation invalidano i tag, Next.js serve dalla cache
export const dynamic = 'auto'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // tasks + analytics in parallelo; analytics non fa query aggiuntive (usa tasks già in cache)
  const [tasks, analytics, profile, preferences] = await Promise.all([
    getTasks(),
    getTaskAnalytics(),
    getProfile(),
    getPreferences(),
  ])

  const firstName =
    profile?.first_name ||
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Ciao'
  const lastName = profile?.last_name ?? ''
  const displayName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <HomeClient
      tasks={tasks}
      analytics={analytics}
      preferences={preferences}
      firstName={firstName}
      displayName={displayName}
      email={user?.email ?? ''}
      greeting={getGreeting()}
      dateLabel={new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
    />
  )
}
