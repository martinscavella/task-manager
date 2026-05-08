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
import { updateTask } from '@/lib/actions'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task, type TaskPriority, type TaskStatus } from '@/lib/types'

interface EditTaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [label, setLabel] = useState(task.label || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [note, setNote] = useState(task.note || '')
  const [jiraUrl, setJiraUrl] = useState(task.jira_url || '')
  const [jiraKey, setJiraKey] = useState(task.jira_key || '')
  const [code, setCode] = useState(task.code || '')
  const [info, setInfo] = useState(task.info || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const result = await updateTask({
        id: task.id,
        title: title.trim(),
        priority,
        status,
        label: label.trim() || null,
        due_date: dueDate || null,
        note: note.trim() || null,
        jira_url: jiraUrl.trim() || null,
        jira_key: jiraKey.trim() || null,
        code: code.trim() || null,
        info: info.trim() || null,
      })

      if (result.success) {
        onOpenChange(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifica Task</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli del task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Titolo *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci il titolo del task"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priorità</Label>
                <Select
                  value={priority.toString()}
                  onValueChange={(v) => setPriority(Number(v) as TaskPriority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Stato</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TaskStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-label">Etichetta</Label>
                <Input
                  id="edit-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="es. Lavoro, Personale"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-dueDate">Scadenza</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aggiungi note aggiuntive..."
                rows={3}
              />
            </div>

            {/* Jira/Bug Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-4">Jira / Bug Tracking</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-jiraKey">Jira Key</Label>
                  <Input
                    id="edit-jiraKey"
                    value={jiraKey}
                    onChange={(e) => setJiraKey(e.target.value)}
                    placeholder="es. PROJ-123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-jiraUrl">Jira Link</Label>
                  <Input
                    id="edit-jiraUrl"
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.target.value)}
                    placeholder="https://jira.example.com/..."
                    type="url"
                  />
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="edit-code">Codice / Commit</Label>
                <Input
                  id="edit-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="es. abc1234, feature/bug-fix"
                />
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="edit-info">Informazioni Aggiuntive</Label>
                <Textarea
                  id="edit-info"
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  placeholder="Note tecniche, stack trace, ecc..."
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
