'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task, type TaskPriority, type TaskStatus } from '@/lib/types'
import { getDueDateStatus } from '@/lib/due-date-utils'
import { useState, useMemo } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TaskDetailSidebarProps {
  tasks: Task[]
  currentId: string
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  BLOCKED: 0,
  IN_PROGRESS: 1,
  IN_TEST: 2,
  IN_REVIEW: 3,
  WAITING_REQUIREMENTS: 4,
  TO_BE_STARTED: 5,
  BACKLOG: 6,
  COMPLETED: 7,
  CANCELLED: 8,
}

export function TaskDetailSidebar({ tasks, currentId }: TaskDetailSidebarProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks
      .filter(t =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.label?.toLowerCase().includes(q)
      )
      .sort((a, b) => STATUS_ORDER[a.status as TaskStatus] - STATUS_ORDER[b.status as TaskStatus])
  }, [tasks, search])

  const activeTasks = filtered.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const doneTasks = filtered.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  const renderTask = (task: Task) => {
    const isCurrent = task.id === currentId
    const statusConfig = STATUS_CONFIG[task.status as TaskStatus]
    const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority]
    const dueDateStatus = getDueDateStatus(task.due_date, task.status)

    return (
      <button
        key={task.id}
        onClick={() => router.push(`/tasks/${task.id}`)}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-lg transition-all group',
          isCurrent
            ? 'bg-accent border border-border shadow-sm'
            : 'hover:bg-muted/60'
        )}
      >
        <div className="flex items-start gap-2">
          {/* Status dot */}
          <span className={cn(
            'mt-1 w-2 h-2 rounded-full shrink-0',
            statusConfig.color.replace('text-', 'bg-')
          )} />

          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-xs font-medium leading-snug truncate',
              isCurrent ? 'text-foreground' : 'text-foreground/80',
              (task.status === 'COMPLETED' || task.status === 'CANCELLED') && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                priorityConfig.bgColor,
                priorityConfig.color
              )}>
                {priorityConfig.label}
              </span>

              {task.label && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {task.label}
                </span>
              )}

              {task.due_date && (
                <span className={cn(
                  'text-[10px] font-medium ml-auto shrink-0',
                  dueDateStatus === 'overdue' && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-500',
                  dueDateStatus === 'upcoming' && 'text-muted-foreground'
                )}>
                  {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 py-3 border-b">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {activeTasks.length === 0 && doneTasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Nessun task trovato</p>
        )}

        {activeTasks.map(renderTask)}

        {doneTasks.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Completati / Annullati ({doneTasks.length})
              </p>
            </div>
            {doneTasks.map(renderTask)}
          </>
        )}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t">
        <p className="text-[10px] text-muted-foreground">{filtered.length} task</p>
      </div>
    </div>
  )
}
