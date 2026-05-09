'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusIcon } from 'lucide-react'
import { createTask } from '@/lib/actions'
import { LabelCombobox } from './label-combobox'
import { STATUS_CONFIG, PRIORITY_CONFIG, isBugLabel, type TaskPriority, type TaskStatus } from '@/lib/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const result = await createTask({
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
      if (result.success) {
        resetForm()
        setOpen(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          Nuovo Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crea Nuovo Task</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo task alla lista.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Titolo */}
            <div className="grid gap-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci il titolo del task"
                required
              />
            </div>

            {/* Priorità + Stato */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priorità</Label>
                <Select value={priority.toString()} onValueChange={(v) => setPriority(Number(v) as TaskPriority)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Stato</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Etichetta + Scadenza */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Etichetta</Label>
                <LabelCombobox value={label} onChange={setLabel} className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Scadenza</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aggiungi note aggiuntive..."
                rows={3}
              />
            </div>

            {/* Jira section — solo se etichetta = Bug */}
            {isBug && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  Bug / Jira Tracking
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="jiraKey">Jira Key</Label>
                    <Input id="jiraKey" value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} placeholder="es. PROJ-123" className="font-mono h-8" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jiraUrl">Jira Link</Label>
                    <Input id="jiraUrl" value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} placeholder="https://jira..." type="url" className="h-8" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Codice / Commit</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="es. abc1234, feature/bug-fix" className="font-mono h-8" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="info">Info aggiuntive</Label>
                  <Textarea id="info" value={info} onChange={(e) => setInfo(e.target.value)} placeholder="Stack trace, note tecniche..." rows={2} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false) }}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Creazione...' : 'Crea Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
