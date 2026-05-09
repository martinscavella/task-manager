'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Check, UserCircle, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { upsertProfile, upsertPreferences, type Profile, type UserPreferences } from '@/lib/profile-actions'

const TIMEZONES = [
  'Europe/Rome', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
]

const ALL_WIDGETS = [
  { id: 'stats', label: 'Statistiche generali' },
  { id: 'overdue', label: 'Task scaduti' },
  { id: 'recent', label: 'Task recenti' },
  { id: 'completed_week', label: 'Completati questa settimana' },
]

interface SettingsViewProps {
  email: string
  profile: Profile | null
  preferences: UserPreferences
}

export function SettingsView({ email, profile: initialProfile, preferences: initialPrefs }: SettingsViewProps) {
  const [section, setSection] = useState<'profile' | 'app'>('profile')

  // Profilo
  const [prof, setProf] = useState<Profile>({
    full_name: initialProfile?.full_name ?? '',
    role: initialProfile?.role ?? '',
    company: initialProfile?.company ?? '',
    bio: initialProfile?.bio ?? '',
    phone: initialProfile?.phone ?? '',
    timezone: initialProfile?.timezone ?? 'Europe/Rome',
    avatar_url: initialProfile?.avatar_url ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Preferenze
  const [prefs, setPrefs] = useState<UserPreferences>(initialPrefs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const updateProf = (k: keyof Profile, v: string) => {
    setProf(p => ({ ...p, [k]: v }))
    setProfileSaved(false)
  }

  const updatePref = <K extends keyof UserPreferences>(k: K, v: UserPreferences[K]) => {
    setPrefs(p => ({ ...p, [k]: v }))
    setPrefsSaved(false)
  }

  const toggleWidget = (id: string) => {
    const current = prefs.dashboard_widgets
    const next = current.includes(id) ? current.filter(w => w !== id) : [...current, id]
    updatePref('dashboard_widgets', next)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    await upsertProfile(prof)
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    await upsertPreferences(prefs)
    setSavingPrefs(false)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
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
      {/* Sidebar */}
      <nav className="w-48 shrink-0 space-y-1">
        {navItem('profile', 'Profilo', UserCircle)}
        {navItem('app', 'Impostazioni App', SlidersHorizontal)}
      </nav>

      <div className="flex-1 min-w-0 space-y-6">

        {/* PROFILO */}
        {section === 'profile' && (
          <div className="border rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profilo</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={prof.full_name ?? ''} onChange={e => updateProf('full_name', e.target.value)} placeholder="Mario Rossi" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label>Ruolo / Posizione</Label>
                <Input value={prof.role ?? ''} onChange={e => updateProf('role', e.target.value)} placeholder="es. Product Manager" />
              </div>
              <div className="space-y-2">
                <Label>Azienda</Label>
                <Input value={prof.company ?? ''} onChange={e => updateProf('company', e.target.value)} placeholder="es. Acme S.r.l." />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={prof.phone ?? ''} onChange={e => updateProf('phone', e.target.value)} placeholder="+39 333 000 0000" type="tel" />
              </div>
              <div className="space-y-2">
                <Label>Fuso orario</Label>
                <Select value={prof.timezone ?? 'Europe/Rome'} onValueChange={v => updateProf('timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={prof.bio ?? ''}
                onChange={e => updateProf('bio', e.target.value)}
                placeholder="Breve descrizione di te..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
              {profileSaved ? <><Check className="size-4" />Salvato!</> : savingProfile ? 'Salvataggio...' : 'Salva profilo'}
            </Button>
          </div>
        )}

        {/* IMPOSTAZIONI APP */}
        {section === 'app' && (
          <div className="border rounded-2xl p-6 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Impostazioni App</h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Vista predefinita</Label>
                <Select value={prefs.default_view} onValueChange={v => updatePref('default_view', v as UserPreferences['default_view'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Lista compatta</SelectItem>
                    <SelectItem value="grid">Griglia card</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordinamento predefinito</Label>
                <Select value={prefs.default_sort} onValueChange={v => updatePref('default_sort', v as UserPreferences['default_sort'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Più recenti prima</SelectItem>
                    <SelectItem value="created_asc">Meno recenti prima</SelectItem>
                    <SelectItem value="priority">Per priorità</SelectItem>
                    <SelectItem value="due_date">Per scadenza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Mostra task completati</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Includi completati e annullati nella lista</p>
                </div>
                <Switch checked={prefs.show_completed} onCheckedChange={v => updatePref('show_completed', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Card compatte</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Usa la vista lista come default</p>
                </div>
                <Switch checked={prefs.compact_cards} onCheckedChange={v => updatePref('compact_cards', v)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Widget dashboard</Label>
              <p className="text-xs text-muted-foreground">Scegli quali widget visualizzare nella dashboard</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {ALL_WIDGETS.map(w => (
                  <label key={w.id} className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors',
                    prefs.dashboard_widgets.includes(w.id)
                      ? 'border-foreground/30 bg-accent'
                      : 'border-border hover:bg-muted/40'
                  )}>
                    <input
                      type="checkbox"
                      checked={prefs.dashboard_widgets.includes(w.id)}
                      onChange={() => toggleWidget(w.id)}
                      className="accent-foreground"
                    />
                    <span className="text-sm">{w.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSavePrefs} disabled={savingPrefs} className="gap-2">
              {prefsSaved ? <><Check className="size-4" />Salvato!</> : savingPrefs ? 'Salvataggio...' : 'Salva impostazioni'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
