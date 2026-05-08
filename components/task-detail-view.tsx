'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PencilIcon, TrashIcon, Ban, Check, X, MoreHorizontalIcon, ExternalLink } from 'lucide-react'
import { deleteTask, updateTask, updateTaskStatus } from '@/lib/actions'
import { TaskWorkflowStepper } from './task-workflow-stepper'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task, type TaskPriority, type TaskStatus } from '@/lib/types'
import { getDueDateStatus, formatDateWithStatus, formatDate } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'

interface TaskDetailViewProps {
  task: Task
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b last:border-0">
      <dt className="text-sm font-medium text-muted-foreground flex items-start pt-0.5">{label}</dt>
      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, startSaving] = useTransition()
  const [deleting, setDeleting] = useState(false)

  // Editable fields
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<TaskPriority>(task.priority as TaskPriority)
  const [status, setStatus] = useState<TaskStatus>(task.status as TaskStatus)
  const [label, setLabel] = useState(task.label || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [note, setNote] = useState(task.note || '')
  const [jiraKey, setJiraKey] = useState(task.jira_key || '')
  const [jiraUrl, setJiraUrl] = useState(task.jira_url || '')
  const [code, setCode] = useState(task.code || '')
  const [info, setInfo] = useState(task.info || '')

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'
  const dueDateStatus = getDueDateStatus(task.due_date, task.status)
  const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority]

  const handleSave = () => {
    if (!title.trim()) return
    startSaving(async () => {
      await updateTask({
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
      setEditing(false)
      router.refresh()
    })
  }

  const handleCancel = () => {
    // Reset to original values
    setTitle(task.title)
    setPriority(task.priority as TaskPriority)
    setStatus(task.status as TaskStatus)
    setLabel(task.label || '')
    setDueDate(task.due_date || '')
    setNote(task.note || '')
    setJiraKey(task.jira_key || '')
    setJiraUrl(task.jira_url || '')
    setCode(task.code || '')
    setInfo(task.info || '')
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Eliminare questo task?')) return
    setDeleting(true)
    await deleteTask(task.id)
    router.push('/')
  }

  const handleSetBlocked = () => {
    startSaving(async () => {
      await updateTaskStatus(task.id, 'BLOCKED')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header row: title + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-auto py-1 px-2 border-0 border-b rounded-none shadow-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary"
              placeholder="Titolo task"
            />
          ) : (
            <h1 className={cn(
              'text-2xl font-bold text-foreground break-words',
              (isCompleted || isCancelled) && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Creato il {formatDate(task.created_at)}
            {task.completed_at && <> &middot; Completato il {formatDate(task.completed_at)}</>}
          </p>
        </div>

        {/* Action buttons top-right */}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5">
                <Check className="size-3.5" />
                {saving ? 'Salvo...' : 'Salva'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="gap-1.5">
                <X className="size-3.5" />
                Annulla
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
              <PencilIcon className="size-3.5" />
              Modifica
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSetBlocked} disabled={saving}>
                <Ban className="size-4" />Blocca
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={deleting}>
                <TrashIcon className="size-4" />
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Workflow stepper */}
      <div className="border rounded-lg px-4 py-3 bg-muted/20 overflow-x-auto">
        <TaskWorkflowStepper task={task} />
      </div>

      {/* Main fields — CRM style */}
      <div className="border rounded-lg divide-y overflow-hidden">
        <div className="px-4 py-3 bg-muted/30">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dettagli</h2>
        </div>
        <dl className="px-4">
          <Field label="Stato">
            {editing ? (
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                STATUS_CONFIG[task.status]?.bgColor,
                STATUS_CONFIG[task.status]?.color
              )}>
                {STATUS_CONFIG[task.status]?.label}
              </span>
            )}
          </Field>

          <Field label="Priorità">
            {editing ? (
              <Select value={priority.toString()} onValueChange={(v) => setPriority(Number(v) as TaskPriority)}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={cn(
                'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                priorityConfig.bgColor,
                priorityConfig.color
              )}>
                {priorityConfig.label}
              </span>
            )}
          </Field>

          <Field label="Etichetta">
            {editing ? (
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 w-48"
                placeholder="es. FASE 2"
              />
            ) : (
              <span className="text-foreground">{task.label || <span className="text-muted-foreground">—</span>}</span>
            )}
          </Field>

          <Field label="Scadenza">
            {editing ? (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 w-48"
              />
            ) : task.due_date ? (
              <span className={cn(
                'font-medium',
                dueDateStatus === 'overdue' && 'text-red-600',
                dueDateStatus === 'due-today' && 'text-orange-600',
              )}>
                {formatDateWithStatus(task.due_date, dueDateStatus)}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>

          <Field label="Note">
            {editing ? (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] resize-y"
                placeholder="Note aggiuntive..."
              />
            ) : task.note ? (
              <p className="whitespace-pre-wrap leading-relaxed">{task.note}</p>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
        </dl>
      </div>

      {/* Jira / Bug Tracking */}
      <div className="border rounded-lg divide-y overflow-hidden">
        <div className="px-4 py-3 bg-muted/30">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jira / Bug Tracking</h2>
        </div>
        <dl className="px-4">
          <Field label="Jira Key">
            {editing ? (
              <Input
                value={jiraKey}
                onChange={(e) => setJiraKey(e.target.value)}
                className="h-8 w-48 font-mono"
                placeholder="es. PROJ-123"
              />
            ) : task.jira_key ? (
              <span className="font-mono bg-muted/40 px-2 py-0.5 rounded text-xs">{task.jira_key}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>

          <Field label="Jira Link">
            {editing ? (
              <Input
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                className="h-8"
                placeholder="https://jira..."
                type="url"
              />
            ) : task.jira_url ? (
              <a
                href={task.jira_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >
                Apri Jira <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>

          <Field label="Codice / Commit">
            {editing ? (
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-8 font-mono"
                placeholder="es. abc1234"
              />
            ) : task.code ? (
              <span className="font-mono bg-muted/40 px-2 py-0.5 rounded text-xs break-all">{task.code}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>

          <Field label="Info aggiuntive">
            {editing ? (
              <Textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className="min-h-[80px] resize-y"
                placeholder="Stack trace, note tecniche..."
              />
            ) : task.info ? (
              <p className="whitespace-pre-wrap leading-relaxed bg-muted/30 p-2 rounded text-xs">{task.info}</p>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Field>
        </dl>
      </div>
    </div>
  )
}
