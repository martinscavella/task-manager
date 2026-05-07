export type TaskStatus = 'TO_BE_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export type TaskPriority = 1 | 2 | 3 // 1 = High, 2 = Medium, 3 = Low

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  label: string | null
  due_date: string | null
  note: string | null
  created_at: string
}

export interface CreateTaskInput {
  title: string
  priority?: TaskPriority
  status?: TaskStatus
  label?: string | null
  due_date?: string | null
  note?: string | null
}

export interface UpdateTaskInput {
  id: string
  title?: string
  priority?: TaskPriority
  status?: TaskStatus
  label?: string | null
  due_date?: string | null
  note?: string | null
}
