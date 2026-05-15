import { notFound, redirect } from 'next/navigation'
import { getComponentHistory } from '@/lib/queries'
import { BackButton } from '@/components/back-button'
import { TECHNOLOGY_CONFIGS, CHANGE_STATUS_CONFIG, ACTION_TYPE_CONFIG } from '@/lib/types'
import { formatDate } from '@/lib/due-date-utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { name } = await params
  const componentRef = decodeURIComponent(name)

  const history = await getComponentHistory(componentRef)
  if (history.length === 0) notFound()

  // Metadati aggregati
  const firstEntry = history[history.length - 1] // il più vecchio
  const lastEntry  = history[0]                   // il più recente
  const techConfig = TECHNOLOGY_CONFIGS[firstEntry.technology] ?? TECHNOLOGY_CONFIGS.generic
  const uniqueTasks = [...new Map(history.map(h => [h.task_id, h])).values()]
  const changesSummary: Record<string, number> = {}
  for (const h of history) {
    changesSummary[h.change_status] = (changesSummary[h.change_status] ?? 0) + 1
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Back */}
        <BackButton label="Torna indietro" fallback="/" />

        {/* Hero header */}
        <div className={cn('border rounded-xl p-6 space-y-4', techConfig.borderColor, techConfig.bgColor)}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold border',
                  techConfig.bgColor, techConfig.color, techConfig.borderColor
                )}>
                  {techConfig.badge}
                </span>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', techConfig.color)}>
                  {techConfig.label}
                </p>
              </div>
              <h1 className="text-lg font-bold font-mono text-foreground break-all">
                {componentRef}
              </h1>
              <p className="text-xs text-muted-foreground">
                Tipo: <span className="font-medium text-foreground">{firstEntry.metadata_type}</span>
                &nbsp;·&nbsp;
                Prima modifica: <span className="font-medium text-foreground">{formatDate(firstEntry.created_at)}</span>
                &nbsp;·&nbsp;
                Ultima modifica: <span className="font-medium text-foreground">{formatDate(lastEntry.created_at)}</span>
              </p>
            </div>

            {/* KPI pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{history.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Interventi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{uniqueTasks.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Task</p>
              </div>
              {Object.entries(changesSummary).map(([status, count]) => {
                const conf = CHANGE_STATUS_CONFIG[status as keyof typeof CHANGE_STATUS_CONFIG]
                if (!conf) return null
                return (
                  <div key={status} className={cn('px-3 py-1.5 rounded-lg border text-center', conf.bgColor, conf.borderColor)}>
                    <p className={cn('text-xl font-bold', conf.color)}>{count}</p>
                    <p className={cn('text-[10px] uppercase tracking-wide', conf.color)}>{conf.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Storico completo */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Storico interventi
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground">
                  <th className="text-left font-medium px-4 py-2.5 w-[100px]">Stato</th>
                  <th className="text-left font-medium px-4 py-2.5 w-[120px]">Tipo azione</th>
                  <th className="text-left font-medium px-4 py-2.5">Nome / Titolo</th>
                  <th className="text-left font-medium px-4 py-2.5">Task</th>
                  <th className="text-left font-medium px-4 py-2.5 w-[80px]">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map(entry => {
                  const changeConf = CHANGE_STATUS_CONFIG[entry.change_status]
                  return (
                    <tr key={entry.id} className="hover:bg-muted/10 transition-colors group">
                      {/* Stato */}
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                          changeConf.bgColor, changeConf.color, changeConf.borderColor
                        )}>
                          {changeConf.label}
                        </span>
                      </td>
                      {/* Tipo azione */}
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {ACTION_TYPE_CONFIG[entry.action_type]?.label ?? entry.action_type}
                      </td>
                      {/* Titolo + descrizione */}
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-foreground">{entry.title}</p>
                        {entry.description && (
                          <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {entry.description}
                          </p>
                        )}
                      </td>
                      {/* Task collegato */}
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/tasks/${entry.task_id}`}
                          className="text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                        >
                          {entry.task_title}
                          {entry.task_label && (
                            <span className="text-[10px] bg-muted/60 text-muted-foreground px-1 py-0.5 rounded ml-1">
                              {entry.task_label}
                            </span>
                          )}
                        </Link>
                      </td>
                      {/* Data */}
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}
