'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskCard } from './task-card'
import { CreateTaskDialog } from './create-task-dialog'
import { useViewSettings } from '@/hooks/use-view-settings'
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/types'
import {
  SearchIcon,
  LayoutGrid,
  List,
  Kanban,
  ChevronDown,
  ChevronRight,
  FolderIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface TaskListProps {
  tasks: Task[]
}

// Columns always shown in kanban
const KANBAN_BASE: TaskStatus[] = ['TO_BE_STARTED', 'IN_PROGRESS', 'IN_TEST', 'COMPLETED']

export function TaskList({ tasks }: TaskListProps) {
  const {
    settings,
    isLoaded,
    setViewMode,
    setGroupBy,
    setSortBy,
    setSortOrder,
    setFilterStatus,
    setFilterPriority,
    setSearchQuery,
  } = useViewSettings()

  const getInternalViewMode = (viewMode: 'list' | 'board' | 'grid'): 'list' | 'cards' | 'kanban' => {
    if (viewMode === 'list') return 'list'
    if (viewMode === 'board') return 'kanban'
    return 'cards'
  }

  const internalViewMode = getInternalViewMode(settings.viewMode)
  const statusFilter = settings.filterStatus.length === 0 ? 'all' : settings.filterStatus[0]
  const priorityFilter = settings.filterPriority.length === 0 ? 'all' : settings.filterPriority[0]

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(settings.searchQuery.toLowerCase()) ||
        (task.note?.toLowerCase().includes(settings.searchQuery.toLowerCase())) ||
        (task.label?.toLowerCase().includes(settings.searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === Number(priorityFilter)
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, settings.searchQuery, statusFilter, priorityFilter])

  const sortedAndFiltered = useMemo(() => {
    const sorted = [...filteredTasks]
    sorted.sort((a, b) => {
      let compareValue = 0
      switch (settings.sortBy) {
        case 'title': compareValue = a.title.localeCompare(b.title); break
        case 'priority': compareValue = a.priority - b.priority; break
        case 'due_date':
          if (!a.due_date && !b.due_date) compareValue = 0
          else if (!a.due_date) compareValue = 1
          else if (!b.due_date) compareValue = -1
          else compareValue = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          break
        case 'created_at':
        default:
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return settings.sortOrder === 'asc' ? compareValue : -compareValue
    })
    return sorted
  }, [filteredTasks, settings.sortBy, settings.sortOrder])

  const { activeTasks, completedTasks, cancelledTasks } = useMemo(() => {
    const active: Task[] = []
    const completed: Task[] = []
    const cancelled: Task[] = []
    sortedAndFiltered.forEach(task => {
      if (task.status === 'COMPLETED') completed.push(task)
      else if (task.status === 'CANCELLED') cancelled.push(task)
      else active.push(task)
    })
    return { activeTasks: active, completedTasks: completed, cancelledTasks: cancelled }
  }, [sortedAndFiltered])

  const groupedTasks = useMemo(() => {
    if (settings.groupBy === 'none') return { 'Tutti i Task': activeTasks }
    const groups: Record<string, Task[]> = {}
    activeTasks.forEach(task => {
      let key: string
      switch (settings.groupBy) {
        case 'status': key = STATUS_CONFIG[task.status]?.label || task.status; break
        case 'priority': key = PRIORITY_CONFIG[task.priority as TaskPriority]?.label || `P${task.priority}`; break
        case 'label': key = task.label || 'Senza etichetta'; break
        default: key = 'Tutti'
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    })
    if (settings.groupBy === 'priority') {
      const priorityOrder = ['Critica', 'Alta', 'Media', 'Bassa']
      const sorted: Record<string, Task[]> = {}
      priorityOrder.forEach(p => { if (groups[p]) sorted[p] = groups[p] })
      return sorted
    }
    if (settings.groupBy === 'status') {
      const statusOrder = Object.values(STATUS_CONFIG).sort((a, b) => a.order - b.order).map(s => s.label)
      const sorted: Record<string, Task[]> = {}
      statusOrder.forEach(s => { if (groups[s]) sorted[s] = groups[s] })
      return sorted
    }
    return groups
  }, [activeTasks, settings.groupBy])

  const renderKanban = (taskList: Task[]) => {
    // Determine which extra columns have tasks
    const allStatuses = Object.keys(STATUS_CONFIG) as TaskStatus[]
    const extraStatuses = allStatuses.filter(
      s => !KANBAN_BASE.includes(s) && taskList.some(t => t.status === s)
    )
    const columnsToShow = [...KANBAN_BASE, ...extraStatuses]

    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnsToShow.map((status) => {
          const config = STATUS_CONFIG[status]
          const statusTasks = taskList.filter(t => t.status === status)
          if (statusFilter !== 'all' && status !== statusFilter) return null
          return (
            <div key={status} className="flex-shrink-0 w-72">
              <div className={cn('rounded-t-lg px-3 py-2', config.bgColor)}>
                <h3 className={cn('font-medium text-sm', config.color)}>
                  {config.label} ({statusTasks.length})
                </h3>
              </div>
              <div className="bg-muted/30 rounded-b-lg p-2 min-h-[200px] space-y-2">
                {statusTasks.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nessun task</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTasks = (taskList: Task[]) => {
    if (internalViewMode === 'list') {
      return (
        <div className="space-y-2">
          {taskList.map((task) => <TaskCard key={task.id} task={task} compact />)}
        </div>
      )
    }
    // Cards view (grid)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {taskList.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    )
  }

  if (!isLoaded) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cerca task..."
            value={settings.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <CreateTaskDialog />
      </div>

      {/* Filters and View Options */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setFilterStatus(v === 'all' ? [] : [v])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter === 'all' ? 'all' : priorityFilter.toString()} onValueChange={(v) => setFilterPriority(v === 'all' ? [] : [v])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={settings.groupBy} onValueChange={(v) => setGroupBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <FolderIcon className="size-4 mr-2" />
            <SelectValue placeholder="Raggruppa per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nessun raggruppamento</SelectItem>
            <SelectItem value="status">Per stato</SelectItem>
            <SelectItem value="priority">Per priorità</SelectItem>
            <SelectItem value="label">Per etichetta</SelectItem>
          </SelectContent>
        </Select>

        <Select value={settings.sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordina per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Data creazione</SelectItem>
            <SelectItem value="due_date">Data scadenza</SelectItem>
            <SelectItem value="priority">Priorità</SelectItem>
            <SelectItem value="title">Nome</SelectItem>
          </SelectContent>
        </Select>

        <Button variant={settings.sortOrder === 'asc' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setSortOrder('asc')} title="Ordine crescente">↑</Button>
        <Button variant={settings.sortOrder === 'desc' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setSortOrder('desc')} title="Ordine decrescente">↓</Button>

        <div className="flex items-center gap-1 ml-auto border rounded-lg p-1">
          <Button variant={settings.viewMode === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('list')}>
            <List className="size-4" />
          </Button>
          <Button variant={settings.viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant={settings.viewMode === 'board' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('board')}>
            <Kanban className="size-4" />
          </Button>
        </div>
      </div>

      {/* Task Content */}
      {sortedAndFiltered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p className="text-lg font-medium">Nessun task trovato</p>
          <p className="text-sm mt-1">Prova a modificare i filtri o crea un nuovo task</p>
        </div>
      ) : internalViewMode === 'kanban' ? (
        renderKanban(sortedAndFiltered)
      ) : (
        <div className="space-y-6">
          {settings.groupBy === 'none' ? (
            activeTasks.length > 0 && renderTasks(activeTasks)
          ) : (
            Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <Collapsible key={groupName} defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                    <ChevronRight className="size-4" />
                    <span className="font-semibold">{groupName}</span>
                    <span className="text-muted-foreground">({groupTasks.length})</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  {renderTasks(groupTasks)}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}

          {completedTasks.length > 0 && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 border-t pt-4">
                  <ChevronRight className="size-4" />
                  <span className="font-semibold text-emerald-700">Completati</span>
                  <span className="text-muted-foreground">({completedTasks.length})</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                {renderTasks(completedTasks)}
              </CollapsibleContent>
            </Collapsible>
          )}

          {cancelledTasks.length > 0 && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                  <ChevronRight className="size-4" />
                  <span className="font-semibold text-stone-600">Annullati</span>
                  <span className="text-muted-foreground">({cancelledTasks.length})</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                {renderTasks(cancelledTasks)}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}
