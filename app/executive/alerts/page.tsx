'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getDeadlineAlerts } from '@/lib/actions/reporting'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { AlertTriangle, Clock, AlertCircle, Calendar, User, Building2 } from 'lucide-react'

interface DeadlineAlert {
  goalId: string
  description: string
  deadline: string
  daysMissed: number
  isCritical: boolean
  employeeName: string
  employeeEmail: string
  division: string
  month: string
}

export default function CriticalAlertsPage() {
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      const result = await getDeadlineAlerts()
      if (result.success && result.data) {
        setAlerts(result.data)
      } else {
        setError(result.error || 'Failed to load alerts')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const getSeverityBadge = (daysMissed: number) => {
    if (daysMissed >= 7) return <Badge variant="destructive" className="animate-pulse">Critical</Badge>
    if (daysMissed >= 3) return <Badge variant="destructive">High Priority</Badge>
    return <Badge className="bg-orange-600">Overdue</Badge>
  }

  const getSeverityColor = (daysMissed: number) => {
    if (daysMissed >= 7) return 'border-red-600 bg-red-50 dark:bg-red-950'
    if (daysMissed >= 3) return 'border-orange-600 bg-orange-50 dark:bg-orange-950'
    return 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950'
  }

  const criticalAlerts = alerts.filter(a => a.isCritical)
  const regularAlerts = alerts.filter(a => !a.isCritical)

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Critical Alerts
          </h1>
          <p className="text-muted-foreground">
            Overdue and missed KPI deadlines requiring attention
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">Missed deadlines</p>
            </CardContent>
          </Card>

          <Card className="border-red-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical (3+ days)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Requires immediate action</p>
            </CardContent>
          </Card>

          <Card className="border-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Overdue</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{regularAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Under 3 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts (3+ days) */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-bold">Critical Priority (3+ Days Overdue)</h2>
            </div>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <Card key={alert.goalId} className={`border-2 ${getSeverityColor(alert.daysMissed)}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{alert.description}</CardTitle>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {alert.employeeName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {alert.division}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {alert.month}
                          </span>
                        </div>
                      </div>
                      {getSeverityBadge(alert.daysMissed)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="font-semibold">{new Date(alert.deadline).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Days Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{alert.daysMissed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Overdue Alerts */}
        {regularAlerts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-bold">Recently Overdue (Under 3 Days)</h2>
            </div>
            <div className="space-y-3">
              {regularAlerts.map((alert) => (
                <Card key={alert.goalId} className={`border ${getSeverityColor(alert.daysMissed)}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{alert.description}</CardTitle>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {alert.employeeName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {alert.division}
                          </span>
                        </div>
                      </div>
                      {getSeverityBadge(alert.daysMissed)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Deadline: </span>
                        <span className="font-medium">{new Date(alert.deadline).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Overdue: </span>
                        <span className="font-bold text-orange-600">{alert.daysMissed} days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-600">All Clear! 🎉</h3>
              <p className="text-muted-foreground text-center">
                No overdue deadlines at this time. Great work!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
