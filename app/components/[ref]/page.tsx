import { getComponentHistory } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { TECHNOLOGY_CONFIGS, ACTION_TYPE_CONFIG, CHANGE_STATUS_CONFIG } from '@/lib/types'
import { BackButton } from '@/components/back-button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { GitBranch, Clock, Hash } from 'lucide-react'

function getTechConfig(value: string | null | undefined) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return TECHNOLOGY_CONFIGS[key] || TECHNOLOGY_CONFIGS.generic
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const componentRef = decodeURIComponent(ref)

  const history = await getComponentHistory(componentRef)
  if (history.length === 0) notFound()

  // Aggrega stats
  const taskIds = new Set(history.map(h => h.task_id))
  const lastEntry = history[0]
  const techCfg = getTechConfig(lastEntry.technology)

  // Raggruppa per task
  const byTask = history.reduce<Record<string, typeof history>>((acc, entry) => {
    const key = entry.task_id
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  // Raggruppa per giorno (timeline)
  const byDay = history.reduce<Record<string, typeof history>>((acc, entry) => {
    const day = entry.created_at.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(entry)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* Back + Header */}
        <div className="space-y-1">
          <BackButton
            label="Tutti i componenti"
            fallback="/components"
            forcePush
            className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          />
          <div className="flex items-start justify-between gap-4 pt-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold border shrink-0',
                  techCfg.bgColor, techCfg.color, techCfg.borderColor
                )}>
                  {techCfg.badge}
                </span>
                <h1 className="text-xl font-bold font-mono text-foreground break-all">{componentRef}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {lastEntry.metadata_type} &middot; {techCfg.label}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Hash className="size-4" />
              <strong className="text-foreground">{history.length}</strong>
              {history.length === 1 ? 'modifica' : 'modifiche'} totali
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="size-4" />
              <strong className="text-foreground">{taskIds.size}</strong>
              {taskIds.size === 1 ? 'task' : 'task distinti'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              Ultima modifica il{' '}
              <strong className="text-foreground">
                {new Date(lastEntry.created_at).toLocaleDateString('it-IT', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </strong>
            </span>
          </div>
        </div>

        {/* Task coinvolti */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Task coinvolti</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byTask).map(([taskId, entries]) => {
              const first = entries[0]
              return (
                <Link
                  key={taskId}
                  href={`/tasks/${taskId}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
                >
                  <span className="font-medium text-foreground truncate max-w-[240px]">{first.task_title}</span>
                  {first.task_label && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 shrink-0">
                      {first.task_label}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {entries.length} {entries.length === 1 ? 'voce' : 'voci'}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Timeline cronologica per giorno */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Storico cronologico</h2>

          {Object.entries(byDay)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, dayEntries]) => (
              <div key={day} className="space-y-2">
                {/* Intestazione giorno */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {new Date(day + 'T00:00:00').toLocaleDateString('it-IT', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground shrink-0">{dayEntries.length} voci</span>
                </div>

                {/* Righe */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30 text-muted-foreground">
                        <th className="text-left font-medium px-3 py-2 w-[85px]">Stato</th>
                        <th className="text-left font-medium px-3 py-2 w-[100px]">Tipo</th>
                        <th className="text-left font-medium px-3 py-2">Descrizione</th>
                        <th className="text-left font-medium px-3 py-2">Task</th>
                        <th className="text-left font-medium px-3 py-2 w-[55px]">Ora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dayEntries.map(entry => {
                        const changeCfg = CHANGE_STATUS_CONFIG[entry.change_status] ?? CHANGE_STATUS_CONFIG.new
                        return (
                          <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                            {/* Stato modifica */}
                            <td className="px-3 py-2">
                              <span className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                                changeCfg.bgColor, changeCfg.color, changeCfg.borderColor
                              )}>
                                {changeCfg.label}
                              </span>
                            </td>

                            {/* Tipo azione */}
                            <td className="px-3 py-2 text-muted-foreground">
                              {ACTION_TYPE_CONFIG[entry.action_type]?.label ?? entry.action_type}
                            </td>

                            {/* Titolo + descrizione */}
                            <td className="px-3 py-2">
                              <p className="font-medium text-foreground">{entry.title}</p>
                              {entry.description && (
                                <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {entry.description}
                                </p>
                              )}
                            </td>

                            {/* Task collegato */}
                            <td className="px-3 py-2">
                              <Link
                                href={`/tasks/${entry.task_id}`}
                                className="text-sky-600 hover:text-sky-700 hover:underline font-medium truncate block max-w-[200px]"
                                title={entry.task_title}
                              >
                                {entry.task_title}
                              </Link>
                              {entry.task_label && (
                                <span className="text-[10px] text-stone-500">{entry.task_label}</span>
                              )}
                            </td>

                            {/* Ora */}
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleTimeString('it-IT', {
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          }
        </section>

      </div>
    </main>
  )
}
