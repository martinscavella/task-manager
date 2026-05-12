import { Suspense } from 'react'
import { getTaskById, getTasksSidebar } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { TaskDetailView } from '@/components/task-detail-view'
import { TaskDetailSidebar } from '@/components/task-detail-sidebar'
import { BackButton } from '@/components/back-button'
import TaskDetailLoading from './loading'

// Lascia che Next.js gestisca il caching tramite unstable_cache nei data fetcher.
// Non serve force-dynamic: le mutation chiamano revalidateTag.
export const dynamic = 'auto'

async function TaskDetailData({ id }: { id: string }) {
  const task = await getTaskById(id)
  if (!task) notFound()
  return <TaskDetailView task={task} />
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Sidebar usa query leggera (solo 6 colonne, in cache)
  const tasks = await getTasksSidebar()

  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar sinistra */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 px-4 py-4 border-b">
            <BackButton
              label="Task"
              fallback="/"
              forcePush
              className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            />
          </div>
          <TaskDetailSidebar tasks={tasks as any} currentId={id} />
        </aside>

        {/* Main content — il dettaglio parte in Suspense per non bloccare il layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="lg:hidden w-full" style={{ height: 'env(safe-area-inset-top, 44px)' }} />
          <div className="mx-auto max-w-4xl px-4 pb-8 lg:py-8">
            <div className="mb-6 lg:hidden">
              <BackButton label="Torna ai task" fallback="/" forcePush />
            </div>
            <Suspense fallback={<TaskDetailLoading />}>
              <TaskDetailData id={id} />
            </Suspense>
          </div>
        </div>

      </div>
    </main>
  )
}
