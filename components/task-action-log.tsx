'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Plus, Trash2, Check, X, Pencil, ExternalLink } from 'lucide-react'
import {
  ACTION_TYPE_CONFIG,
  TECHNOLOGY_CONFIGS,
  CHANGE_STATUS_CONFIG,
  type ActionLogEntry,
  type ActionLogActionType,
  type ChangeStatus,
  type CreateActionLogInput,
  type UpdateActionLogInput,
} from '@/lib/types'
import { createActionLog, updateActionLog, deleteActionLog } from '@/lib/actions'
import { formatDate } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'

const DEFAULT_TECHNOLOGY = 'salesforce'

/** Lookup sicuro: protegge da stringhe vuote, null, undefined e chiavi non mappate */
function getTechConfig(value: string | null | undefined) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return TECHNOLOGY_CONFIGS[key] || TECHNOLOGY_CONFIGS.generic
}

// Riga vuota per il form di aggiunta
const EMPTY_ROW = {
  technology: DEFAULT_TECHNOLOGY,
  action_type: 'component' as ActionLogActionType,
  metadata_type: '',
  custom_metadata_type: '',
  change_status: 'new' as ChangeStatus,
  title: '',
  description: '',
  component_ref: '',
}

type RowDraft = typeof EMPTY_ROW

interface EditState {
  id: string
  draft: RowDraft
}

interface Props {
  taskId: string
  initialLogs: ActionLogEntry[]
}

