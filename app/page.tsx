'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { TaskList } from '@/components/task-list'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { DashboardWidgets } from '@/components/dashboard-widgets'
import { MobileNav } from '@/components/mobile-nav'
import { MobileFab } from '@/components/mobile-fab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, ListTodo, LayoutDashboard } from 'lucide-react'
import { UserMenuButton } from '@/components/user-menu-button'
import type { Task, TaskAnalytics } from '@/lib/types'
import type { UserPreferences } from '@/lib/profile-actions'

interface HomeClientProps {
  tasks: Task[]
  analytics: TaskAnalytics
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
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-safe">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm capitalize">{dateLabel}</p>
          </div>
          <UserMenuButton displayName={displayName} email={email} />
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              <DashboardWidgets tasks={tasks} preferences={preferences} firstName={firstName} />
            </TabsContent>
            <TabsContent value="tasks">
              <TaskList tasks={tasks} />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsDashboard data={analytics} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile content — driven by MobileNav */}
        <div className="md:hidden">
          {activeTab === 'dashboard' && (
            <DashboardWidgets tasks={tasks} preferences={preferences} firstName={firstName} />
          )}
          {activeTab === 'tasks' && <TaskList tasks={tasks} />}
          {activeTab === 'analytics' && <AnalyticsDashboard data={analytics} />}
        </div>
      </div>

      {/* Mobile bottom nav + FAB */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <MobileFab />
    </main>
  )
}
