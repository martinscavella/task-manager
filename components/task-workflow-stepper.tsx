'use client'

import { WORKFLOW_STEPS, STATUS_CONFIG, type Task, type TaskStatus } from '@/lib/types'
import { updateTaskStatus } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { Check, Circle, AlertCircle, X } from 'lucide-react'
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
  const isCompleted = task.status === 'COMPLETED'

  const handleStepClick = (status: TaskStatus) => {
    if (isPending) return
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
    })
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', isPending && 'opacity-50')}>
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = step === task.status
            const isPast = currentStepIndex > index
            const config = STATUS_CONFIG[step]

            return (
              <Tooltip key={step}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={isPending}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all hover:scale-125',
                      isActive && 'ring-2 ring-offset-1 ring-current',
                      isPast ? 'bg-emerald-500' : isActive ? config.bgColor.replace('bg-', 'bg-') : 'bg-gray-200'
                    )}
                    style={{
                      backgroundColor: isPast ? '#10b981' : isActive ? undefined : undefined
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{config.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
          {(isBlocked || isCancelled) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  isBlocked ? 'bg-red-500' : 'bg-stone-400'
                )} />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isBlocked ? 'Bloccato' : 'Annullato'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('relative', isPending && 'opacity-50 pointer-events-none')}>
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
        <div 
          className="absolute top-4 left-4 h-0.5 bg-emerald-500 transition-all duration-300"
          style={{ 
            width: isCompleted 
              ? 'calc(100% - 2rem)' 
              : `calc(${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}% - 1rem)` 
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = step === task.status
            const isPast = currentStepIndex > index
            const config = STATUS_CONFIG[step]

            return (
              <Tooltip key={step}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={isPending}
                    className={cn(
                      'flex flex-col items-center gap-2 group',
                      'transition-all hover:scale-105'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        'border-2',
                        isPast && 'bg-emerald-500 border-emerald-500 text-white',
                        isActive && !isPast && `${config.bgColor} border-current ${config.color}`,
                        !isPast && !isActive && 'bg-white border-gray-300 text-gray-400 group-hover:border-gray-400'
                      )}
                    >
                      {isPast ? (
                        <Check className="w-4 h-4" />
                      ) : isActive ? (
                        <Circle className="w-3 h-3 fill-current" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-medium max-w-[60px] text-center leading-tight',
                      isActive ? config.color : isPast ? 'text-emerald-600' : 'text-gray-400'
                    )}>
                      {config.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clicca per passare a: {config.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Special states */}
        {(isBlocked || isCancelled) && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            {isBlocked && (
              <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                Task Bloccato
              </span>
            )}
            {isCancelled && (
              <span className="flex items-center gap-1 text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                <X className="w-4 h-4" />
                Task Annullato
              </span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
