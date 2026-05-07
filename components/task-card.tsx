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
import { MoreHorizontalIcon, PencilIcon, TrashIcon, CheckIcon } from 'lucide-react'
import { deleteTask, updateTask } from '@/lib/actions'
import { EditTaskDialog } from './edit-task-dialog'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

interface TaskCardProps {
  task: Task
}

const priorityColors: Record<TaskPriority, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-amber-100 text-amber-800 border-amber-200',
  3: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const priorityLabels: Record<TaskPriority, string> = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
}

const statusColors: Record<TaskStatus, string> = {
  'TO_BE_STARTED': 'bg-slate-100 text-slate-800 border-slate-200',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
}

const statusLabels: Record<TaskStatus, string> = {
  'TO_BE_STARTED': 'To Start',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
}

export function TaskCard({ task }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    setDeleting(false)
  }

  const handleToggleComplete = async () => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'TO_BE_STARTED' : 'COMPLETED'
    await updateTask({ id: task.id, status: newStatus })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED'

  return (
    <>
      <div className={`group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium text-foreground ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              {task.label && (
                <Badge variant="outline" className="text-xs">
                  {task.label}
                </Badge>
              )}
            </div>
            
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={priorityColors[task.priority]} variant="outline">
                {priorityLabels[task.priority]}
              </Badge>
              <Badge className={statusColors[task.status]} variant="outline">
                {statusLabels[task.status]}
              </Badge>
              {task.due_date && (
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                  {isOverdue ? 'Overdue: ' : 'Due: '}
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>

            {task.note && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.note}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleComplete}
              className={task.status === 'COMPLETED' ? 'text-green-600' : 'text-muted-foreground'}
            >
              <CheckIcon className="size-4" />
              <span className="sr-only">Toggle complete</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <TrashIcon className="size-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
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
