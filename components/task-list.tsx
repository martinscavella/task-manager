'use client'

import { useState, useMemo } from 'react'
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
import { 
  STATUS_CONFIG, 
  PRIORITY_CONFIG, 
  type Task, 
  type TaskStatus, 
  type TaskPriority,
  type ViewMode,
  type GroupBy 
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

export function TaskList({ tasks }: TaskListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.note?.toLowerCase().includes(search.toLowerCase())) ||
        (task.label?.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, search, statusFilter, priorityFilter])

  // Separate active and completed tasks
  const { activeTasks, completedTasks, cancelledTasks } = useMemo(() => {
    const active: Task[] = []
    const completed: Task[] = []
    const cancelled: Task[] = []

    filteredTasks.forEach(task => {
      if (task.status === 'COMPLETED') {
        completed.push(task)
      } else if (task.status === 'CANCELLED') {
        cancelled.push(task)
      } else {
        active.push(task)
      }
    })

    return { activeTasks: active, completedTasks: completed, cancelledTasks: cancelled }
  }, [filteredTasks])

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Tutti i Task': activeTasks }
    }

    const groups: Record<string, Task[]> = {}

    activeTasks.forEach(task => {
      let key: string

      switch (groupBy) {
        case 'status':
          key = STATUS_CONFIG[task.status]?.label || task.status
          break
        case 'priority':
          key = PRIORITY_CONFIG[task.priority]?.label || `P${task.priority}`
          break
        case 'label':
          key = task.label || 'Senza etichetta'
          break
        default:
          key = 'Tutti'
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    // Sort groups
    if (groupBy === 'priority') {
      const priorityOrder = ['Critica', 'Alta', 'Media', 'Bassa']
      const sorted: Record<string, Task[]> = {}
      priorityOrder.forEach(p => {
        if (groups[p]) sorted[p] = groups[p]
      })
      return sorted
    }

    if (groupBy === 'status') {
      const statusOrder = Object.values(STATUS_CONFIG).sort((a, b) => a.order - b.order).map(s => s.label)
      const sorted: Record<string, Task[]> = {}
      statusOrder.forEach(s => {
        if (groups[s]) sorted[s] = groups[s]
      })
      return sorted
    }

    return groups
  }, [activeTasks, groupBy])

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const renderTasks = (taskList: Task[]) => {
    if (viewMode === 'list') {
      return (
        <div className="space-y-2">
          {taskList.map((task) => (
            <TaskCard key={task.id} task={task} compact />
          ))}
        </div>
      )
    }

    if (viewMode === 'kanban') {
      const statusGroups: Record<string, Task[]> = {}
      Object.keys(STATUS_CONFIG).forEach(status => {
        statusGroups[status] = taskList.filter(t => t.status === status)
      })

      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusTasks = statusGroups[status] || []
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
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nessun task
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // Cards view (default)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {taskList.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cerca task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <CreateTaskDialog />
      </div>

      {/* Filters and View Options */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter === 'all' ? 'all' : priorityFilter.toString()} onValueChange={(v) => setPriorityFilter(v === 'all' ? 'all' : Number(v) as TaskPriority)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
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

        <div className="flex items-center gap-1 ml-auto border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('list')}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('kanban')}
          >
            <Kanban className="size-4" />
          </Button>
        </div>
      </div>

      {/* Task Content */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p className="text-lg font-medium">Nessun task trovato</p>
          <p className="text-sm mt-1">Prova a modificare i filtri o crea un nuovo task</p>
        </div>
      ) : viewMode === 'kanban' ? (
        renderTasks(filteredTasks)
      ) : (
        <div className="space-y-6">
          {/* Active Tasks */}
          {groupBy === 'none' ? (
            activeTasks.length > 0 && renderTasks(activeTasks)
          ) : (
            Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <Collapsible 
                key={groupName} 
                open={!collapsedGroups.has(groupName)}
                onOpenChange={() => toggleGroup(groupName)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                    {collapsedGroups.has(groupName) ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
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

          {/* Completed Tasks Section */}
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
                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {completedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Cancelled Tasks Section */}
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
                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {cancelledTasks.map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cancelledTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}
