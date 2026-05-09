'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Componente separato che usa useSearchParams — deve stare dentro <Suspense>
function TabInitializer({ onRegister }: { onRegister: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('tab') === 'register') onRegister()
  }, [searchParams, onRegister])
  return null
}

function LoginContent() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({ title: 'Errore login', description: error.message, variant: 'destructive' })
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() || email.split('@')[0] } },
    })
    if (error) {
      toast({ title: 'Errore registrazione', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Account creato!', description: "Controlla la tua email per confermare l'account." })
      setTab('login')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex">
      <Toaster />

      {/* Legge ?tab=register senza bloccare il prerender */}
      <Suspense fallback={null}>
        <TabInitializer onRegister={() => setTab('register')} />
      </Suspense>

      {/* LEFT — branding */}
      <div className="hidden lg:flex w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <Link href="/landing" className="font-bold text-xl tracking-tight">
          TaskManager
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Organizza il tuo lavoro<br />senza distrazioni
          </h2>
          <ul className="space-y-2.5">
            {['Viste lista, griglia e kanban', 'Priorità visive e scadenze', 'Analytics integrate', 'Accesso sicuro con Supabase'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-background/80">
                <CheckCircle2 className="size-4 shrink-0 text-background/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-background/40">© {new Date().getFullYear()} TaskManager</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <Link href="/landing" className="lg:hidden block font-bold text-xl tracking-tight text-center">
            TaskManager
          </Link>

          {/* Tab switcher */}
          <div className="flex rounded-xl border p-1 gap-1">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Bentornato</h1>
                <p className="text-sm text-muted-foreground mt-1">Inserisci le tue credenziali per accedere</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" placeholder="nome@esempio.it" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Accesso...' : 'Accedi →'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Non hai un account?{' '}
                <button type="button" onClick={() => setTab('register')} className="underline underline-offset-4 text-foreground">Registrati</button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Crea account</h1>
                <p className="text-sm text-muted-foreground mt-1">Inizia a organizzare il tuo lavoro</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome (opzionale)</Label>
                <Input id="reg-name" type="text" placeholder="Mario Rossi" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="nome@esempio.it" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" placeholder="Min. 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creazione...' : 'Crea account →'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{' '}
                <button type="button" onClick={() => setTab('login')} className="underline underline-offset-4 text-foreground">Accedi</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
