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
import { MoreHorizontalIcon, PencilIcon, TrashIcon, Ban, ChevronRight } from 'lucide-react'
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

const PRIORITY_BORDER_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#fb923c',
  3: '#facc15',
  4: '#60a5fa',
  5: '#cbd5e1',
}

const PRIORITY_DOT: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-blue-400',
  5: 'bg-slate-300',
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
  const borderColor = PRIORITY_BORDER_COLOR[task.priority as number] ?? '#cbd5e1'
  const dotColor = PRIORITY_DOT[task.priority as number] ?? 'bg-slate-300'
  const cardStyle = { borderTopColor: borderColor, borderTopWidth: '3px' }

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon-sm" className="h-8 w-8 shrink-0">
          <MoreHorizontalIcon className="size-4" />
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

  // ── MOBILE LIST (compact su mobile) ─────────────────────────────────────────
  // Layout a riga unica ottimizzato: dot priorità · titolo · stato badge · data · chevron
  const mobileCard = (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 bg-card border-b last:border-b-0 cursor-pointer active:bg-muted/50 transition-colors',
          (isCompleted || isCancelled) && 'opacity-50',
        )}
      >
        {/* Dot priorità */}
        <span className={cn('size-2 rounded-full shrink-0', dotColor)} />

        {/* Titolo + info secondarie */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium truncate leading-snug',
            (isCompleted || isCancelled) && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Stato */}
            <span className={cn(
              'text-[11px] font-medium px-1.5 py-0.5 rounded-full',
              statusConfig.bgColor, statusConfig.color
            )}>
              {statusConfig.label}
            </span>
            {/* Etichetta */}
            {task.label && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                {task.label}
              </span>
            )}
            {/* Scadenza */}
            {task.due_date && (
              <span className={cn(
                'text-[11px] font-medium ml-auto shrink-0',
                dueDateStatus === 'overdue' && 'text-red-500',
                dueDateStatus === 'due-today' && 'text-orange-500',
                dueDateStatus === 'upcoming' && 'text-muted-foreground'
              )}>
                {formatDateWithStatus(task.due_date, dueDateStatus)}
              </span>
            )}
          </div>
        </div>

        {/* Menu azioni */}
        <div onClick={e => e.stopPropagation()}>{actionsMenu}</div>
      </div>
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )

  // ── KANBAN ───────────────────────────────────────────────────────────────────
  if (kanban) {
    return (
      <>
        <div
          onClick={handleCardClick}
          style={cardStyle}
          className={cn(
            'rounded-2xl border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-all w-full overflow-hidden',
            (isCompleted || isCancelled) && 'opacity-60',
            isBlocked && 'border-red-200 bg-red-50/50'
          )}
        >
          <div className="flex items-start justify-between gap-2 min-w-0">
            <p className={cn(
              'text-sm font-medium leading-snug flex-1 min-w-0 break-words',
              (isCompleted || isCancelled) && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>
            {actionsMenu}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 min-w-0">
            <Badge className={cn('text-xs rounded-full shrink-0', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
              {priorityConfig.label}
            </Badge>
            {task.label && <Badge variant="outline" className="text-xs rounded-full shrink-0 max-w-[100px] truncate">{task.label}</Badge>}
            {task.due_date && (
              <span className={cn(
                'text-xs font-medium shrink-0',
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

  // ── COMPACT (desktop list) — mobile usa mobileCard sopra ─────────────────────
  if (compact) {
    return (
      <>
        {/* Mobile: lista nativa stile iOS */}
        <div className="md:hidden">{mobileCard}</div>

        {/* Desktop: card con stepper */}
        <div
          onClick={handleCardClick}
          style={cardStyle}
          className={cn(
            'hidden md:flex items-center gap-2 rounded-2xl border bg-card px-3 py-3 w-full overflow-hidden',
            'shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-card/80',
            (isCompleted || isCancelled) && 'opacity-60',
            isBlocked && 'border-red-200 bg-red-50/50'
          )}
        >
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <TaskWorkflowStepper task={task} />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className={cn(
              'font-medium text-sm truncate',
              (isCompleted || isCancelled) && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Badge className={cn('text-xs shrink-0 rounded-full', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                {priorityConfig.label}
              </Badge>
              {task.label && (
                <Badge variant="outline" className="text-xs shrink-0 rounded-full max-w-[80px] truncate">{task.label}</Badge>
              )}
              {task.due_date && (
                <span className={cn(
                  'text-xs font-medium shrink-0',
                  dueDateStatus === 'overdue' && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-600',
                  dueDateStatus === 'upcoming' && 'text-muted-foreground'
                )}>
                  {formatDateWithStatus(task.due_date, dueDateStatus)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">{actionsMenu}</div>
        </div>
        <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      </>
    )
  }

  // ── GRID / CARDS (desktop) — mobile usa mobileCard ───────────────────────────
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">{mobileCard}</div>

      {/* Desktop */}
      <div
        onClick={handleCardClick}
        style={cardStyle}
        className={cn(
          'hidden md:block group rounded-2xl border bg-card p-4 w-full overflow-hidden',
          'shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-card/50',
          (isCompleted || isCancelled) && 'opacity-60',
          isBlocked && 'border-red-200 bg-red-50/50'
        )}
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className={cn(
                'font-medium text-foreground truncate',
                (isCompleted || isCancelled) && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h3>
              {task.label && (
                <Badge variant="outline" className="text-xs rounded-full shrink-0 max-w-[100px] truncate">
                  {task.label}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={cn('rounded-full shrink-0', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                {priorityConfig.label}
              </Badge>
              <StepBadge variant="full" step={statusConfig.label} />
              {task.due_date && (
                <span className={cn(
                  'text-xs font-medium shrink-0',
                  dueDateStatus === 'overdue' && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-600',
                  dueDateStatus === 'upcoming' && 'text-muted-foreground'
                )}>
                  {formatDateWithStatus(task.due_date, dueDateStatus)}
                </span>
              )}
            </div>
            {task.note && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 break-words">{task.note}</p>
            )}
            <div className="mt-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <TaskWorkflowStepper task={task} />
            </div>
          </div>
          <div className="shrink-0">
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
      </div>
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
