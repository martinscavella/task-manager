'use client'

import { useState, useEffect } from 'react'
import { TaskList } from '@/components/task-list'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { DashboardWidgets } from '@/components/dashboard-widgets'
import { MobileNav } from '@/components/mobile-nav'
import { MobileFab } from '@/components/mobile-fab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, ListTodo, LayoutDashboard } from 'lucide-react'
import { UserMenuButton } from '@/components/user-menu-button'
import type { Task } from '@/lib/types'
import type { UserPreferences } from '@/lib/profile-actions'

const TAB_KEY = 'home-active-tab'
const VALID_TABS = ['dashboard', 'tasks', 'analytics'] as const
type TabValue = typeof VALID_TABS[number]

function readTab(): TabValue {
  if (typeof window === 'undefined') return 'dashboard'
  try {
    const v = sessionStorage.getItem(TAB_KEY)
    if (v && VALID_TABS.includes(v as TabValue)) return v as TabValue
  } catch {}
  return 'dashboard'
}

interface Props {
  tasks: Task[]
  analytics: Parameters<typeof AnalyticsDashboard>[0]['data']
  preferences: UserPreferences
  firstName: string
  displayName: string
  email: string
  greeting: string
  dateLabel: string
}

export function HomeClient({
  tasks, analytics, preferences,
  firstName, displayName, email,
  greeting, dateLabel,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard')

  // Leggi il tab salvato al mount
  useEffect(() => {
    setActiveTab(readTab())
  }, [])

  const handleTabChange = (tab: string) => {
    const t = tab as TabValue
    setActiveTab(t)
    try { sessionStorage.setItem(TAB_KEY, t) } catch {}
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="w-full" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

      <div className="mx-auto max-w-7xl px-4 pt-3 pb-28">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm capitalize">{dateLabel}</p>
          </div>
          <div className="hidden sm:block">
            <UserMenuButton displayName={displayName} email={email} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="size-4" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="size-4" />Task
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="size-4" />Analytics
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <DashboardWidgets tasks={tasks} preferences={preferences} firstName={firstName} onTabChange={handleTabChange} />
            </TabsContent>
            <TabsContent value="tasks">
              <TaskList tasks={tasks} />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsDashboard data={analytics} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          {activeTab === 'dashboard' && (
            <DashboardWidgets tasks={tasks} preferences={preferences} firstName={firstName} onTabChange={handleTabChange} />
          )}
          {activeTab === 'tasks' && <TaskList tasks={tasks} />}
          {activeTab === 'analytics' && <AnalyticsDashboard data={analytics} />}
        </div>
      </div>

      <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
      <MobileFab />
    </main>
  )
}
