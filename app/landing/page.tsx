import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Kanban, BarChart3, Zap } from 'lucide-react'

const features = [
  {
    icon: CheckCircle2,
    title: 'Gestione task semplice',
    description: 'Crea, organizza e completa i tuoi task con un flusso di lavoro intuitivo.',
  },
  {
    icon: Kanban,
    title: 'Viste multiple',
    description: 'Lista, griglia o kanban: scegli la vista che preferisci per ogni contesto.',
  },
  {
    icon: BarChart3,
    title: 'Analytics integrate',
    description: 'Monitora i tuoi progressi con grafici e statistiche in tempo reale.',
  },
  {
    icon: Zap,
    title: 'Priorità e scadenze',
    description: 'Tieni sotto controllo ciò che conta con priorità visive e promemoria di scadenza.',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* NAV */}
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">TaskManager</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Accedi</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login?tab=register">Inizia gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full mb-6">
          <Zap className="size-3" />
          Semplice, veloce, efficace
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl leading-tight">
          Organizza il tuo lavoro,<br />senza distrazioni
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl">
          Un task manager pensato per chi vuole concentrarsi su ciò che conta davvero.
          Niente rumore, solo chiarezza.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login?tab=register">Crea account gratuito</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Accedi</Link>
          </Button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold mb-12">Tutto ciò che ti serve</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-card border rounded-2xl p-5 space-y-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="size-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">Pronto a iniziare?</h2>
          <p className="text-muted-foreground mt-2 mb-6">Registrati in 30 secondi. Nessuna carta richiesta.</p>
          <Button size="lg" asChild>
            <Link href="/login?tab=register">Inizia gratis →</Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 h-12 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} TaskManager</p>
        </div>
      </footer>

    </main>
  )
}
