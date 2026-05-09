'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, Ban } from 'lucide-react'
import { deleteTask, updateTaskStatus } from '@/lib/actions'
import { EditTaskDialog } from './edit-task-dialog'
import { TaskWorkflowStepper } from './task-workflow-stepper'
import { StepBadge } from './step-badge'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task, type TaskStatus, type TaskPriority } from '@/lib/types'
import { getDueDateStatus, formatDateWithStatus } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  compact?: boolean
  kanban?: boolean
}

const PRIORITY_ACCENT: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-blue-400',
  5: 'bg-slate-300',
}

/** Striscia colorata in cima alla card — `rounded-t-3xl` segue la card */
function PriorityAccent({ priority }: { priority: number }) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-0 h-[3px] rounded-t-3xl',
        PRIORITY_ACCENT[priority] ?? 'bg-slate-300'
      )}
    />
  )
}

export function TaskCard({ task, compact = false, kanban = false }: TaskCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    setDeleting(false)
  }

  const handleSetBlocked = async () => { await updateTaskStatus(task.id, 'BLOCKED') }
  const handleSetCancelled = async () => { await updateTaskStatus(task.id, 'CANCELLED') }
  const handleCardClick = () => { router.push(`/tasks/${task.id}`) }

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'
  const isBlocked = task.status === 'BLOCKED'

  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority]
  const dueDateStatus = getDueDateStatus(task.due_date, task.status)

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 shrink-0">
          <MoreHorizontalIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          <PencilIcon className="size-4" />Modifica
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSetBlocked}>
          <Ban className="size-4" />Blocca
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSetCancelled}>Annulla Task</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={deleting}>
          <TrashIcon className="size-4" />{deleting ? 'Eliminazione...' : 'Elimina'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // ── KANBAN ────────────────────────────────────────────────
  if (kanban) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className={cn(
            'relative rounded-3xl border bg-card p-3 pt-4 shadow-sm cursor-pointer hover:shadow-md transition-all',
            (isCompleted || isCancelled) && 'opacity-60',
            isBlocked && 'border-red-200 bg-red-50/50'
          )}
        >
          <PriorityAccent priority={task.priority as number} />
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-medium leading-snug flex-1 min-w-0',
              (isCompleted || isCancelled) && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>
            {actionsMenu}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className={cn('text-xs rounded-full', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
              {priorityConfig.label}
            </Badge>
            {task.label && <Badge variant="outline" className="text-xs rounded-full">{task.label}</Badge>}
            {task.due_date && (
              <span className={cn(
                'text-xs font-medium',
                dueDateStatus === 'overdue' && 'text-red-600',
                dueDateStatus === 'due-today' && 'text-orange-600',
                dueDateStatus === 'upcoming' && 'text-muted-foreground'
              )}>
                {formatDateWithStatus(task.due_date, dueDateStatus)}
              </span>
            )}
          </div>
        </div>
        <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      </>
    )
  }

  // ── COMPACT ─────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <div
          onClick={handleCardClick}
          className={cn(
            'relative flex items-center gap-2 rounded-3xl border bg-card px-3 py-2.5 pt-3',
            'shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-card/80',
            (isCompleted || isCancelled) && 'opacity-60',
            isBlocked && 'border-red-200 bg-red-50/50'
          )}
        >
          <PriorityAccent priority={task.priority as number} />
          <div className="shrink-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <TaskWorkflowStepper task={task} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'font-medium truncate text-sm',
                (isCompleted || isCancelled) && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
              <Badge className={cn('text-xs shrink-0 rounded-full', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                {priorityConfig.label}
              </Badge>
              {task.label && <Badge variant="outline" className="text-xs shrink-0 rounded-full">{task.label}</Badge>}
            </div>
          </div>
          {task.due_date && (
            <span className={cn(
              'text-xs shrink-0 font-medium',
              dueDateStatus === 'overdue' && 'text-red-600',
              dueDateStatus === 'due-today' && 'text-orange-600',
              dueDateStatus === 'upcoming' && 'text-muted-foreground'
            )}>
              {formatDateWithStatus(task.due_date, dueDateStatus)}
            </span>
          )}
          {actionsMenu}
        </div>
        <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      </>
    )
  }

  // ── GRID / CARDS ──────────────────────────────────────────
  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'relative group rounded-3xl border bg-card p-4 pt-5',
          'shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-card/50',
          (isCompleted || isCancelled) && 'opacity-60',
          isBlocked && 'border-red-200 bg-red-50/50'
        )}
      >
        <PriorityAccent priority={task.priority as number} />
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                'font-medium text-foreground',
                (isCompleted || isCancelled) && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h3>
              {task.label && <Badge variant="outline" className="text-xs rounded-full">{task.label}</Badge>}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={cn('rounded-full', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                {priorityConfig.label}
              </Badge>
              <StepBadge variant="full" step={statusConfig.label} />
              {task.due_date && (
                <span className={cn(
                  'text-xs font-medium',
                  dueDateStatus === 'overdue' && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-600',
                  dueDateStatus === 'upcoming' && 'text-muted-foreground'
                )}>
                  {formatDateWithStatus(task.due_date, dueDateStatus)}
                </span>
              )}
            </div>
            {task.note && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{task.note}</p>
            )}
            <div className="mt-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <TaskWorkflowStepper task={task} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm"><MoreHorizontalIcon className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}><PencilIcon className="size-4" />Modifica</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSetBlocked}><Ban className="size-4" />Blocca</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSetCancelled}>Annulla Task</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={deleting}>
                <TrashIcon className="size-4" />{deleting ? 'Eliminazione...' : 'Elimina'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
