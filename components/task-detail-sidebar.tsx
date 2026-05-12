'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, PRIORITY_CONFIG, type Task, type TaskPriority, type TaskStatus } from '@/lib/types'
import { getDueDateStatus } from '@/lib/due-date-utils'
import { useState, useMemo, useEffect } from 'react'
import { SearchIcon, ChevronDown, ArrowUpDown, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'

type SortKey = 'status' | 'priority' | 'due_date' | 'title'
type GroupKey = 'none' | 'status' | 'priority' | 'label'

const STORAGE_KEY = 'task-sidebar-prefs'

const STATUS_ORDER: Record<string, number> = {
  BLOCKED: 0, IN_PROGRESS: 1, IN_TEST: 2, IN_REVIEW: 3,
  WAITING_REQUIREMENTS: 4, TO_BE_STARTED: 5, BACKLOG: 6,
  COMPLETED: 7, CANCELLED: 8,
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'status',   label: 'Stato' },
  { value: 'priority', label: 'Priorità' },
  { value: 'due_date', label: 'Scadenza' },
  { value: 'title',    label: 'Titolo' },
]

const GROUP_OPTIONS: { value: GroupKey; label: string }[] = [
  { value: 'none',     label: 'Nessun gruppo' },
  { value: 'status',   label: 'Per stato' },
  { value: 'priority', label: 'Per priorità' },
  { value: 'label',    label: 'Per etichetta' },
]

function readPrefs(): { sortBy: SortKey; groupBy: GroupKey } {
  if (typeof window === 'undefined') return { sortBy: 'status', groupBy: 'none' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sortBy: 'status', groupBy: 'none' }
    const parsed = JSON.parse(raw)
    const validSort: SortKey[] = ['status', 'priority', 'due_date', 'title']
    const validGroup: GroupKey[] = ['none', 'status', 'priority', 'label']
    return {
      sortBy:  validSort.includes(parsed.sortBy)   ? parsed.sortBy  : 'status',
      groupBy: validGroup.includes(parsed.groupBy) ? parsed.groupBy : 'none',
    }
  } catch {
    return { sortBy: 'status', groupBy: 'none' }
  }
}

function writePrefs(sortBy: SortKey, groupBy: GroupKey) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ sortBy, groupBy })) } catch {}
}

function getGroupLabel(task: Task, groupBy: GroupKey): string {
  if (groupBy === 'status')   return STATUS_CONFIG[task.status as TaskStatus]?.label ?? task.status
  if (groupBy === 'priority') return `P${task.priority} \u2014 ${PRIORITY_CONFIG[task.priority as TaskPriority]?.label ?? task.priority}`
  if (groupBy === 'label')    return task.label || 'Senza etichetta'
  return ''
}

function getGroupOrder(task: Task, groupBy: GroupKey): number {
  if (groupBy === 'status')   return STATUS_ORDER[task.status] ?? 99
  if (groupBy === 'priority') return task.priority as number
  return 0
}

function sortTasks(tasks: Task[], sortBy: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'status')   return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    if (sortBy === 'priority') return (a.priority as number) - (b.priority as number)
    if (sortBy === 'due_date') {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'it')
    return 0
  })
}

interface TaskDetailSidebarProps {
  tasks: Task[]
  currentId: string
}

