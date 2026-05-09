import { getTasks, getTaskAnalytics } from '@/lib/actions'
import { getProfile, getPreferences } from '@/lib/profile-actions'
import { TaskList } from '@/components/task-list'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { DashboardWidgets } from '@/components/dashboard-widgets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, ListTodo, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UserMenuButton } from '@/components/user-menu-button'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [tasks, analytics, profile, preferences] = await Promise.all([
    getTasks(),
    getTaskAnalytics(),
    getProfile(),
    getPreferences(),
  ])

  const firstName = profile?.first_name || (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || user?.email?.split('@')[0] || 'Ciao'
  const lastName = profile?.last_name ?? ''
  const displayName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Header con saluto */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <UserMenuButton displayName={displayName} email={user?.email ?? ''} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="size-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="size-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="size-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardWidgets
              tasks={tasks}
              preferences={preferences}
              firstName={firstName}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList tasks={tasks} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard data={analytics} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
