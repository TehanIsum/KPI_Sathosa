'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getTopPerformers } from '@/lib/actions/reporting'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { Award, Trophy, Medal, AlertCircle, TrendingUp } from 'lucide-react'

interface Performer {
  userId: string
  name: string
  email: string
  division: string
  location: string
  performance: number
  achievedPoints: number
  allocatedPoints: number
}

export default function TopPerformersPage() {
  const [performers, setPerformers] = useState<Performer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      const result = await getTopPerformers(20)
      if (result.success && result.data) {
        setPerformers(result.data)
      } else {
        setError(result.error || 'Failed to load top performers')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />
    return <Award className="h-5 w-5 text-muted-foreground" />
  }

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 95) return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Exceptional</Badge>
    if (performance >= 90) return <Badge className="bg-green-600">Excellent</Badge>
    if (performance >= 85) return <Badge className="bg-blue-600">Great</Badge>
    return <Badge className="bg-purple-600">Good</Badge>
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
            <Trophy className="h-8 w-8 text-yellow-500" />
            Top Performers
          </h1>
          <p className="text-muted-foreground">
            Highest achieving employees this month
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Top 3 Podium */}
        {performers.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 2nd Place */}
            <Card className="border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">#2</CardTitle>
                  <Medal className="h-8 w-8 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-bold text-xl">{performers[1].name}</p>
                  <p className="text-sm text-muted-foreground">{performers[1].division}</p>
                </div>
                <div className="text-3xl font-bold text-gray-600">{performers[1].performance}%</div>
                {getPerformanceBadge(performers[1].performance)}
              </CardContent>
            </Card>

            {/* 1st Place */}
            <Card className="border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 md:-mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">🏆 #1</CardTitle>
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-bold text-2xl">{performers[0].name}</p>
                  <p className="text-sm text-muted-foreground">{performers[0].division}</p>
                </div>
                <div className="text-4xl font-bold text-yellow-600">{performers[0].performance}%</div>
                {getPerformanceBadge(performers[0].performance)}
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className="border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">#3</CardTitle>
                  <Medal className="h-8 w-8 text-amber-700" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-bold text-xl">{performers[2].name}</p>
                  <p className="text-sm text-muted-foreground">{performers[2].division}</p>
                </div>
                <div className="text-3xl font-bold text-amber-700">{performers[2].performance}%</div>
                {getPerformanceBadge(performers[2].performance)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Full Leaderboard
            </CardTitle>
            <CardDescription>All top performers ranked by achievement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performers.map((performer, index) => (
                <div
                  key={performer.userId}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    index < 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {index < 3 ? (
                      getRankIcon(index)
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{performer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{performer.division}</span>
                      <span>•</span>
                      <span>{performer.location}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="font-semibold">
                        {performer.achievedPoints.toFixed(1)} / {performer.allocatedPoints}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-2xl font-bold text-primary">{performer.performance}%</p>
                    </div>
                    {getPerformanceBadge(performer.performance)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {performers.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
              <p className="text-muted-foreground text-center">
                No completed KPI cycles available for this month
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientDashboardLayout>
  )
}
