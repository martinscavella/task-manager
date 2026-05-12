'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertPreferences } from '@/lib/profile-actions'
import { createTask } from '@/lib/actions'
import type { UserPreferences } from '@/lib/profile-queries'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'
import {
  BarChart3, AlertCircle, Clock, CheckCircle2, GripVertical, EyeOff,
  CalendarClock, Tag, Flame, Activity, Star, Plus, ArrowRight,
  Zap, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types'

const WIDGET_META: Record<string, { label: string; icon: React.ElementType; wide?: boolean }> = {
  stats:           { label: 'Statistiche generali',   icon: BarChart3 },
  overdue:         { label: 'Task scaduti',           icon: AlertCircle },
  recent:          { label: 'Task recenti',           icon: Clock },
  completed_week:  { label: 'Completati (settimana)', icon: CheckCircle2 },
  due_today:       { label: 'In scadenza oggi',       icon: CalendarClock },
  by_status:       { label: 'Per stato',              icon: Activity },
  by_priority:     { label: 'Per priorità',           icon: Flame },
  by_label:        { label: 'Per etichetta',          icon: Tag },
  streak:          { label: 'Streak produttività',    icon: Star },
  weekly_chart:    { label: 'Carico settimanale',     icon: BarChart3, wide: true },
  next_due:        { label: 'Prossima scadenza',      icon: CalendarClock },
  quick_actions:   { label: 'Quick Actions',          icon: Zap },
}

const DEFAULT_WIDGETS = ['stats', 'overdue', 'recent', 'completed_week']

function todayStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function tomorrowStart() {
  const d = todayStart()
  d.setDate(d.getDate() + 1)
  return d
}

function computeStreak(tasks: Task[]): number {
  const completed = tasks
    .filter(t => t.completed_at)
    .map(t => new Date(t.completed_at!).toDateString())
  const uniqueDays = [...new Set(completed)]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())
  if (!uniqueDays.length) return 0
  let streak = 0
  const check = new Date(todayStart())
  for (const day of uniqueDays) {
    if (day.toDateString() === check.toDateString()) {
      streak++
      check.setDate(check.getDate() - 1)
    } else break
  }
  return streak
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart())
    d.setDate(d.getDate() - (6 - i))
    return d.toDateString()
  })
}

function MiniBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-6 bg-muted rounded-full overflow-hidden" style={{ height: 48 }}>
        <div className={cn('w-full rounded-full transition-all', color)} style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
    </div>
  )
}

interface Props {
  tasks: Task[]
  preferences: UserPreferences
  firstName: string
  onTabChange: (tab: string) => void
}

