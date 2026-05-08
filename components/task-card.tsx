'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, PencilIcon, TrashIcon, ChevronRight, ChevronLeft, Ban } from 'lucide-react'
import { deleteTask, updateTaskStatus } from '@/lib/actions'
import { EditTaskDialog } from './edit-task-dialog'
import { TaskDetailSheet } from './task-detail-sheet'
import { TaskWorkflowStepper } from './task-workflow-stepper'
import { StepBadge } from './step-badge'
import { STATUS_CONFIG, PRIORITY_CONFIG, WORKFLOW_STEPS, type Task, type TaskStatus, type TaskPriority } from '@/lib/types'
import { getDueDateStatus, formatDateWithStatus } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  compact?: boolean
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    setDeleting(false)
  }

  const handleNextStatus = async () => {
    const currentIndex = WORKFLOW_STEPS.indexOf(task.status)
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      await updateTaskStatus(task.id, WORKFLOW_STEPS[currentIndex + 1])
    }
  }

  const handlePrevStatus = async () => {
    const currentIndex = WORKFLOW_STEPS.indexOf(task.status)
    if (currentIndex > 0) {
      await updateTaskStatus(task.id, WORKFLOW_STEPS[currentIndex - 1])
    }
  }

  const handleSetBlocked = async () => {
    await updateTaskStatus(task.id, 'BLOCKED')
  }

  const handleSetCancelled = async () => {
    await updateTaskStatus(task.id, 'CANCELLED')
  }

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'
  const isBlocked = task.status === 'BLOCKED'
  
  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const dueDateStatus = getDueDateStatus(task.due_date, task.status)

  const currentStepIndex = WORKFLOW_STEPS.indexOf(task.status)
  const canGoNext = currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length - 1
  const canGoPrev = currentStepIndex > 0

  if (compact) {
    return (
      <>
        <div
          onClick={() => setDetailOpen(true)}
          className={cn(
            'flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-sm cursor-pointer hover:bg-card/80',
            (isCompleted || isCancelled) && 'opacity-60',
            isBlocked && 'border-red-200 bg-red-50/50'
          )}>
          {/* Quick status navigation */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={handlePrevStatus}
              disabled={!canGoPrev}
              className="h-6 w-6"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <TaskWorkflowStepper task={task} compact />
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={handleNextStatus}
              disabled={!canGoNext}
              className="h-6 w-6"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Title and badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'font-medium truncate',
                (isCompleted || isCancelled) && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
              <StepBadge variant="compact" step={statusConfig.label} />
              <Badge className={cn('text-xs shrink-0', priorityConfig.bgColor, priorityConfig.color)} variant="outline">
                {priorityConfig.label}
              </Badge>
              {task.label && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {task.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Due date */}
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

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 shrink-0">
                <MoreHorizontalIcon className="size-3" />
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
                onClick={handleSetCancelled}
              >
                Annulla Task
              </DropdownMenuItem>
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

        <TaskDetailSheet task={task} open={detailOpen} onOpenChange={setDetailOpen} />
        <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      </>
    )
  }

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          'group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-card/50',
          (isCompleted || isCancelled) && 'opacity-60',
          isBlocked && 'border-red-200 bg-red-50/50'
        )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                'font-medium text-foreground',
                (isCompleted || isCancelled) && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h3>
              {task.label && (
                <Badge variant="outline" className="text-xs">
                  {task.label}
                </Badge>
              )}
            </div>
            
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)} variant="outline">
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
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.note}
              </p>
            )}

            {/* Workflow stepper */}
            <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevStatus}
                disabled={!canGoPrev}
                className="h-7"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Indietro
              </Button>
              <div className="flex-1">
                <TaskWorkflowStepper task={task} compact />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextStatus}
                disabled={!canGoNext}
                className="h-7"
              >
                Avanti
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Altre opzioni</span>
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
                onClick={handleSetCancelled}
              >
                Annulla Task
              </DropdownMenuItem>
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
      </div>

      <TaskDetailSheet task={task} open={detailOpen} onOpenChange={setDetailOpen} />
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
