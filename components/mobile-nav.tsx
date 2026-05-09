'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, ListTodo, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'dashboard', label: 'Home',      icon: LayoutDashboard },
  { id: 'tasks',     label: 'Task',      icon: ListTodo },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings',  label: 'Profilo',   icon: Settings, href: '/settings' },
] as const

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileNav({ activeTab, onTabChange }: Props) {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => {
                if (href) { router.push(href); return }
                onTabChange(id)
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
              aria-label={label}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive && 'bg-foreground/10'
              )}>
                <Icon className={cn('size-5', isActive && 'stroke-[2.5]')} />
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