export function DashboardWidgets({ tasks, preferences, firstName, onTabChange }: Props) {
  const router = useRouter()
  const [widgets, setWidgets] = useState<string[]>(
    preferences.dashboard_widgets?.length ? preferences.dashboard_widgets : DEFAULT_WIDGETS
  )
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  // Questo componente viene caricato solo lato client (ssr:false in home-client.tsx),
  // quindi possiamo usare Date direttamente senza rischi di hydration mismatch.
  const today = todayStart()
  const tomorrow = tomorrowStart()
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const overdueTasks = activeTasks.filter(t => t.due_date && new Date(t.due_date) < today)
  const dueTodayTasks = activeTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= today && d < tomorrow
  })
  const recentTasks = [...tasks].slice(0, 6)
  const completedWeek = tasks.filter(t => t.completed_at && new Date(t.completed_at) >= weekAgo)
  const streak = computeStreak(tasks)

  const byStatus = Object.entries(
    activeTasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const byPriority = ([1, 2, 3, 4] as TaskPriority[]).map(p => ({
    p, count: activeTasks.filter(t => t.priority === p).length, cfg: PRIORITY_CONFIG[p],
  })).filter(x => x.count > 0)

  const byLabel = Object.entries(
    tasks.reduce<Record<string, number>>((acc, t) => {
      const l = t.label || 'Nessuna'
      acc[l] = (acc[l] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const days7 = last7Days()
  const weeklyData = days7.map(day => ({
    day: new Date(day).toLocaleDateString('it-IT', { weekday: 'short' }),
    count: tasks.filter(t => t.completed_at && new Date(t.completed_at).toDateString() === day).length,
  }))
  const weeklyMax = Math.max(...weeklyData.map(d => d.count), 1)

  const nextDue = [...activeTasks]
    .filter(t => t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]

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

  const handleQuickCreate = () => {
    if (!quickTitle.trim()) return
    startTransition(async () => {
      await createTask({
        title: quickTitle.trim(), priority: 3, status: 'TO_BE_STARTED',
        label: null, due_date: null, note: null, jira_url: null,
        jira_key: null, code: null, info: null,
      })
      setQuickTitle('')
      router.refresh()
    })
  }

  const renderWidget = (id: string) => {
    switch (id) {
      case 'stats':
        return (
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
        )
      case 'overdue':
        return overdueTasks.length === 0
          ? <p className="text-sm text-muted-foreground">Nessun task scaduto 🎉</p>
          : <ul className="space-y-1.5">
            {overdueTasks.slice(0, 5).map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm min-w-0">
                <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="truncate text-red-600 font-medium flex-1 min-w-0">{t.title}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {new Date(t.due_date!).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
      case 'recent':
        return recentTasks.length === 0
          ? <p className="text-sm text-muted-foreground">Nessun task</p>
          : <ul className="space-y-1.5">
            {recentTasks.map(t => {
              const pc = PRIORITY_CONFIG[t.priority as TaskPriority]
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm min-w-0">
                  <span className={cn('size-1.5 rounded-full shrink-0', pc?.bgColor.split(' ')[0])} />
                  <span className="truncate flex-1 min-w-0">{t.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{STATUS_CONFIG[t.status]?.label}</span>
                </li>
              )
            })}
          </ul>
      case 'completed_week':
        return (
          <div>
            <p className="text-3xl font-bold">{completedWeek.length}</p>
            <p className="text-xs text-muted-foreground mt-1">task completati negli ultimi 7 giorni</p>
            {completedWeek.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {completedWeek.slice(0, 4).map(t => (
                  <span key={t.id} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full truncate max-w-[7.5rem]">
                    {t.title}
                  </span>
                ))}
                {completedWeek.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{completedWeek.length - 4} altri</span>
                )}
              </div>
            )}
          </div>
        )
      case 'due_today':
        return dueTodayTasks.length === 0
          ? <p className="text-sm text-muted-foreground">Nessun task in scadenza oggi ✅</p>
          : <ul className="space-y-1.5">
            {dueTodayTasks.map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm min-w-0">
                <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate font-medium text-amber-700 flex-1 min-w-0">{t.title}</span>
                <span className={cn('ml-auto text-xs px-1.5 py-0.5 rounded-full shrink-0', STATUS_CONFIG[t.status]?.bgColor, STATUS_CONFIG[t.status]?.color)}>
                  {STATUS_CONFIG[t.status]?.label}
                </span>
              </li>
            ))}
          </ul>
      case 'by_status':
        return byStatus.length === 0
          ? <p className="text-sm text-muted-foreground">Nessun task attivo</p>
          : <ul className="space-y-2">
            {byStatus.map(([status, count]) => {
              const cfg = STATUS_CONFIG[status as TaskStatus]
              const pct = Math.round((count / activeTasks.length) * 100)
              return (
                <li key={status}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={cn('font-medium', cfg?.color)}>{cfg?.label ?? status}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', cfg?.bgColor)} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
      case 'by_priority':
        return byPriority.length === 0
          ? <p className="text-sm text-muted-foreground">Nessun task attivo</p>
          : <ul className="space-y-2">
            {byPriority.map(({ p, count, cfg }) => {
              const pct = Math.round((count / activeTasks.length) * 100)
              return (
                <li key={p}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={cn('font-medium', cfg?.color)}>
                      P{p} – {cfg?.label}
                    </span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', cfg?.bgColor)} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
      case 'by_label':
        return byLabel.length === 0
          ? <p className="text-sm text-muted-foreground">Nessuna etichetta</p>
          : <div className="flex flex-wrap gap-1.5">
            {byLabel.map(([label, count]) => (
              <span key={label} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                {label}<span className="font-bold text-foreground">{count}</span>
              </span>
            ))}
          </div>
      case 'streak':
        return (
          <div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground mb-1">
                giorn{streak === 1 ? 'o' : 'i'} consecutivi 🔥
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak === 0 ? 'Completa un task oggi per iniziare lo streak!' :
               streak < 3 ? 'Buon inizio, continua così!' :
               streak < 7 ? 'Stai andando forte! 💪' : 'Sei inarrestabile! 🚀'}
            </p>
          </div>
        )
      case 'weekly_chart':
        return (
          <div>
            <div className="flex items-end gap-2 h-14">
              {weeklyData.map(({ day, count }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 40 }}>
                    <div
                      className="w-full max-w-7 bg-primary/80 rounded-t-md transition-all"
                      style={{ height: weeklyMax === 0 ? 2 : Math.max(2, (count / weeklyMax) * 40) }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Task completati per giorno (ultimi 7gg)</p>
          </div>
        )
      case 'next_due':
        return !nextDue
          ? <p className="text-sm text-muted-foreground">Nessun task con scadenza</p>
          : (
            <div className="space-y-2">
              <p className="text-sm font-semibold truncate">{nextDue.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_CONFIG[nextDue.status]?.bgColor, STATUS_CONFIG[nextDue.status]?.color)}>
                  {STATUS_CONFIG[nextDue.status]?.label}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', PRIORITY_CONFIG[nextDue.priority]?.bgColor, PRIORITY_CONFIG[nextDue.priority]?.color)}>
                  {PRIORITY_CONFIG[nextDue.priority]?.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Scadenza:{' '}
                <span className="font-medium text-foreground">
                  {new Date(nextDue.due_date!).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </p>
            </div>
          )
      case 'quick_actions':
        return (
          <div className="space-y-3">
            <form onSubmit={e => { e.preventDefault(); handleQuickCreate() }} className="flex gap-2">
              <Input
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Nuovo task..."
                className="h-8 text-sm"
                disabled={isPending}
              />
              <Button type="submit" size="sm" disabled={isPending || !quickTitle.trim()} className="h-8 px-2.5 shrink-0">
                <Plus className="size-3.5" />
              </Button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: 'Tutti i task', tab: 'tasks', icon: ArrowRight },
                { label: 'Analytics',    tab: 'analytics', icon: BarChart3 },
                { label: 'Impostazioni', href: '/settings', icon: Settings },
                { label: 'Profilo',      href: '/settings', icon: Star },
              ] as const).map((item) => {
                const Icon = item.icon
                if ('tab' in item) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => onTabChange(item.tab)}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border bg-muted/30 hover:bg-muted transition-colors text-left"
                    >
                      <Icon className="size-3 text-muted-foreground shrink-0" />
                      {item.label}
                    </button>
                  )
                }
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <Icon className="size-3 text-muted-foreground shrink-0" />
                    {item.label}
                  </a>
                )
              })}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {editMode && hiddenWidgets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-muted/40 border border-dashed">
          <span className="text-xs font-medium text-muted-foreground">Aggiungi widget:</span>
          {hiddenWidgets.map(id => (
            <button
              key={id}
              onClick={() => addWidget(id)}
              className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors flex items-center gap-1"
            >
              <Plus className="size-3" /> {WIDGET_META[id]?.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {widgets.map((id, i) => {
          const meta = WIDGET_META[id]
          if (!meta) return null
          return (
            <div
              key={id}
              draggable={editMode}
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={cn(
                'border rounded-2xl p-4 bg-card shadow-sm transition-all overflow-hidden',
                meta.wide && 'sm:col-span-2',
                editMode && 'cursor-grab active:cursor-grabbing ring-2 ring-border',
                dragIdx === i && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between mb-4 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {editMode && <GripVertical className="size-3.5 text-muted-foreground shrink-0" />}
                  <meta.icon className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{meta.label}</span>
                </div>
                {editMode && (
                  <button
                    onClick={() => removeWidget(id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
                  >
                    <EyeOff className="size-3.5" />
                  </button>
                )}
              </div>
              {renderWidget(id)}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pb-2">
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={editMode ? handleSave : () => setEditMode(true)}
          disabled={saving}
          className="md:mr-0 mr-16"
        >
          {editMode
            ? (saving ? 'Salvataggio...' : 'Salva layout')
            : 'Personalizza dashboard'}
        </Button>
      </div>
    </div>
  )
}
