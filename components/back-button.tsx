'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  className?: string
  fallback?: string
}

export function BackButton({
  label = 'Indietro',
  className,
  fallback = '/',
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Se c'è storia nel browser, torna indietro; altrimenti vai al fallback
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
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
