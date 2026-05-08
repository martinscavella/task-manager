'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react'

interface StepBadgeProps {
  step: string
  variant?: 'compact' | 'full'
}

// Color mapping for different step values
const STEP_COLOR_MAP: Record<string, { bg: string; text: string; icon?: React.ReactNode }> = {
  'Backlog': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Da iniziare': { bg: 'bg-gray-100', text: 'text-gray-700' },
  'In attesa requisiti': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'In corso': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'In review': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'In test': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Bloccato': { bg: 'bg-red-100', text: 'text-red-700' },
  'Completato': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Annullato': { bg: 'bg-stone-100', text: 'text-stone-700' },
}

function getStepIcon(step: string) {
  switch (step) {
    case 'Completato':
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'In corso':
      return <Clock className="h-3.5 w-3.5" />
    case 'Bloccato':
      return <AlertCircle className="h-3.5 w-3.5" />
    default:
      return <Circle className="h-3.5 w-3.5" />
  }
}

function getStepAbbreviation(step: string): string {
  const words = step.split(' ')
  if (words.length === 1) return step.substring(0, 2).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 2)
}

export function StepBadge({ step, variant = 'full' }: StepBadgeProps) {
  const colorConfig = STEP_COLOR_MAP[step] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  const icon = getStepIcon(step)
  const abbreviation = getStepAbbreviation(step)

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'h-6 w-6 rounded-full flex-shrink-0',
          'text-xs font-medium',
          colorConfig.bg,
          colorConfig.text,
          'inline-flex'
        )}
        title={step}
      >
        {abbreviation}
      </div>
    )
  }

  // Full variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 min-w-0',
        'px-2.5 py-1 rounded-full',
        'text-xs font-medium shrink-0',
        'max-w-full',
        colorConfig.bg,
        colorConfig.text
      )}
    >
      <span className="flex items-center flex-shrink-0">
        {icon}
      </span>
      <span className="truncate">
        {step}
      </span>
    </div>
  )
}
