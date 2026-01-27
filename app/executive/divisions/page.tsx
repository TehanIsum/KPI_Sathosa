'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getDivisionPerformance } from '@/lib/actions/reporting'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { Users, Target, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'

interface DivisionStat {
  id: string
  name: string
  code: string
  employeeCount: number
  activeCycles: number
  avgPerformance: number
}

export default function DivisionPerformancePage() {
  const [divisions, setDivisions] = useState<DivisionStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      const result = await getDivisionPerformance()
      if (result.success && result.data) {
        setDivisions(result.data)
      } else {
        setError(result.error || 'Failed to load division data')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600'
    if (performance >= 75) return 'text-blue-600'
    if (performance >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return <Badge className="bg-green-600">Excellent</Badge>
    if (performance >= 75) return <Badge className="bg-blue-600">Good</Badge>
    if (performance >= 60) return <Badge className="bg-yellow-600">Average</Badge>
    return <Badge variant="destructive">Needs Improvement</Badge>
  }

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
            <BarChart3 className="h-8 w-8" />
            Division Performance Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare performance metrics across all divisions
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
              <CardTitle className="text-sm font-medium">Total Divisions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{divisions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {divisions.reduce((sum, d) => sum + d.employeeCount, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Avg</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {divisions.length > 0
                  ? Math.round(
                      divisions.reduce((sum, d) => sum + d.avgPerformance, 0) / divisions.length
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Division Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {divisions
            .sort((a, b) => b.avgPerformance - a.avgPerformance)
            .map((division) => (
              <Card key={division.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{division.name}</CardTitle>
                      <CardDescription>Code: {division.code}</CardDescription>
                    </div>
                    {getPerformanceBadge(division.avgPerformance)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Performance</span>
                      <span className={`text-2xl font-bold ${getPerformanceColor(division.avgPerformance)}`}>
                        {division.avgPerformance}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${division.avgPerformance}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Employees</span>
                      </div>
                      <div className="text-lg font-semibold">{division.employeeCount}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Active Cycles</span>
                      </div>
                      <div className="text-lg font-semibold">{division.activeCycles}</div>
                    </div>
                  </div>

                  {/* Participation Rate */}
                  {division.employeeCount > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Participation Rate</span>
                        <span className="font-medium">
                          {Math.round((division.activeCycles / division.employeeCount) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {divisions.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Division Data</h3>
              <p className="text-muted-foreground text-center">
                No division performance data available for the current month
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
