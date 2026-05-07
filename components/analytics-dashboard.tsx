'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STATUS_CONFIG, PRIORITY_CONFIG, type TaskStatus, type TaskPriority } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Calendar } from 'lucide-react'

interface AnalyticsData {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<number, number>
  completedThisWeek: number
  completedThisMonth: number
  overdue: number
  avgCompletionTime: number
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: '#64748b',
  TO_BE_STARTED: '#6b7280',
  WAITING_REQUIREMENTS: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#8b5cf6',
  IN_TEST: '#06b6d4',
  BLOCKED: '#ef4444',
  COMPLETED: '#10b981',
  CANCELLED: '#78716c',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const statusData = Object.entries(data.byStatus).map(([status, count]) => ({
    name: STATUS_CONFIG[status as TaskStatus]?.label || status,
    value: count,
    color: STATUS_COLORS[status as TaskStatus] || '#6b7280',
  }))

  const priorityData = Object.entries(data.byPriority).map(([priority, count]) => ({
    name: PRIORITY_CONFIG[Number(priority) as TaskPriority]?.label || `P${priority}`,
    value: count,
    color: PRIORITY_COLORS[Number(priority) as TaskPriority] || '#6b7280',
  }))

  const activeTasksCount = data.total - (data.byStatus['COMPLETED'] || 0) - (data.byStatus['CANCELLED'] || 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Task</p>
                <p className="text-2xl font-bold">{data.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attivi</p>
                <p className="text-2xl font-bold">{activeTasksCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati (7gg)</p>
                <p className="text-2xl font-bold">{data.completedThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati (30gg)</p>
                <p className="text-2xl font-bold">{data.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scaduti</p>
                <p className="text-2xl font-bold">{data.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Media Completamento</p>
                <p className="text-2xl font-bold">{data.avgCompletionTime}gg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione per Priorità</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
