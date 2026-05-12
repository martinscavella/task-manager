import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SettingsView } from '@/components/settings-view'
import { getProfile, getPreferences } from '@/lib/profile-queries'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, preferences] = await Promise.all([getProfile(), getPreferences()])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground mb-4">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Torna ai task
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Profilo e Impostazioni</h1>
          <p className="text-muted-foreground mt-1">Gestisci il tuo profilo e le preferenze dell&apos;app</p>
        </div>
        <SettingsView
          email={user.email ?? ''}
          profile={profile}
          preferences={preferences}
        />
      </div>
    </main>
  )
}
