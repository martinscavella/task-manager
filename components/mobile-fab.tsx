'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createTask } from '@/lib/actions'
import { LabelCombobox } from './label-combobox'
import { STATUS_CONFIG, PRIORITY_CONFIG, isBugLabel, type TaskPriority, type TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function MobileFab() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(3)
  const [status, setStatus] = useState<TaskStatus>('TO_BE_STARTED')
  const [label, setLabel] = useState('')
  const [dueDate, setDueDate] = useState(today)
  const [note, setNote] = useState('')
  const [jiraUrl, setJiraUrl] = useState('')
  const [jiraKey, setJiraKey] = useState('')
  const [code, setCode] = useState('')
  const [info, setInfo] = useState('')

  const isBug = isBugLabel(label)

  const resetForm = () => {
    setTitle('')
    setPriority(3)
    setStatus('TO_BE_STARTED')
    setLabel('')
    setDueDate(today())
    setNote('')
    setJiraUrl('')
    setJiraKey('')
    setCode('')
    setInfo('')
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleCreate = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({
        title: title.trim(),
        priority,
        status,
        label: label.trim() || null,
        due_date: dueDate || null,
        note: note.trim() || null,
        jira_url: isBug ? (jiraUrl.trim() || null) : null,
        jira_key: isBug ? (jiraKey.trim() || null) : null,
        code: isBug ? (code.trim() || null) : null,
        info: isBug ? (info.trim() || null) : null,
      })
      handleClose()
      router.refresh()
    })
  }

  // Shared input/label classes
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'
  const inputCls = 'w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring'
  const selectCls = 'w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring appearance-none'

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 z-50 md:hidden transition-transform duration-300 ease-out',
          open ? 'bottom-0 translate-y-0' : 'bottom-0 translate-y-full pointer-events-none'
        )}
      >
        <div
          className="bg-background rounded-t-3xl border-t border-border shadow-2xl flex flex-col"
          style={{ maxHeight: '92dvh', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Handle + header */}
          <div className="px-4 pt-4 shrink-0">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold">Nuovo task</p>
              <button onClick={handleClose} className="text-muted-foreground p-1 -mr-1">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Scrollable form */}
          <div className="overflow-y-auto px-4 pb-2 space-y-4">

            {/* Titolo */}
            <div>
              <label className={labelCls}>Titolo *</label>
              <input
                autoFocus={open}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Inserisci il titolo del task"
                className={inputCls}
              />
            </div>

            {/* Priorità + Stato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Priorità</label>
                <select
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value) as TaskPriority)}
                  className={selectCls}
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Stato</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  className={selectCls}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Etichetta */}
            <div>
              <label className={labelCls}>Etichetta</label>
              <LabelCombobox value={label} onChange={setLabel} className="w-full" />
            </div>

            {/* Scadenza */}
            <div>
              <label className={labelCls}>Scadenza</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Note */}
            <div>
              <label className={labelCls}>Note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Aggiungi note aggiuntive..."
                rows={3}
                className={cn(inputCls, 'resize-none')}
              />
            </div>

            {/* Bug / Jira — solo se etichetta = Bug */}
            {isBug && (
              <div className="border border-red-200 rounded-2xl p-4 bg-red-50 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  Bug / Jira Tracking
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jira Key</label>
                    <input value={jiraKey} onChange={e => setJiraKey(e.target.value)} placeholder="PROJ-123" className={cn(inputCls, 'font-mono')} />
                  </div>
                  <div>
                    <label className={labelCls}>Jira Link</label>
                    <input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="https://jira..." type="url" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Codice / Commit</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="abc1234, feature/bug-fix" className={cn(inputCls, 'font-mono')} />
                </div>
                <div>
                  <label className={labelCls}>Info aggiuntive</label>
                  <textarea value={info} onChange={e => setInfo(e.target.value)} placeholder="Stack trace, note tecniche..." rows={2} className={cn(inputCls, 'resize-none')} />
                </div>
              </div>
            )}

          </div>

          {/* Footer fisso */}
          <div className="px-4 pt-3 shrink-0">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || isPending}
              className="w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {isPending ? 'Creazione...' : 'Crea task'}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed z-50 md:hidden right-4 shadow-lg rounded-full size-14 flex items-center justify-center transition-all duration-200 active:scale-90',
          'bg-foreground text-background',
          'bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)]'
        )}
        aria-label="Nuovo task"
      >
        <div className={cn('transition-transform duration-200', open && 'rotate-45')}>
          <Plus className="size-6" />
        </div>
      </button>
    </>
  )
}
