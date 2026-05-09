'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Check, UserCircle, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsViewProps {
  email: string
  displayName: string
  userId: string
}

// Chiavi localStorage per le preferenze app
const PREFS_KEY = 'tm_preferences'

function loadPrefs() {
  if (typeof window === 'undefined') return defaultPrefs()
  try {
    return { ...defaultPrefs(), ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return defaultPrefs()
  }
}

function defaultPrefs() {
  return {
    defaultView: 'list' as 'list' | 'grid' | 'kanban',
    defaultSort: 'created_desc' as 'created_desc' | 'created_asc' | 'priority' | 'due_date',
    showCompleted: true,
    compactCards: false,
  }
}

function savePrefs(prefs: ReturnType<typeof defaultPrefs>) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function SettingsView({ email, displayName: initialName, userId }: SettingsViewProps) {
  const router = useRouter()
  const [section, setSection] = useState<'profile' | 'app'>('profile')

  // Profilo
  const [name, setName] = useState(initialName)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Preferenze app
  const [prefs, setPrefs] = useState(loadPrefs)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const updatePref = <K extends keyof ReturnType<typeof defaultPrefs>>(key: K, value: ReturnType<typeof defaultPrefs>[K]) => {
    setPrefs(p => ({ ...p, [key]: value }))
    setPrefsSaved(false)
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) return
    setSavingProfile(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => {
      setProfileSaved(false)
      router.refresh()
    }, 1500)
  }

  const handleSavePrefs = () => {
    savePrefs(prefs)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 1500)
  }

  const navItem = (id: 'profile' | 'app', label: string, Icon: React.ElementType) => (
    <button
      onClick={() => setSection(id)}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
        section === id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )

  return (
    <div className="flex gap-8">
      {/* Sidebar nav */}
      <nav className="w-44 shrink-0 space-y-1">
        {navItem('profile', 'Profilo', UserCircle)}
        {navItem('app', 'Impostazioni App', SlidersHorizontal)}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* PROFILO */}
        {section === 'profile' && (
          <div className="space-y-6">
            <div className="border rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profilo</h2>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nome visualizzato</Label>
                <Input
                  id="displayName"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setProfileSaved(false) }}
                  placeholder="Mario Rossi"
                  className="max-w-sm"
                />
                <p className="text-xs text-muted-foreground">Appare nell&apos;header al posto dell&apos;email</p>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled className="max-w-sm bg-muted/40" />
                <p className="text-xs text-muted-foreground">L&apos;email non può essere modificata da qui</p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="gap-2"
              >
                {profileSaved ? <><Check className="size-4" />Salvato!</> : savingProfile ? 'Salvataggio...' : 'Salva profilo'}
              </Button>
            </div>
          </div>
        )}

        {/* IMPOSTAZIONI APP */}
        {section === 'app' && (
          <div className="space-y-6">
            <div className="border rounded-2xl p-6 space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Impostazioni App</h2>

              {/* Vista predefinita */}
              <div className="space-y-2">
                <Label>Vista predefinita</Label>
                <Select value={prefs.defaultView} onValueChange={(v) => updatePref('defaultView', v as typeof prefs.defaultView)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Lista compatta</SelectItem>
                    <SelectItem value="grid">Griglia card</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Vista selezionata all&apos;apertura dell&apos;app</p>
              </div>

              {/* Ordinamento predefinito */}
              <div className="space-y-2">
                <Label>Ordinamento predefinito</Label>
                <Select value={prefs.defaultSort} onValueChange={(v) => updatePref('defaultSort', v as typeof prefs.defaultSort)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Più recenti prima</SelectItem>
                    <SelectItem value="created_asc">Meno recenti prima</SelectItem>
                    <SelectItem value="priority">Per priorità</SelectItem>
                    <SelectItem value="due_date">Per scadenza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mostra completati */}
              <div className="flex items-center justify-between max-w-sm">
                <div>
                  <Label className="text-sm font-medium">Mostra task completati</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Includi completati e annullati nella lista</p>
                </div>
                <Switch
                  checked={prefs.showCompleted}
                  onCheckedChange={(v) => updatePref('showCompleted', v)}
                />
              </div>

              {/* Card compatte */}
              <div className="flex items-center justify-between max-w-sm">
                <div>
                  <Label className="text-sm font-medium">Card compatte</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Usa la vista lista compatta come default</p>
                </div>
                <Switch
                  checked={prefs.compactCards}
                  onCheckedChange={(v) => updatePref('compactCards', v)}
                />
              </div>

              <Button onClick={handleSavePrefs} className="gap-2">
                {prefsSaved ? <><Check className="size-4" />Salvato!</> : 'Salva impostazioni'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground px-1">
              Le preferenze vengono salvate localmente nel browser.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