// Componente cella select riutilizzabile (evita ripetizioni)
function CellSelect({
  value, onChange, options, placeholder, className,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('h-7 text-xs border-0 shadow-none bg-transparent focus:ring-1 focus:ring-ring', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function draftFromEntry(log: ActionLogEntry): RowDraft {
  return {
    technology: log.technology,
    action_type: log.action_type,
    metadata_type: log.metadata_type,
    custom_metadata_type: '',
    change_status: log.change_status,
    title: log.title,
    description: log.description ?? '',
    component_ref: log.component_ref ?? '',
  }
}

function MetadataTypeCell({
  technology,
  value,
  customValue,
  onChange,
  onCustomChange,
}: {
  technology: string
  value: string
  customValue: string
  onChange: (v: string) => void
  onCustomChange: (v: string) => void
}) {
  const opts = getTechConfig(technology).defaultMetadataTypes
  const isCustom = value === '__custom__'
  return (
    <div className="flex flex-col gap-0.5">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs border-0 shadow-none bg-transparent focus:ring-1 focus:ring-ring">
          <SelectValue placeholder="Tipo..." />
        </SelectTrigger>
        <SelectContent>
          {opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          <SelectItem value="__custom__">+ Personalizzato...</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <Input
          autoFocus
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder="Tipo personalizzato"
          className="h-6 text-xs px-1.5 border-0 border-b rounded-none shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  )
}

function resolveMetadataType(draft: RowDraft): string {
  return draft.metadata_type === '__custom__' ? draft.custom_metadata_type.trim() : draft.metadata_type
}

export function TaskActionLog({ taskId, initialLogs }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addingRow, setAddingRow] = useState(false)
  const [newDraft, setNewDraft] = useState<RowDraft>({ ...EMPTY_ROW })
  const [editState, setEditState] = useState<EditState | null>(null)

  // Determina la tecnologia prevalente nei log esistenti per il badge header
  const dominantTech = initialLogs[0]?.technology ?? DEFAULT_TECHNOLOGY
  const techConfig = getTechConfig(dominantTech)

  const handleAdd = () => {
    const resolved = resolveMetadataType(newDraft)
    if (!newDraft.title.trim() || !resolved) return
    const payload: CreateActionLogInput = {
      task_id: taskId,
      action_type: newDraft.action_type,
      technology: newDraft.technology,
      metadata_type: resolved,
      change_status: newDraft.change_status,
      title: newDraft.title.trim(),
      description: newDraft.description.trim() || null,
      component_ref: newDraft.component_ref.trim() || null,
    }
    startTransition(async () => {
      await createActionLog(payload)
      setNewDraft({ ...EMPTY_ROW })
      setAddingRow(false)
      router.refresh()
    })
  }

  const handleSaveEdit = (id: string) => {
    if (!editState) return
    const resolved = resolveMetadataType(editState.draft)
    if (!editState.draft.title.trim() || !resolved) return
    const payload: UpdateActionLogInput = {
      id,
      action_type: editState.draft.action_type,
      technology: editState.draft.technology,
      metadata_type: resolved,
      change_status: editState.draft.change_status,
      title: editState.draft.title.trim(),
      description: editState.draft.description.trim() || null,
      component_ref: editState.draft.component_ref.trim() || null,
    }
    startTransition(async () => {
      await updateActionLog(payload)
      setEditState(null)
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Eliminare questa voce?')) return
    startTransition(async () => {
      await deleteActionLog(id, taskId)
      router.refresh()
    })
  }

  const techOptions = Object.entries(TECHNOLOGY_CONFIGS).map(([k, v]) => ({ value: k, label: v.label }))
  const actionTypeOptions = Object.entries(ACTION_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))
  const changeStatusOptions = Object.entries(CHANGE_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))

  return (
    <div className={cn('border rounded-lg overflow-hidden', techConfig.borderColor)}>

      {/* ── Header ── */}
      <div className={cn('px-4 py-3 flex items-center justify-between', techConfig.bgColor)}>
        <h2 className={cn('text-xs font-semibold uppercase tracking-wider flex items-center gap-2', techConfig.color)}>
          <span className={cn(
            'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border',
            techConfig.bgColor, techConfig.color, techConfig.borderColor
          )}>
            {techConfig.badge}
          </span>
          Action Log sviluppo
          <span className={cn(
            'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
            techConfig.bgColor, techConfig.color, techConfig.borderColor
          )}>
            {initialLogs.length}
          </span>
        </h2>
        <Button
          size="sm" variant="ghost"
          className={cn('h-7 gap-1', techConfig.color)}
          onClick={() => { setAddingRow(true); setEditState(null) }}
          disabled={addingRow}
        >
          <Plus className="size-3.5" /> Aggiungi
        </Button>
      </div>

      {/* ── Tabella ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30 text-muted-foreground">
              <th className="text-left font-medium px-3 py-2 w-[90px]">Tecnologia</th>
              <th className="text-left font-medium px-3 py-2 w-[110px]">Tipo metadato</th>
              <th className="text-left font-medium px-3 py-2 w-[90px]">Stato</th>
              <th className="text-left font-medium px-3 py-2 w-[100px]">Tipo azione</th>
              <th className="text-left font-medium px-3 py-2">Nome / Titolo</th>
              <th className="text-left font-medium px-3 py-2 w-[160px]">Path / Ref</th>
              <th className="text-left font-medium px-3 py-2 w-[80px]">Data</th>
              <th className="px-3 py-2 w-[64px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y">

            {/* Riga nuova (form) */}
            {addingRow && (
              <tr className={cn('bg-muted/10')}>
                {/* Tecnologia */}
                <td className="px-2 py-1.5">
                  <CellSelect
                    value={newDraft.technology}
                    onChange={v => setNewDraft(d => ({ ...d, technology: v, metadata_type: '' }))}
                    options={techOptions}
                  />
                </td>
                {/* Tipo metadato */}
                <td className="px-2 py-1.5">
                  <MetadataTypeCell
                    technology={newDraft.technology}
                    value={newDraft.metadata_type}
                    customValue={newDraft.custom_metadata_type}
                    onChange={v => setNewDraft(d => ({ ...d, metadata_type: v }))}
                    onCustomChange={v => setNewDraft(d => ({ ...d, custom_metadata_type: v }))}
                  />
                </td>
                {/* Stato */}
                <td className="px-2 py-1.5">
                  <CellSelect
                    value={newDraft.change_status}
                    onChange={v => setNewDraft(d => ({ ...d, change_status: v as ChangeStatus }))}
                    options={changeStatusOptions}
                  />
                </td>
                {/* Tipo azione */}
                <td className="px-2 py-1.5">
                  <CellSelect
                    value={newDraft.action_type}
                    onChange={v => setNewDraft(d => ({ ...d, action_type: v as ActionLogActionType }))}
                    options={actionTypeOptions}
                  />
                </td>
                {/* Titolo */}
                <td className="px-2 py-1.5">
                  <Input
                    autoFocus
                    value={newDraft.title}
                    onChange={e => setNewDraft(d => ({ ...d, title: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAddingRow(false); setNewDraft({ ...EMPTY_ROW }) } }}
                    placeholder="Nome componente / descrizione"
                    className="h-7 text-xs border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-1"
                  />
                </td>
                {/* Path */}
                <td className="px-2 py-1.5">
                  <Input
                    value={newDraft.component_ref}
                    onChange={e => setNewDraft(d => ({ ...d, component_ref: e.target.value }))}
                    placeholder="force-app/.../MyClass.cls"
                    className="h-7 text-xs font-mono border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-1"
                  />
                </td>
                {/* Data placeholder */}
                <td className="px-3 py-1.5 text-muted-foreground">—</td>
                {/* Actions */}
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={handleAdd}
                      disabled={pending || !newDraft.title.trim() || !resolveMetadataType(newDraft)}
                      className="p-1 rounded hover:bg-emerald-50 hover:text-emerald-600 text-muted-foreground transition-colors disabled:opacity-40"
                      aria-label="Salva"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      onClick={() => { setAddingRow(false); setNewDraft({ ...EMPTY_ROW }) }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                      aria-label="Annulla"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Righe esistenti */}
            {initialLogs.length === 0 && !addingRow ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                  Nessuna azione registrata. Clicca «Aggiungi» per iniziare.
                </td>
              </tr>
            ) : (
              initialLogs.map(log => {
                const isEditing = editState?.id === log.id
                const draft = isEditing ? editState!.draft : null
                const logTech = getTechConfig(log.technology)
                const changeConf = CHANGE_STATUS_CONFIG[log.change_status] ?? CHANGE_STATUS_CONFIG.new

                return (
                  <tr
                    key={log.id}
                    className={cn(
                      'group transition-colors',
                      isEditing ? 'bg-muted/20' : 'hover:bg-muted/10'
                    )}
                  >
                    {/* Tecnologia */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <CellSelect
                          value={draft!.technology}
                          onChange={v => setEditState(s => s ? { ...s, draft: { ...s.draft, technology: v, metadata_type: '' } } : s)}
                          options={techOptions}
                        />
                      ) : (
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border',
                          logTech.bgColor, logTech.color, logTech.borderColor
                        )}>
                          {logTech.badge}
                        </span>
                      )}
                    </td>

                    {/* Tipo metadato */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <MetadataTypeCell
                          technology={draft!.technology}
                          value={draft!.metadata_type}
                          customValue={draft!.custom_metadata_type}
                          onChange={v => setEditState(s => s ? { ...s, draft: { ...s.draft, metadata_type: v } } : s)}
                          onCustomChange={v => setEditState(s => s ? { ...s, draft: { ...s.draft, custom_metadata_type: v } } : s)}
                        />
                      ) : (
                        <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {log.metadata_type}
                        </span>
                      )}
                    </td>

                    {/* Stato modifica */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <CellSelect
                          value={draft!.change_status}
                          onChange={v => setEditState(s => s ? { ...s, draft: { ...s.draft, change_status: v as ChangeStatus } } : s)}
                          options={changeStatusOptions}
                        />
                      ) : (
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                          changeConf.bgColor, changeConf.color, changeConf.borderColor
                        )}>
                          {changeConf.label}
                        </span>
                      )}
                    </td>

                    {/* Tipo azione */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <CellSelect
                          value={draft!.action_type}
                          onChange={v => setEditState(s => s ? { ...s, draft: { ...s.draft, action_type: v as ActionLogActionType } } : s)}
                          options={actionTypeOptions}
                        />
                      ) : (
                        <span className="text-muted-foreground">{ACTION_TYPE_CONFIG[log.action_type]?.label}</span>
                      )}
                    </td>

                    {/* Nome / Titolo */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={draft!.title}
                          onChange={e => setEditState(s => s ? { ...s, draft: { ...s.draft, title: e.target.value } } : s)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(log.id); if (e.key === 'Escape') setEditState(null) }}
                          className="h-7 text-xs border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-1"
                        />
                      ) : (
                        <span className="font-medium text-foreground">{log.title}</span>
                      )}
                    </td>

                    {/* Path / Ref */}
                    <td className="px-3 py-2 max-w-[160px]">
                      {isEditing ? (
                        <Input
                          value={draft!.component_ref}
                          onChange={e => setEditState(s => s ? { ...s, draft: { ...s.draft, component_ref: e.target.value } } : s)}
                          className="h-7 text-xs font-mono border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-1"
                        />
                      ) : log.component_ref ? (
                        <Link
                          href={`/components/${encodeURIComponent(log.component_ref)}`}
                          className="font-mono text-[11px] text-sky-600 hover:text-sky-700 hover:underline truncate block max-w-[150px]"
                          title={log.component_ref}
                        >
                          {log.component_ref}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-0.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(log.id)}
                              disabled={pending}
                              className="p-1 rounded hover:bg-emerald-50 hover:text-emerald-600 text-muted-foreground transition-colors disabled:opacity-40"
                              aria-label="Salva"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setEditState(null)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                              aria-label="Annulla"
                            >
                              <X className="size-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditState({ id: log.id, draft: draftFromEntry(log) }); setAddingRow(false) }}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                              aria-label="Modifica"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(log.id)}
                              disabled={pending}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-all"
                              aria-label="Elimina"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
