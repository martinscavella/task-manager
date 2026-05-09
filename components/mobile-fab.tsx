'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createTask } from '@/lib/actions'
import { cn } from '@/lib/utils'

export function MobileFab() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCreate = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({
        title: title.trim(),
        priority: 3,
        status: 'TO_BE_STARTED',
        label: null,
        due_date: null,
        note: null,
        jira_url: null,
        jira_key: null,
        code: null,
        info: null,
      })
      setTitle('')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet crea task */}
      <div className={cn(
        'fixed inset-x-0 z-50 md:hidden transition-transform duration-300 ease-out',
        open ? 'bottom-0 translate-y-0' : 'bottom-0 translate-y-full'
      )}>
        <div className="bg-background rounded-t-3xl border-t border-border px-4 pt-4 pb-safe shadow-2xl">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <p className="text-sm font-semibold mb-3">Nuovo task</p>
          <input
            autoFocus={open}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Titolo del task..."
            className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring mb-3"
          />
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isPending}
            className="w-full rounded-xl bg-foreground text-background py-3 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {isPending ? 'Creazione...' : 'Crea task'}
          </button>
          <div className="h-4" />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed z-50 md:hidden right-4 shadow-lg rounded-full size-14 flex items-center justify-center transition-all duration-200 active:scale-90',
          'bg-foreground text-background',
          open ? 'bottom-[calc(var(--sheet-h,320px)+1rem)]' : 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)]'
        )}
        aria-label="Nuovo task"
      >
        <div className={cn('transition-transform duration-200', open && 'rotate-45')}>
          {open ? <X className="size-6" /> : <Plus className="size-6" />}
        </div>
      </button>
    </>
  )
}
