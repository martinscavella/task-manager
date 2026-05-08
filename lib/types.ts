export type TaskStatus =
  | 'BACKLOG'
  | 'TO_BE_STARTED'
  | 'WAITING_REQUIREMENTS'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'IN_TEST'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED'

export type TaskPriority = 1 | 2 | 3 | 4 // 1 = Critical, 2 = High, 3 = Medium, 4 = Low

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  label: string | null
  due_date: string | null
  note: string | null
  jira_url: string | null
  jira_key: string | null
  code: string | null
  info: string | null
  user_id: string | null
  created_at: string
  completed_at: string | null
}

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'completed_at' | 'user_id'>
export type UpdateTaskInput = Partial<CreateTaskInput> & { id: string }

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; order: number }> = {
  BACKLOG: { label: 'Backlog', color: 'text-slate-700', bgColor: 'bg-slate-100', order: 0 },
  TO_BE_STARTED: { label: 'Da iniziare', color: 'text-gray-700', bgColor: 'bg-gray-100', order: 1 },
  WAITING_REQUIREMENTS: { label: 'In attesa requisiti', color: 'text-amber-700', bgColor: 'bg-amber-100', order: 2 },
  IN_PROGRESS: { label: 'In corso', color: 'text-blue-700', bgColor: 'bg-blue-100', order: 3 },
  IN_REVIEW: { label: 'In review', color: 'text-purple-700', bgColor: 'bg-purple-100', order: 4 },
  IN_TEST: { label: 'In test', color: 'text-cyan-700', bgColor: 'bg-cyan-100', order: 5 },
  BLOCKED: { label: 'Bloccato', color: 'text-red-700', bgColor: 'bg-red-100', order: 6 },
  COMPLETED: { label: 'Completato', color: 'text-emerald-700', bgColor: 'bg-emerald-100', order: 7 },
  CANCELLED: { label: 'Annullato', color: 'text-stone-700', bgColor: 'bg-stone-100', order: 8 },
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Critica', color: 'text-red-700', bgColor: 'bg-red-100' },
  2: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  3: { label: 'Media', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  4: { label: 'Bassa', color: 'text-green-700', bgColor: 'bg-green-100' },
}

export const WORKFLOW_STEPS: TaskStatus[] = [
  'BACKLOG',
  'TO_BE_STARTED',
  'WAITING_REQUIREMENTS',
  'IN_PROGRESS',
  'IN_REVIEW',
  'IN_TEST',
  'COMPLETED',
]

export type ViewMode = 'list' | 'board' | 'grid'
export type GroupBy = 'none' | 'status' | 'priority' | 'label'
export type SortBy = 'created_at' | 'due_date' | 'priority' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface ViewSettings {
  viewMode: ViewMode
  groupBy: GroupBy
  sortBy: SortBy
  sortOrder: SortOrder
  filterStatus: string[]
  filterPriority: string[]
  searchQuery: string
}
