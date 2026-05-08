'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, Ban, ExternalLink } from 'lucide-react'
import { deleteTask } from '@/lib/actions'
import { EditTaskDialog } from './edit-task-dialog'
import { TaskWorkflowStepper } from './task-workflow-stepper'
import { StepBadge } from './step-badge'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getDueDateStatus, formatDateWithStatus, formatDate } from '@/lib/due-date-utils'

interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!task) return null

  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'
  const isBlocked = task.status === 'BLOCKED'

  const dueDateStatus = getDueDateStatus(task.due_date, task.status)
  const formattedDueDate = formatDateWithStatus(task.due_date, dueDateStatus)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    setDeleting(false)
    onOpenChange(false)
  }

  const handleSetBlocked = async () => {
    // Will be handled via EditTaskDialog
    setEditOpen(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle className={cn(
              'text-2xl font-bold',
              (isCompleted || isCancelled) && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status and Priority */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Stato</p>
                  <StepBadge variant="full" step={statusConfig.label} />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Priorità</p>
                  <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                    {priorityConfig.label}
                  </Badge>
                </div>

                {task.label && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Etichetta</p>
                    <Badge variant="outline">{task.label}</Badge>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <PencilIcon className="size-4" />
                    Modifica
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSetBlocked}>
                    <Ban className="size-4" />
                    Blocca
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <TrashIcon className="size-4" />
                    {deleting ? 'Eliminazione...' : 'Elimina'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Due Date */}
            {task.due_date && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Scadenza</p>
                <p className={cn(
                  'text-sm font-medium',
                  dueDateStatus === 'overdue' && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-600',
                  dueDateStatus === 'upcoming' && 'text-foreground'
                )}>
                  {formattedDueDate}
                </p>
              </div>
            )}

            {/* Created At */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Creato il</p>
              <p className="text-sm text-foreground">
                {formatDate(task.created_at)}
              </p>
            </div>

            {/* Workflow Progress */}
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-3">Workflow</p>
              <div className="flex justify-center py-4 px-2 bg-muted/30 rounded-lg">
                <TaskWorkflowStepper task={task} compact={false} />
              </div>
            </div>

            {/* Notes */}
            {task.note && (
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground mb-2">Note</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {task.note}
                </p>
              </div>
            )}

            {/* Jira / Bug Section */}
            {(task.jira_key || task.jira_url || task.code || task.info) && (
              <div className="border-t pt-6">
                <p className="text-sm font-semibold mb-4">Jira / Bug Tracking</p>
                <div className="space-y-3">
                  {task.jira_key && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Jira Key</p>
                      <p className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                        {task.jira_key}
                      </p>
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
                        Apri Jira
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                  {task.code && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Codice / Commit</p>
                      <p className="text-sm font-mono bg-muted/30 px-2 py-1 rounded break-all">
                        {task.code}
                      </p>
                    </div>
                  )}
                  {task.info && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Informazioni Aggiuntive</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">
                        {task.info}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task ID */}
            <div className="border-t pt-6">
              <p className="text-xs text-muted-foreground">ID: {task.id}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
