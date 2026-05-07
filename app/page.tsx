import { getTasks } from '@/lib/actions'
import { TaskList } from '@/components/task-list'

export default async function Home() {
  const tasks = await getTasks()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <TaskList initialTasks={tasks} />
      </div>
    </main>
  )
}
