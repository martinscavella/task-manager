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
import { Plus, Trash2, ChevronDown, ChevronUp, Code2, Wrench, Rocket, Settings2, Database } from 'lucide-react'
import {
  ACTION_TYPE_CONFIG,
  TECHNOLOGY_CONFIGS,
  type ActionLogEntry,
  type ActionLogActionType,
  type CreateActionLogInput,
} from '@/lib/types'
import { createActionLog, deleteActionLog } from '@/lib/actions'
import { formatDate } from '@/lib/due-date-utils'
import { cn } from '@/lib/utils'

const ACTION_ICONS: Record<ActionLogActionType, React.ElementType> = {
  component:        Code2,
  metadata:         Database,
  manual_procedure: Wrench,
  deploy:           Rocket,
  config:           Settings2,
}

const DEFAULT_TECHNOLOGY = 'salesforce'

interface Props {
  taskId: string
  initialLogs: ActionLogEntry[]
}

export function TaskActionLog({ taskId, initialLogs }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()

  // Form state
  const [technology, setTechnology] = useState(DEFAULT_TECHNOLOGY)
  const [actionType, setActionType] = useState<ActionLogActionType>('component')
  const [metadataType, setMetadataType] = useState('')
  const [customMetadataType, setCustomMetadataType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [componentRef, setComponentRef] = useState('')

  const techConfig = TECHNOLOGY_CONFIGS[technology] ?? TECHNOLOGY_CONFIGS.generic
  const metadataOptions = techConfig.defaultMetadataTypes
  const isCustom = metadataType === '__custom__'
  const resolvedMetadataType = isCustom ? customMetadataType.trim() : metadataType

  const resetForm = () => {
    setTechnology(DEFAULT_TECHNOLOGY)
    setActionType('component')
    setMetadataType('')
    setCustomMetadataType('')
    setTitle('')
    setDescription('')
    setComponentRef('')
    setAdding(false)
  }

  const handleAdd = () => {
    if (!title.trim() || !resolvedMetadataType) return
    const payload: CreateActionLogInput = {
      task_id: taskId,
      action_type: actionType,
      technology,
      metadata_type: resolvedMetadataType,
      title: title.trim(),
      description: description.trim() || null,
      component_ref: componentRef.trim() || null,
    }
    startTransition(async () => {
      await createActionLog(payload)
      resetForm()
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Eliminare questa voce del log?')) return
    startTransition(async () => {
      await deleteActionLog(id, taskId)
      router.refresh()
    })
  }

  return (
    <div className={cn('border rounded-lg divide-y overflow-hidden', techConfig.borderColor)}>
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', techConfig.bgColor)}>
        <h2 className={cn('text-xs font-semibold uppercase tracking-wider flex items-center gap-2', techConfig.color)}>
          <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold', techConfig.bgColor, techConfig.color, 'border', techConfig.borderColor)}>
            {techConfig.badge}
          </span>
          Action Log sviluppo
          <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium', techConfig.bgColor, techConfig.color, 'border', techConfig.borderColor)}>
            {initialLogs.length}
          </span>
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className={cn('h-7 gap-1', techConfig.color)}
          onClick={() => setAdding(v => !v)}
        >
          <Plus className="size-3.5" />
          Aggiungi
        </Button>
      </div>

      {/* Form aggiunta */}
      {adding && (
        <div className={cn('px-4 py-4 space-y-3', techConfig.bgColor, 'bg-opacity-40')}>

          {/* Riga 1: Tecnologia + Tipo azione */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Tecnologia</label>
              <Select value={technology} onValueChange={(v) => { setTechnology(v); setMetadataType('') }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TECHNOLOGY_CONFIGS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] font-bold">{cfg.badge}</span>
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Tipo azione</label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as ActionLogActionType)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Riga 2: Tipo metadato (picklist con opzione custom) */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Tipo metadato</label>
            <Select value={metadataType} onValueChange={setMetadataType}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Seleziona tipo..." />
              </SelectTrigger>
              <SelectContent>
                {metadataOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
                <SelectItem value="__custom__">+ Valore personalizzato...</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                placeholder="Inserisci tipo metadato personalizzato"
                value={customMetadataType}
                onChange={e => setCustomMetadataType(e.target.value)}
                className="h-8 mt-1.5"
                autoFocus
              />
            )}
          </div>

          {/* Riga 3: Titolo */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Titolo *</label>
            <Input
              placeholder="es. Creato LWC per gestione account"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Riga 4: Riferimento componente */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Riferimento / Path</label>
            <Input
              placeholder="es. force-app/main/.../accountManager/accountManager.js"
              value={componentRef}
              onChange={e => setComponentRef(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>

          {/* Riga 5: Descrizione */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Descrizione / Note</label>
            <Textarea
              placeholder="Dettagli sulla modifica, procedura eseguita, motivazione..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-16 resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button size="sm" variant="outline" onClick={resetForm} disabled={pending}>
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={pending || !title.trim() || !resolvedMetadataType}
            >
              {pending ? 'Salvo...' : 'Salva voce'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista log */}
      {initialLogs.length === 0 && !adding ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">
          Nessuna azione registrata per questo task.
        </p>
      ) : (
        <ul className="divide-y">
          {initialLogs.map(log => {
            const Icon = ACTION_ICONS[log.action_type] ?? Wrench
            const logTechConfig = TECHNOLOGY_CONFIGS[log.technology] ?? TECHNOLOGY_CONFIGS.generic
            const isExpanded = expanded[log.id] ?? false
            const hasDetails = log.description || log.component_ref

            return (
              <li key={log.id} className="px-4 py-3 group hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Icona tipo azione */}
                  <div className={cn(
                    'mt-0.5 flex items-center justify-center w-6 h-6 rounded-md shrink-0',
                    logTechConfig.bgColor, logTechConfig.color
                  )}>
                    <Icon className="size-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badge tecnologia + tipo metadato */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold',
                        logTechConfig.bgColor, logTechConfig.color, 'border', logTechConfig.borderColor
                      )}>
                        {logTechConfig.badge}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {log.metadata_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ACTION_TYPE_CONFIG[log.action_type]?.label}
                      </span>
                    </div>

                    {/* Titolo */}
                    <p className="text-sm font-medium text-foreground leading-snug">{log.title}</p>

                    {/* Ref componente (sempre visibile se presente) */}
                    {log.component_ref && !isExpanded && (
                      <p className="mt-0.5 text-xs font-mono text-muted-foreground truncate max-w-xs">
                        {log.component_ref}
                      </p>
                    )}

                    {/* Dettagli espansi */}
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {log.component_ref && (
                          <p className="font-mono bg-muted/40 px-2 py-1 rounded break-all">{log.component_ref}</p>
                        )}
                        {log.description && (
                          <p className="whitespace-pre-wrap leading-relaxed">{log.description}</p>
                        )}
                      </div>
                    )}

                    {/* Data */}
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(log.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {hasDetails && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [log.id]: !isExpanded }))}
                        className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                        aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
                      >
                        {isExpanded
                          ? <ChevronUp className="size-3.5" />
                          : <ChevronDown className="size-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={pending}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-all"
                      aria-label="Elimina voce"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
