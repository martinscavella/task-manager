'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PencilIcon, TrashIcon, Ban } from 'lucide-react'
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
        'border rounded-lg p-4 bg-muted/20 overflow-x-auto',
        isPending && 'opacity-50 pointer-events-none'
      )}>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Workflow</p>
        <TaskWorkflowStepper task={task} />
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
