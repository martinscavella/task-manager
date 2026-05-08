'use client'

import { STATUS_CONFIG, type Task, type TaskStatus } from '@/lib/types'
import { updateTaskStatus } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TaskWorkflowStepperProps {
  task: Task
  compact?: boolean
}

// Steps always visible in the stepper
const BASE_STEPS: TaskStatus[] = ['TO_BE_STARTED', 'IN_PROGRESS', 'IN_TEST', 'COMPLETED']

// States that are "extra" - shown as an additional badge when active
const EXTRA_STATES: TaskStatus[] = ['BACKLOG', 'WAITING_REQUIREMENTS', 'IN_REVIEW', 'BLOCKED', 'CANCELLED']

export function TaskWorkflowStepper({ task }: TaskWorkflowStepperProps) {
  const [isPending, startTransition] = useTransition()

  const handleStepClick = (status: TaskStatus) => {
    if (isPending) return
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
    })
  }

  const currentIsExtra = EXTRA_STATES.includes(task.status as TaskStatus)

  // Find which base step is "active" when current status is an extra one
  const getActiveBaseIndex = (): number => {
    if (!currentIsExtra) return BASE_STEPS.indexOf(task.status as TaskStatus)
    switch (task.status) {
      case 'BACKLOG': return -1
      case 'WAITING_REQUIREMENTS': return 0 // before IN_PROGRESS
      case 'IN_REVIEW': return 2 // after IN_TEST
      case 'BLOCKED': return BASE_STEPS.indexOf('IN_PROGRESS')
      case 'CANCELLED': return -1
      default: return -1
    }
  }

  const activeBaseIndex = getActiveBaseIndex()

  return (
    <TooltipProvider>
      <div className={cn(
        'inline-flex items-center gap-1 rounded-full bg-stone-100 p-1 flex-wrap',
        isPending && 'opacity-50 pointer-events-none'
      )}>
        {BASE_STEPS.map((step, index) => {
          const config = STATUS_CONFIG[step]
          const isActive = task.status === step
          const isPast = !currentIsExtra
            ? BASE_STEPS.indexOf(task.status as TaskStatus) > index
            : index < activeBaseIndex

          return (
            <div key={step} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={isPending}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-all rounded-full whitespace-nowrap',
                      'hover:bg-stone-200/80',
                      isActive && 'bg-white shadow-sm text-stone-900',
                      !isActive && isPast && 'text-stone-600',
                      !isActive && !isPast && 'text-stone-400'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      {config.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Passa a: {config.label}
                </TooltipContent>
              </Tooltip>

              {index < BASE_STEPS.length - 1 && (
                <span className={cn(
                  'w-1 h-1 rounded-full mx-0.5 shrink-0',
                  isPast ? 'bg-stone-400' : 'bg-stone-300'
                )} />
              )}
            </div>
          )
        })}

        {/* Extra state badge — shown only when task is in an "extra" status */}
        {currentIsExtra && (
          <>
            <span className="w-1 h-1 rounded-full mx-0.5 bg-stone-300 shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full bg-white shadow-sm whitespace-nowrap',
                  task.status === 'BLOCKED' && 'text-red-600',
                  task.status === 'CANCELLED' && 'text-stone-500',
                  task.status === 'BACKLOG' && 'text-slate-600',
                  task.status === 'WAITING_REQUIREMENTS' && 'text-amber-700',
                  task.status === 'IN_REVIEW' && 'text-purple-700',
                )}>
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      task.status === 'BLOCKED' && 'bg-red-500',
                      task.status === 'CANCELLED' && 'bg-stone-400',
                      task.status === 'BACKLOG' && 'bg-slate-500',
                      task.status === 'WAITING_REQUIREMENTS' && 'bg-amber-500',
                      task.status === 'IN_REVIEW' && 'bg-purple-500',
                    )} />
                    {STATUS_CONFIG[task.status as TaskStatus].label}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Stato attuale: {STATUS_CONFIG[task.status as TaskStatus].label}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
