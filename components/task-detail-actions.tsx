'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PencilIcon, TrashIcon, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { deleteTask, updateTaskStatus } from '@/lib/actions'
import { EditTaskDialog } from './edit-task-dialog'
import { TaskWorkflowStepper } from './task-workflow-stepper'
import { WORKFLOW_STEPS, type Task } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskDetailActionsProps {
  task: Task
}

export function TaskDetailActions({ task }: TaskDetailActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentStepIndex = WORKFLOW_STEPS.indexOf(task.status)
  const canGoNext = currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length - 1
  const canGoPrev = currentStepIndex > 0

  const handleNextStatus = () => {
    if (canGoNext) startTransition(async () => {
      await updateTaskStatus(task.id, WORKFLOW_STEPS[currentStepIndex + 1])
    })
  }

  const handlePrevStatus = () => {
    if (canGoPrev) startTransition(async () => {
      await updateTaskStatus(task.id, WORKFLOW_STEPS[currentStepIndex - 1])
    })
  }

  const handleSetBlocked = () => {
    startTransition(async () => {
      await updateTaskStatus(task.id, 'BLOCKED')
    })
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    router.push('/')
  }

  return (
    <>
      {/* Workflow stepper */}
      <div className={cn(
        'border rounded-lg p-4 bg-muted/20',
        isPending && 'opacity-50 pointer-events-none'
      )}>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Workflow</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStatus}
            disabled={!canGoPrev || isPending}
            className="h-8 shrink-0"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Indietro
          </Button>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <TaskWorkflowStepper task={task} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextStatus}
            disabled={!canGoNext || isPending}
            className="h-8 shrink-0"
          >
            Avanti
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2">
          <PencilIcon className="size-4" />
          Modifica
        </Button>
        <Button variant="outline" size="sm" onClick={handleSetBlocked} disabled={isPending} className="gap-2">
          <Ban className="size-4" />
          Blocca
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="gap-2 ml-auto"
        >
          <TrashIcon className="size-4" />
          {deleting ? 'Eliminazione...' : 'Elimina'}
        </Button>
      </div>

      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
