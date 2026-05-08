import { getTasks, getTaskAnalytics, signOut } from '@/lib/actions'
import { TaskList } from '@/components/task-list'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, ListTodo, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [tasks, analytics] = await Promise.all([
    getTasks(),
    getTaskAnalytics()
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
            <p className="text-muted-foreground mt-1">Gestisci i tuoi task e monitora i progressi</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit" className="gap-2">
                <LogOut className="size-4" />
                Esci
              </Button>
            </form>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="size-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="size-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

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
