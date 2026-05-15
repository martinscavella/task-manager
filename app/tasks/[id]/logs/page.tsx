import { getTaskById, getActionLogsByTaskId } from '@/lib/queries'
import { notFound } from 'next/navigation'
import { isDevLabel, TECHNOLOGY_CONFIGS, ACTION_TYPE_CONFIG, CHANGE_STATUS_CONFIG } from '@/lib/types'
import { BackButton } from '@/components/back-button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/due-date-utils'

function getTechConfig(value: string | null | undefined) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return TECHNOLOGY_CONFIGS[key] || TECHNOLOGY_CONFIGS.generic
}

export default async function ActionLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTaskById(id)
  if (!task || !isDevLabel(task.label)) notFound()

  const logs = await getActionLogsByTaskId(id)

  // Raggruppa per tecnologia
  const byTech = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const key = log.technology || 'generic'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  // Raggruppa per giorno (per la timeline)
  const byDay = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const day = log.created_at.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {})

  const totalByType = Object.entries(ACTION_TYPE_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    count: logs.filter(l => l.action_type === key).length,
  })).filter(x => x.count > 0)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* Back + Header */}
        <div className="space-y-1">
          <BackButton
            label={`Torna al task`}
            fallback={`/tasks/${id}`}
            forcePush
            className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          />
          <div className="flex items-start justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Action Log · {logs.length} {logs.length === 1 ? 'voce' : 'voci'} registrate
              </p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 shrink-0">
              {task.label}
            </span>
          </div>
        </div>

        {/* Nessun log */}
        {logs.length === 0 && (
          <div className="border rounded-lg px-6 py-12 text-center text-muted-foreground">
            Nessuna azione registrata per questo task.
          </div>
        )}

        {/* ── Riepilogo per tecnologia ── */}
        {Object.keys(byTech).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riepilogo per tecnologia</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(byTech).map(([tech, techLogs]) => {
                const cfg = getTechConfig(tech)
                return (
                  <div
                    key={tech}
                    className={cn(
                      'border rounded-lg px-4 py-3 flex items-center gap-3',
                      cfg.bgColor, cfg.borderColor
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold border shrink-0',
                      cfg.bgColor, cfg.color, cfg.borderColor
                    )}>
                      {cfg.badge}
                    </span>
                    <div>
                      <p className={cn('text-xs font-semibold', cfg.color)}>{cfg.label}</p>
                      <p className="text-lg font-bold text-foreground leading-none mt-0.5">
                        {techLogs.length}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {techLogs.length === 1 ? 'voce' : 'voci'}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Riepilogo per tipo azione ── */}
        {totalByType.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riepilogo per tipo azione</h2>
            <div className="flex flex-wrap gap-2">
              {totalByType.map(({ key, label, count }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 text-foreground border"
                >
                  {label}
                  <span className="bg-background border rounded-full px-1.5 py-0.5 text-[11px] font-bold">{count}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Timeline per giorno ── */}
        {Object.keys(byDay).length > 0 && (
          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Storico cronologico</h2>
            {Object.entries(byDay)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([day, dayLogs]) => (
                <div key={day} className="space-y-2">
                  {/* Intestazione giorno */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {new Date(day + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground shrink-0">{dayLogs.length} voci</span>
                  </div>

                  {/* Righe log del giorno */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30 text-muted-foreground">
                          <th className="text-left font-medium px-3 py-2 w-[72px]">Tech</th>
                          <th className="text-left font-medium px-3 py-2 w-[110px]">Metadato</th>
                          <th className="text-left font-medium px-3 py-2 w-[85px]">Stato</th>
                          <th className="text-left font-medium px-3 py-2 w-[100px]">Tipo</th>
                          <th className="text-left font-medium px-3 py-2">Nome</th>
                          <th className="text-left font-medium px-3 py-2 w-[160px]">Path / Ref</th>
                          <th className="text-left font-medium px-3 py-2 w-[60px]">Ora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dayLogs.map(log => {
                          const techCfg = getTechConfig(log.technology)
                          const changeCfg = CHANGE_STATUS_CONFIG[log.change_status] ?? CHANGE_STATUS_CONFIG.new
                          return (
                            <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-3 py-2">
                                <span className={cn(
                                  'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border',
                                  techCfg.bgColor, techCfg.color, techCfg.borderColor
                                )}>
                                  {techCfg.badge}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                  {log.metadata_type}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={cn(
                                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                                  changeCfg.bgColor, changeCfg.color, changeCfg.borderColor
                                )}>
                                  {changeCfg.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {ACTION_TYPE_CONFIG[log.action_type]?.label ?? log.action_type}
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-medium text-foreground">{log.title}</p>
                                {log.description && (
                                  <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                                    {log.description}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2 max-w-[160px]">
                                {log.component_ref ? (
                                  <span className="font-mono text-[11px] text-sky-600 truncate block" title={log.component_ref}>
                                    {log.component_ref}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                {new Date(log.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
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
        )}

      </div>
    </main>
  )
}
