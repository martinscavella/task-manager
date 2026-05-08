'use client'

import { WORKFLOW_STEPS, STATUS_CONFIG, type Task, type TaskStatus } from '@/lib/types'
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

export function TaskWorkflowStepper({ task, compact = false }: TaskWorkflowStepperProps) {
  const [isPending, startTransition] = useTransition()
  
  const currentStepIndex = WORKFLOW_STEPS.indexOf(task.status as TaskStatus)
  const isBlocked = task.status === 'BLOCKED'
  const isCancelled = task.status === 'CANCELLED'

  const handleStepClick = (status: TaskStatus) => {
    if (isPending) return
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
    })
  }

  // Simplified steps for compact view
  const simpleSteps: TaskStatus[] = ['BACKLOG', 'WAITING_REQUIREMENTS', 'IN_PROGRESS', 'COMPLETED']
  const stepsToShow = compact ? simpleSteps : WORKFLOW_STEPS

  // Find current position in the steps array
  const getCurrentIndex = () => {
    const idx = stepsToShow.indexOf(task.status as TaskStatus)
    if (idx >= 0) return idx // Status found directly in simple steps
    
    // Map full workflow steps to simplified indices
    const fullIdx = WORKFLOW_STEPS.indexOf(task.status as TaskStatus)
    if (fullIdx <= 1) return 0 // BACKLOG or TO_BE_STARTED -> index 0
    if (fullIdx === 2) return 1 // WAITING_REQUIREMENTS -> index 1
    if (fullIdx >= 3 && fullIdx <= 5) return 2 // IN_PROGRESS, IN_REVIEW, IN_TEST -> index 2
    if (fullIdx === 6) return 3 // COMPLETED -> index 3
    return 2 // Default to IN_PROGRESS
  }

  const activeIndex = getCurrentIndex()

  return (
    <TooltipProvider>
      <div className={cn(
        'inline-flex items-center rounded-full bg-stone-100 p-1',
        isPending && 'opacity-50 pointer-events-none'
      )}>
        {stepsToShow.map((step, index) => {
          const config = STATUS_CONFIG[step]
          const isActive = task.status === step || (compact && activeIndex === index && !stepsToShow.includes(task.status as TaskStatus))
          const isPast = compact ? index < activeIndex : currentStepIndex > WORKFLOW_STEPS.indexOf(step)
          const isFirst = index === 0
          const isLast = index === stepsToShow.length - 1

          return (
            <div key={step} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={isPending}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-all rounded-full',
                      'hover:bg-stone-200/80',
                      isActive && 'bg-white shadow-sm text-stone-900',
                      !isActive && isPast && 'text-stone-600',
                      !isActive && !isPast && 'text-stone-400'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                      {config.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Passa a: {config.label}
                </TooltipContent>
              </Tooltip>

              {/* Connector dot */}
              {!isLast && (
                <span className={cn(
                  'w-1 h-1 rounded-full mx-0.5',
                  isPast ? 'bg-stone-400' : 'bg-stone-300'
                )} />
              )}
            </div>
          )
        })}

        {/* Blocked/Cancelled indicator */}
        {(isBlocked || isCancelled) && (
          <>
            <span className="w-1 h-1 rounded-full mx-0.5 bg-stone-300" />
            <span className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full bg-white shadow-sm',
              isBlocked ? 'text-red-600' : 'text-stone-500'
            )}>
              <span className="flex items-center gap-1.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isBlocked ? 'bg-red-500' : 'bg-stone-400'
                )} />
                {isBlocked ? 'Bloccato' : 'Annullato'}
              </span>
            </span>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
