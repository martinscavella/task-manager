'use client'

import { useState } from 'react'
import { upsertPreferences } from '@/lib/profile-actions'
import type { UserPreferences } from '@/lib/profile-actions'
import type { Task } from '@/lib/types'
import { BarChart3, AlertCircle, Clock, CheckCircle2, GripVertical, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { STATUS_CONFIG, PRIORITY_CONFIG, type TaskPriority } from '@/lib/types'

const WIDGET_META: Record<string, { label: string; icon: React.ElementType }> = {
  stats: { label: 'Statistiche', icon: BarChart3 },
  overdue: { label: 'Scaduti', icon: AlertCircle },
  recent: { label: 'Recenti', icon: Clock },
  completed_week: { label: 'Completati', icon: CheckCircle2 },
}

interface Props {
  tasks: Task[]
  preferences: UserPreferences
  displayName: string
}

export function DashboardWidgets({ tasks, preferences, displayName }: Props) {
  const [widgets, setWidgets] = useState<string[]>(preferences.dashboard_widgets)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Dataset per i widget
  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const overdueTasks = activeTasks.filter(t => t.due_date && new Date(t.due_date) < now).slice(0, 5)
  const recentTasks = [...tasks].slice(0, 5)
  const completedWeek = tasks.filter(t => t.completed_at && new Date(t.completed_at) >= weekAgo)

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Buongiorno'
    if (h < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  const handleSave = async () => {
    setSaving(true)
    await upsertPreferences({ dashboard_widgets: widgets })
    setSaving(false)
    setEditMode(false)
  }

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const next = [...widgets]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setWidgets(next)
    setDragIdx(i)
  }
  const handleDragEnd = () => setDragIdx(null)

  const removeWidget = (id: string) => setWidgets(w => w.filter(x => x !== id))
  const addWidget = (id: string) => setWidgets(w => [...w, id])
  const hiddenWidgets = Object.keys(WIDGET_META).filter(id => !widgets.includes(id))

  return (
    <div className="space-y-6">
      {/* Header saluto */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {greeting()}, {displayName.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeTasks.length === 0
              ? 'Tutto fatto! Nessun task aperto.'
              : `Hai ${activeTasks.length} task ${activeTasks.length === 1 ? 'aperto' : 'aperti'}${overdueTasks.length > 0 ? `, di cui ${overdueTasks.length} ${overdueTasks.length === 1 ? 'scaduto' : 'scaduti'}` : ''}.`
            }
          </p>
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={editMode ? handleSave : () => setEditMode(true)}
          disabled={saving}
          className="gap-2 shrink-0"
        >
          {editMode ? (saving ? 'Salvataggio...' : 'Salva layout') : 'Personalizza'}
        </Button>
      </div>

      {/* Widget nascosti da aggiungere */}
      {editMode && hiddenWidgets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Aggiungi:</span>
          {hiddenWidgets.map(id => (
            <button
              key={id}
              onClick={() => addWidget(id)}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed hover:bg-muted transition-colors"
            >
              + {WIDGET_META[id].label}
            </button>
          ))}
        </div>
      )}

      {/* Grid widget */}
      <div className="grid sm:grid-cols-2 gap-4">
        {widgets.map((id, i) => (
          <div
            key={id}
            draggable={editMode}
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={cn(
              'border rounded-2xl p-5 bg-card shadow-sm transition-all',
              editMode && 'cursor-grab active:cursor-grabbing ring-2 ring-border',
              dragIdx === i && 'opacity-50'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {editMode && <GripVertical className="size-3.5 text-muted-foreground" />}
                {(() => { const M = WIDGET_META[id]; return M ? <M.icon className="size-4 text-muted-foreground" /> : null })()}
                <span className="text-sm font-medium">{WIDGET_META[id]?.label}</span>
              </div>
              {editMode && (
                <button onClick={() => removeWidget(id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <EyeOff className="size-3.5" />
                </button>
              )}
            </div>

            {/* Contenuto widget */}
            {id === 'stats' && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Totali', value: tasks.length },
                  { label: 'Aperti', value: activeTasks.length },
                  { label: 'Scaduti', value: overdueTasks.length },
                  { label: 'Completati', value: tasks.filter(t => t.status === 'COMPLETED').length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {id === 'overdue' && (
              overdueTasks.length === 0
                ? <p className="text-sm text-muted-foreground">Nessun task scaduto 🎉</p>
                : <ul className="space-y-1.5">
                  {overdueTasks.map(t => (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="truncate text-red-600 font-medium">{t.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {new Date(t.due_date!).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </li>
                  ))}
                </ul>
            )}

            {id === 'recent' && (
              recentTasks.length === 0
                ? <p className="text-sm text-muted-foreground">Nessun task</p>
                : <ul className="space-y-1.5">
                  {recentTasks.map(t => {
                    const pc = PRIORITY_CONFIG[t.priority as TaskPriority]
                    return (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <span className={cn('size-1.5 rounded-full shrink-0', pc?.bgColor?.replace('bg-', 'bg-').split(' ')[0])} />
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">{STATUS_CONFIG[t.status]?.label}</span>
                      </li>
                    )
                  })}
                </ul>
            )}

            {id === 'completed_week' && (
              <div>
                <p className="text-2xl font-bold">{completedWeek.length}</p>
                <p className="text-xs text-muted-foreground mt-1">task completati negli ultimi 7 giorni</p>
                {completedWeek.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {completedWeek.slice(0, 4).map(t => (
                      <span key={t.id} className="text-xs bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px]">{t.title}</span>
                    ))}
                    {completedWeek.length > 4 && <span className="text-xs text-muted-foreground">+{completedWeek.length - 4} altri</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
