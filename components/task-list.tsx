'use client'

import { useState } from 'react'
import { TaskCard } from './task-card'
import { CreateTaskDialog } from './create-task-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SearchIcon, ListFilterIcon } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

interface TaskListProps {
  initialTasks: Task[]
}

type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date'

export function TaskList({ initialTasks }: TaskListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 0>(0)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filteredTasks = initialTasks
    .filter((task) => {
      // Search filter
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }
      // Priority filter
      if (priorityFilter !== 0 && task.priority !== priorityFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'priority':
          return a.priority - b.priority
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        default:
          return 0
      }
    })

  const taskStats = {
    total: initialTasks.length,
    completed: initialTasks.filter((t) => t.status === 'COMPLETED').length,
    inProgress: initialTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    toStart: initialTasks.filter((t) => t.status === 'TO_BE_STARTED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
          <p className="text-sm text-muted-foreground">
            {taskStats.total} tasks total - {taskStats.completed} completed, {taskStats.inProgress} in progress, {taskStats.toStart} to start
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <ListFilterIcon className="size-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TO_BE_STARTED">To Start</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter.toString()}
            onValueChange={(v) => setPriorityFilter(Number(v) as TaskPriority | 0)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Priority</SelectItem>
              <SelectItem value="1">High</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-lg font-medium text-muted-foreground">No tasks found</p>
          <p className="text-sm text-muted-foreground">
            {initialTasks.length === 0
              ? 'Create your first task to get started'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
