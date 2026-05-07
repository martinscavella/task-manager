import { getTasks, getTaskAnalytics } from '@/lib/actions'
import { TaskList } from '@/components/task-list'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, ListTodo } from 'lucide-react'

export default async function Home() {
  const [tasks, analytics] = await Promise.all([
    getTasks(),
    getTaskAnalytics()
  ])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground mt-1">Gestisci i tuoi task e monitora i progressi</p>
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
