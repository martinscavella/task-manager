import { getAllComponents } from '@/lib/queries'
import { TECHNOLOGY_CONFIGS, CHANGE_STATUS_CONFIG } from '@/lib/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BackButton } from '@/components/back-button'
import { GitBranch, Clock, Hash } from 'lucide-react'

function getTechConfig(value: string | null | undefined) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return TECHNOLOGY_CONFIGS[key] || TECHNOLOGY_CONFIGS.generic
}

export default async function ComponentsIndexPage() {
  const components = await getAllComponents()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <BackButton
            label="Torna ai task"
            fallback="/"
            forcePush
            className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          />
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-foreground">Componenti modificati</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {components.length} {components.length === 1 ? 'componente' : 'componenti'} tracciati negli action log
            </p>
          </div>
        </div>

        {/* Lista vuota */}
        {components.length === 0 && (
          <div className="border rounded-lg px-6 py-12 text-center text-muted-foreground">
            Nessun componente tracciato ancora. Aggiungi voci negli Action Log dei task di sviluppo.
          </div>
        )}

        {/* Tabella componenti */}
        {components.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground text-xs">
                  <th className="text-left font-medium px-4 py-3 w-[72px]">Tech</th>
                  <th className="text-left font-medium px-4 py-3">Componente / Path</th>
                  <th className="text-left font-medium px-4 py-3 w-[120px]">Tipo metadato</th>
                  <th className="text-left font-medium px-4 py-3 w-[80px] text-center">Modifiche</th>
                  <th className="text-left font-medium px-4 py-3 w-[80px] text-center">Task</th>
                  <th className="text-left font-medium px-4 py-3 w-[90px]">Ultimo stato</th>
                  <th className="text-left font-medium px-4 py-3 w-[110px]">Ultima modifica</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {components.map(comp => {
                  const techCfg = getTechConfig(comp.technology)
                  const changeCfg = CHANGE_STATUS_CONFIG[comp.last_change_status as keyof typeof CHANGE_STATUS_CONFIG] ?? CHANGE_STATUS_CONFIG.new
                  const encodedRef = encodeURIComponent(comp.component_ref)

                  return (
                    <tr key={comp.component_ref} className="hover:bg-muted/10 transition-colors group">
                      {/* Tech badge */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border',
                          techCfg.bgColor, techCfg.color, techCfg.borderColor
                        )}>
                          {techCfg.badge}
                        </span>
                      </td>

                      {/* Nome componente — link al dettaglio */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/components/${encodedRef}`}
                          className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline break-all"
                        >
                          {comp.component_ref}
                        </Link>
                      </td>

                      {/* Tipo metadato */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {comp.metadata_type}
                        </span>
                      </td>

                      {/* N° modifiche */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                          <Hash className="size-3 text-muted-foreground" />
                          {comp.total_changes}
                        </span>
                      </td>

                      {/* N° task */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                          <GitBranch className="size-3 text-muted-foreground" />
                          {comp.task_count}
                        </span>
                      </td>

                      {/* Ultimo stato */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                          changeCfg.bgColor, changeCfg.color, changeCfg.borderColor
                        )}>
                          {changeCfg.label}
                        </span>
                      </td>

                      {/* Ultima modifica */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {new Date(comp.last_modified).toLocaleDateString('it-IT', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
