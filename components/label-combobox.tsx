'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { PREDEFINED_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const LS_KEY = 'task-manager:custom-labels'

function getStoredLabels(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveStoredLabels(labels: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(labels))
}

interface LabelComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LabelCombobox({ value, onChange, placeholder = 'Seleziona etichetta...', className }: LabelComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customLabels, setCustomLabels] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCustomLabels(getStoredLabels())
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const allLabels = [
    ...PREDEFINED_LABELS,
    ...customLabels.filter(l => !PREDEFINED_LABELS.map(p => p.toLowerCase()).includes(l.toLowerCase())),
  ]

  const filtered = allLabels.filter(l =>
    l.toLowerCase().includes(search.toLowerCase())
  )

  const canCreate =
    search.trim().length > 0 &&
    !allLabels.some(l => l.toLowerCase() === search.trim().toLowerCase())

  const handleSelect = (label: string) => {
    onChange(label === value ? '' : label)
    setSearch('')
    setOpen(false)
  }

  const handleCreate = () => {
    const newLabel = search.trim()
    if (!newLabel) return
    const updated = [...customLabels, newLabel]
    setCustomLabels(updated)
    saveStoredLabels(updated)
    onChange(newLabel)
    setSearch('')
    setOpen(false)
  }

  const handleRemoveCustom = (label: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = customLabels.filter(l => l !== label)
    setCustomLabels(updated)
    saveStoredLabels(updated)
    if (value === label) onChange('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-8 justify-between font-normal', className)}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </span>
            )}
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="Cerca o crea..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) handleCreate()
              if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0])
            }}
            className="h-7 text-sm"
          />
        </div>
        <div className="max-h-52 overflow-y-auto py-1">
          {filtered.map((label) => {
            const isCustom = !PREDEFINED_LABELS.map(p => p.toLowerCase()).includes(label.toLowerCase())
            return (
              <div
                key={label}
                onClick={() => handleSelect(label)}
                className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-accent text-sm rounded-sm mx-1"
              >
                <span className="flex items-center gap-2">
                  <Check className={cn('size-3.5 shrink-0', value === label ? 'opacity-100' : 'opacity-0')} />
                  {label}
                </span>
                {isCustom && (
                  <button
                    onClick={(e) => handleRemoveCustom(label, e)}
                    className="text-muted-foreground hover:text-destructive ml-2"
                    title="Rimuovi etichetta"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && !canCreate && (
            <p className="text-sm text-muted-foreground text-center py-3">Nessuna etichetta trovata</p>
          )}
          {canCreate && (
            <div
              onClick={handleCreate}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent text-sm rounded-sm mx-1 text-primary"
            >
              <Plus className="size-3.5 shrink-0" />
              Crea &ldquo;{search.trim()}&rdquo;
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