export function TaskDetailSidebar({ tasks, currentId }: TaskDetailSidebarProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showControls, setShowControls] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const [sortBy, setSortByState] = useState<SortKey>('status')
  const [groupBy, setGroupByState] = useState<GroupKey>('none')

  useEffect(() => {
    const { sortBy: s, groupBy: g } = readPrefs()
    setSortByState(s)
    setGroupByState(g)
  }, [])

  const setSortBy = (v: SortKey) => {
    setSortByState(v)
    writePrefs(v, groupBy)
  }

  const setGroupBy = (v: GroupKey) => {
    setGroupByState(v)
    writePrefs(sortBy, v)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const base = tasks.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.label?.toLowerCase().includes(q)
    )
    return sortTasks(base, sortBy)
  }, [tasks, search, sortBy])

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: '__all__', label: '', tasks: filtered }]
    const map = new Map<string, { key: string; label: string; order: number; tasks: Task[] }>()
    for (const task of filtered) {
      const label = getGroupLabel(task, groupBy)
      const order = getGroupOrder(task, groupBy)
      if (!map.has(label)) map.set(label, { key: label, label, order, tasks: [] })
      map.get(label)!.tasks.push(task)
    }
    return [...map.values()].sort((a, b) => a.order - b.order)
  }, [filtered, groupBy])

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  const renderTask = (task: Task) => {
    const isCurrent = task.id === currentId
    const statusConfig = STATUS_CONFIG[task.status as TaskStatus]
    const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority]
    const dueDateStatus = getDueDateStatus(task.due_date, task.status)
    const isDone = task.status === 'COMPLETED' || task.status === 'CANCELLED'

    return (
      <button
        key={task.id}
        onClick={() => router.push(`/tasks/${task.id}`)}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-lg transition-all group',
          isCurrent ? 'bg-accent border border-border shadow-sm' : 'hover:bg-muted/60'
        )}
      >
        <div className="flex items-start gap-2">
          <span className={cn('mt-1 w-2 h-2 rounded-full shrink-0', statusConfig.color.replace('text-', 'bg-'))} />
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-xs font-medium leading-snug truncate',
              isCurrent ? 'text-foreground' : 'text-foreground/80',
              isDone && 'line-through text-muted-foreground'
            )}>{task.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', priorityConfig.bgColor, priorityConfig.color)}>
                {priorityConfig.label}
              </span>
              {task.label && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{task.label}</span>
              )}
              {task.due_date && (
                <span className={cn(
                  'text-[10px] font-medium ml-auto shrink-0',
                  dueDateStatus === 'overdue'   && 'text-red-600',
                  dueDateStatus === 'due-today' && 'text-orange-500',
                  dueDateStatus === 'upcoming'  && 'text-muted-foreground'
                )}>
                  {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 border-b space-y-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca task..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Controls toggle */}
        <button
          onClick={() => setShowControls(v => !v)}
          className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-0.5"
        >
          <span className="flex items-center gap-1.5">
            <ArrowUpDown className="size-3" />
            {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
            {groupBy !== 'none' && (
              <>
                <span className="opacity-40">·</span>
                <Layers className="size-3" />
                {GROUP_OPTIONS.find(g => g.value === groupBy)?.label}
              </>
            )}
          </span>
          <ChevronDown className={cn('size-3 transition-transform duration-200', showControls && 'rotate-180')} />
        </button>

        {/* Expanded controls */}
        {showControls && (
          <div className="space-y-2 pt-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 px-0.5">Ordina per</p>
              <div className="flex flex-wrap gap-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                      sortBy === opt.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 px-0.5">Raggruppa per</p>
              <div className="flex flex-wrap gap-1">
                {GROUP_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGroupBy(opt.value)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                      groupBy === opt.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grouped list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Nessun task trovato</p>
        )}

        {groups.map(group => (
          <div key={group.key} className="mb-1">
            {groupBy !== 'none' && (
              <button
                onClick={() => toggleCollapse(group.key)}
                className="w-full flex items-center justify-between px-2 pt-3 pb-1 group/header"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover/header:text-foreground transition-colors truncate mr-2">
                  {group.label}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{group.tasks.length}</span>
                  <ChevronDown className={cn(
                    'size-3 text-muted-foreground transition-transform duration-200',
                    collapsed[group.key] && '-rotate-90'
                  )} />
                </span>
              </button>
            )}
            {!collapsed[group.key] && (
              <div className="space-y-0.5">
                {group.tasks.map(renderTask)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t">
        <p className="text-[10px] text-muted-foreground">{filtered.length} task</p>
      </div>
    </div>
  )
}
