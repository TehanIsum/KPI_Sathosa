'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getEmployeeSubmittedCycles } from '@/lib/actions/kpi'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import Link from 'next/link'

interface CycleWithUser {
  id: string
  user_id: string
  month: number
  year: number
  status: string
  submitted_at: string
  users: {
    id: string
    email: string
    full_name: string
    division_id: string
    location_id: string
  }
}

export default function HODReviewPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<CycleWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCycles()
  }, [])

  const loadCycles = async () => {
    setLoading(true)
    setError('')

    const result = await getEmployeeSubmittedCycles()
    if (result.success) {
      setCycles(result.data || [])
    } else {
      setError(result.error || 'Failed to load cycles')
    }
    setLoading(false)
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Employee Goals</h1>
          <p className="text-muted-foreground">
            Allocate weighted points to submitted KPI goals
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pending Reviews
          </CardTitle>
          <CardDescription>
            Employees waiting for point allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No submitted goals awaiting your review
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle) => (
                <Card key={cycle.id} className="border-2 hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {cycle.users.full_name}
                          </h3>
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {getMonthName(cycle.month)} {cycle.year}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {cycle.users.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(cycle.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/hod/review/${cycle.id}`}>
                        <Button>
                          Review & Allocate Points
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ClientDashboardLayout>
  )
}
