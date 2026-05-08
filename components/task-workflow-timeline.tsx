'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { STATUS_CONFIG, type Task, type TaskStatus } from '@/lib/types'
import { updateTaskStatus } from '@/lib/actions'
import { cn } from '@/lib/utils'

const MAIN_STEPS: TaskStatus[] = [
  'BACKLOG',
  'TO_BE_STARTED',
  'WAITING_REQUIREMENTS',
  'IN_PROGRESS',
  'IN_REVIEW',
  'IN_TEST',
  'COMPLETED',
]

const TERMINAL_STEPS: TaskStatus[] = ['BLOCKED', 'CANCELLED']

function getStepOrder(status: TaskStatus): number {
  const idx = MAIN_STEPS.indexOf(status)
  return idx === -1 ? 999 : idx
}

interface TaskWorkflowTimelineProps {
  task: Task
}

export function TaskWorkflowTimeline({ task }: TaskWorkflowTimelineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = (status: TaskStatus) => {
    if (isPending || status === task.status) return
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
      router.refresh()
    })
  }

  const currentOrder = getStepOrder(task.status as TaskStatus)
  const isTerminal = TERMINAL_STEPS.includes(task.status as TaskStatus)

  return (
    <div className={cn('space-y-4', isPending && 'opacity-50 pointer-events-none')}>
      {/* Main pipeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

        <div className="space-y-1">
          {MAIN_STEPS.map((status, index) => {
            const config = STATUS_CONFIG[status]
            const isActive = task.status === status
            const isPast = !isTerminal && currentOrder > index
            const isFuture = isTerminal ? true : currentOrder < index

            return (
              <button
                key={status}
                onClick={() => handleClick(status)}
                disabled={isPending}
                className={cn(
                  'relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all group',
                  isActive ? 'bg-accent' : 'hover:bg-muted/50'
                )}
              >
                {/* Dot */}
                <span className={cn(
                  'relative z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-colors',
                  isActive && cn('border-current', config.color, config.bgColor),
                  isPast && 'border-emerald-500 bg-emerald-500',
                  isFuture && !isActive && 'border-border bg-background',
                )}>
                  {isPast && <Check className="size-2.5 text-white" strokeWidth={3} />}
                  {isActive && (
                    <span className={cn('w-1.5 h-1.5 rounded-full', config.color.replace('text-', 'bg-'))} />
                  )}
                </span>

                {/* Label */}
                <span className={cn(
                  'text-sm font-medium transition-colors flex-1',
                  isActive && 'text-foreground',
                  isPast && 'text-emerald-700',
                  isFuture && !isActive && 'text-muted-foreground',
                )}>
                  {config.label}
                </span>

                {/* Active badge */}
                {isActive && (
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                    config.bgColor, config.color
                  )}>
                    Attivo
                  </span>
                )}

                {/* Hover hint */}
                {!isActive && (
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Imposta
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Terminal states */}
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">Stati speciali</p>
        <div className="flex gap-2">
          {TERMINAL_STEPS.map((status) => {
            const config = STATUS_CONFIG[status]
            const isActive = task.status === status
            return (
              <button
                key={status}
                onClick={() => handleClick(status)}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  isActive
                    ? cn(config.bgColor, config.color, 'border-current shadow-sm')
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isActive ? config.color.replace('text-', 'bg-') : 'bg-muted-foreground'
                )} />
                {config.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
