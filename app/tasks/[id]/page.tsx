import { getTaskById } from '@/lib/actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { getDueDateStatus, formatDateWithStatus, formatDate } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'
import { TaskDetailActions } from '@/components/task-detail-actions'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const task = await getTaskById(id)

  if (!task) notFound()

  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'
  const dueDateStatus = getDueDateStatus(task.due_date, task.status)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Torna ai task
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className={cn(
            'text-3xl font-bold text-foreground break-words',
            (isCompleted || isCancelled) && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Creato il {formatDate(task.created_at)}
            {task.completed_at && ` · Completato il ${formatDate(task.completed_at)}`}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Badge className={cn(statusConfig.bgColor, statusConfig.color)} variant="outline">
            {statusConfig.label}
          </Badge>
          <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)} variant="outline">
            {priorityConfig.label}
          </Badge>
          {task.label && (
            <Badge variant="outline">{task.label}</Badge>
          )}
          {task.due_date && (
            <Badge variant="outline" className={cn(
              dueDateStatus === 'overdue' && 'border-red-300 text-red-600',
              dueDateStatus === 'due-today' && 'border-orange-300 text-orange-600',
            )}>
              📅 {formatDateWithStatus(task.due_date, dueDateStatus)}
            </Badge>
          )}
        </div>

        {/* Actions (client component) */}
        <TaskDetailActions task={task} />

        {/* Note */}
        {task.note && (
          <section className="mt-8 border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Note</h2>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{task.note}</p>
          </section>
        )}

        {/* Jira / Bug Tracking */}
        {(task.jira_key || task.jira_url || task.code || task.info) && (
          <section className="mt-6 border rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Jira / Bug Tracking</h2>
            {task.jira_key && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Jira Key</p>
                <p className="text-sm font-mono bg-muted/40 px-2 py-1 rounded">{task.jira_key}</p>
              </div>
            )}
            {task.jira_url && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Jira Link</p>
                <a
                  href={task.jira_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Apri Jira <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
            {task.code && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Codice / Commit</p>
                <p className="text-sm font-mono bg-muted/40 px-2 py-1 rounded break-all">{task.code}</p>
              </div>
            )}
            {task.info && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Informazioni aggiuntive</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 p-3 rounded">{task.info}</p>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground">ID: {task.id}</p>
      </div>
    </main>
  )
}
