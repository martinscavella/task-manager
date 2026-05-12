'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  className?: string
  fallback?: string
  /** Se true, usa router.push(fallback) direttamente invece di router.back() */
  forcePush?: boolean
}

export function BackButton({
  label = 'Indietro',
  className,
  fallback = '/',
  forcePush = false,
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (forcePush || window.history.length <= 1) {
      router.push(fallback)
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn('gap-2 -ml-2 text-muted-foreground hover:text-foreground', className)}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  )
}
