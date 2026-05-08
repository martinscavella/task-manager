import { Suspense } from 'react'
import { getTaskById } from '@/lib/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TaskDetailView } from '@/components/task-detail-view'
import TaskDetailLoading from './loading'

// Forza rendering dinamico — nessun tentativo di cache statica
export const dynamic = 'force-dynamic'

async function TaskDetailData({ id }: { id: string }) {
  const task = await getTaskById(id)
  if (!task) notFound()
  return <TaskDetailView task={task} />
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Torna ai task
            </Link>
          </Button>
        </div>
        {/* Suspense: mostra skeleton mentre il server fetcha il task */}
        <Suspense fallback={<TaskDetailLoading />}>
          <TaskDetailData id={id} />
        </Suspense>
      </div>
    </main>
  )
}
