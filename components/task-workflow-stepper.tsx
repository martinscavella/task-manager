'use client'

import { STATUS_CONFIG, type Task, type TaskStatus } from '@/lib/types'
import { updateTaskStatus } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'

interface TaskWorkflowStepperProps {
  task: Task
  showTooltips?: boolean
}

const BASE_STEPS: TaskStatus[] = ['TO_BE_STARTED', 'IN_PROGRESS', 'IN_TEST', 'COMPLETED']
const EXTRA_STATES: TaskStatus[] = ['BACKLOG', 'WAITING_REQUIREMENTS', 'IN_REVIEW', 'BLOCKED', 'CANCELLED']

const EXTRA_STYLES: Record<string, { dot: string; text: string }> = {
  BLOCKED: { dot: 'bg-red-500', text: 'text-red-600' },
  CANCELLED: { dot: 'bg-stone-400', text: 'text-stone-500' },
  BACKLOG: { dot: 'bg-slate-500', text: 'text-slate-600' },
  WAITING_REQUIREMENTS: { dot: 'bg-amber-500', text: 'text-amber-700' },
  IN_REVIEW: { dot: 'bg-purple-500', text: 'text-purple-700' },
}

export function TaskWorkflowStepper({ task, showTooltips = false }: TaskWorkflowStepperProps) {
  const [isPending, startTransition] = useTransition()

  const handleStepClick = (status: TaskStatus) => {
    if (isPending) return
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
    })
  }

  const currentIsExtra = EXTRA_STATES.includes(task.status as TaskStatus)

  const getActiveBaseIndex = (): number => {
    if (!currentIsExtra) return BASE_STEPS.indexOf(task.status as TaskStatus)
    switch (task.status) {
      case 'BACKLOG': return -1
      case 'WAITING_REQUIREMENTS': return 0
      case 'IN_REVIEW': return 2
      case 'BLOCKED': return BASE_STEPS.indexOf('IN_PROGRESS')
      case 'CANCELLED': return -1
      default: return -1
    }
  }

  const activeBaseIndex = getActiveBaseIndex()
  const extraStyle = currentIsExtra ? EXTRA_STYLES[task.status] : null

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-stone-100 p-1',
        isPending && 'opacity-50 pointer-events-none'
      )}
    >
      {BASE_STEPS.map((step, index) => {
        const config = STATUS_CONFIG[step]
        const isActive = task.status === step
        const isPast = !currentIsExtra
          ? BASE_STEPS.indexOf(task.status as TaskStatus) > index
          : index < activeBaseIndex

        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => handleStepClick(step)}
              disabled={isPending}
              title={showTooltips ? `Passa a: ${config.label}` : config.label}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-all rounded-full whitespace-nowrap',
                'hover:bg-stone-200/80',
                isActive && 'bg-white shadow-sm text-stone-900',
                !isActive && isPast && 'text-stone-500',
                !isActive && !isPast && 'text-stone-400'
              )}
            >
              <span className="flex items-center gap-1">
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                {config.label}
              </span>
            </button>

            {index < BASE_STEPS.length - 1 && (
              <span className={cn(
                'w-1 h-1 rounded-full mx-0.5 shrink-0',
                isPast ? 'bg-stone-400' : 'bg-stone-300'
              )} />
            )}
          </div>
        )
      })}

      {/* Extra state badge */}
      {currentIsExtra && extraStyle && (
        <>
          <span className="w-1 h-1 rounded-full mx-0.5 bg-stone-300 shrink-0" />
          <span
            title={STATUS_CONFIG[task.status as TaskStatus].label}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full bg-white shadow-sm whitespace-nowrap',
              extraStyle.text
            )}
          >
            <span className="flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', extraStyle.dot)} />
              {STATUS_CONFIG[task.status as TaskStatus].label}
            </span>
          </span>
        </>
      )}
    </div>
  )
}
