/**
 * Task due date utilities
 */

export type DueDateStatus = 'overdue' | 'due-today' | 'upcoming' | 'none'

/**
 * Get the due date status of a task
 * - 'overdue': data di scadenza è nel passato
 * - 'due-today': data di scadenza è oggi
 * - 'upcoming': data di scadenza è nel futuro
 * - 'none': nessuna data di scadenza
 */
export function getDueDateStatus(dueDate: string | null | undefined, taskStatus: string): DueDateStatus {
  if (!dueDate) return 'none'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  // Se il task è completato o annullato, non è in ritardo
  if (taskStatus === 'COMPLETED' || taskStatus === 'CANCELLED') {
    return 'none'
  }
  
  if (due < today) {
    return 'overdue'
  }
  
  if (due.getTime() === today.getTime()) {
    return 'due-today'
  }
  
  return 'upcoming'
}

/**
 * Format a date string to locale format
 */
export function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format date with due date status
 */
export function formatDateWithStatus(dateStr: string | null | undefined, status: DueDateStatus): string {
  const formatted = formatDate(dateStr)
  if (!formatted) return ''
  
  switch (status) {
    case 'overdue':
      return `Scaduto: ${formatted}`
    case 'due-today':
      return `Scadenza oggi: ${formatted}`
    case 'upcoming':
      return `Scadenza: ${formatted}`
    case 'none':
      return ''
  }
}
