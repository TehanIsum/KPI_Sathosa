'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getPerformanceTrends } from '@/lib/actions/reporting'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3 } from 'lucide-react'

interface TrendData {
  month: string
  monthNumber: number
  year: number
  avgPerformance: number
  cycleCount: number
}

export default function PerformanceAnalyticsPage() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      const result = await getPerformanceTrends(6)
      if (result.success && result.data) {
        setTrends(result.data)
      } else {
        setError(result.error || 'Failed to load trend data')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </ClientDashboardLayout>
    )
  }

  const latestTrend = trends[trends.length - 1]
  const previousTrend = trends[trends.length - 2]

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Historical performance trends and comparisons
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Month Summary */}
        {latestTrend && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestTrend.avgPerformance}%</div>
                <p className="text-xs text-muted-foreground">{latestTrend.month}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Month-over-Month</CardTitle>
                {previousTrend && getTrendIcon(latestTrend.avgPerformance, previousTrend.avgPerformance)}
              </CardHeader>
              <CardContent>
                {previousTrend ? (
                  <>
                    <div className={`text-2xl font-bold ${getTrendColor(latestTrend.avgPerformance, previousTrend.avgPerformance)}`}>
                      {latestTrend.avgPerformance - previousTrend.avgPerformance > 0 ? '+' : ''}
                      {latestTrend.avgPerformance - previousTrend.avgPerformance}%
                    </div>
                    <p className="text-xs text-muted-foreground">vs {previousTrend.month}</p>
                  </>
                ) : (
                  <div className="text-2xl font-bold">N/A</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">6-Month Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trends.length > 0
                    ? Math.round(trends.reduce((sum, t) => sum + t.avgPerformance, 0) / trends.length)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Overall trend</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Chart (Simple Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>6-Month Performance Trend</CardTitle>
            <CardDescription>Average performance by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={`${trend.year}-${trend.monthNumber}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[100px]">{trend.month}</span>
                      {index > 0 && getTrendIcon(trend.avgPerformance, trends[index - 1].avgPerformance)}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{trend.cycleCount} cycles</span>
                      <span className="text-lg font-bold min-w-[50px] text-right">{trend.avgPerformance}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        trend.avgPerformance >= 90
                          ? 'bg-green-600'
                          : trend.avgPerformance >= 75
                          ? 'bg-blue-600'
                          : trend.avgPerformance >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${trend.avgPerformance}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key observations from the data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trends.length >= 2 && (
              <>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Best Month</p>
                    <p className="text-sm text-muted-foreground">
                      {trends.reduce((best, current) =>
                        current.avgPerformance > best.avgPerformance ? current : best
                      ).month} with {trends.reduce((best, current) =>
                        current.avgPerformance > best.avgPerformance ? current : best
                      ).avgPerformance}% average performance
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Lowest Month</p>
                    <p className="text-sm text-muted-foreground">
                      {trends.reduce((lowest, current) =>
                        current.avgPerformance < lowest.avgPerformance ? current : lowest
                      ).month} with {trends.reduce((lowest, current) =>
                        current.avgPerformance < lowest.avgPerformance ? current : lowest
                      ).avgPerformance}% average performance
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Total Cycles</p>
                    <p className="text-sm text-muted-foreground">
                      {trends.reduce((sum, t) => sum + t.cycleCount, 0)} KPI cycles tracked over 6 months
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {trends.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trend Data</h3>
              <p className="text-muted-foreground text-center">
                No performance trends available yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
