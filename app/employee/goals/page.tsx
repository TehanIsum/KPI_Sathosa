'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar, Target, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { getCurrentCycle, getGoalsForCycle, submitCycle } from '@/lib/actions/kpi'
import type { KPICycle, KPIGoal } from '@/lib/types/database'
import { CreateGoalDialog } from '@/components/kpi/create-goal-dialog'
import { GoalCard } from '@/components/kpi/goal-card'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'

export default function EmployeeGoalsPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cycle, setCycle] = useState<KPICycle | null>(null)
  const [goals, setGoals] = useState<KPIGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')

    const cycleResult = await getCurrentCycle()
    if (!cycleResult.success) {
      setError(cycleResult.error || 'Failed to load cycle')
      setLoading(false)
      return
    }

    setCycle(cycleResult.data)

    const goalsResult = await getGoalsForCycle(cycleResult.data.id)
    if (!goalsResult.success) {
      setError(goalsResult.error || 'Failed to load goals')
      setLoading(false)
      return
    }

    setGoals(goalsResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = () => {
    if (!cycle) return

    startTransition(async () => {
      const result = await submitCycle(cycle.id)
      if (result.success) {
        router.refresh()
        await loadData()
      } else {
        setError(result.error || 'Failed to submit')
      }
    })
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>,
      submitted: <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />Submitted</Badge>,
      frozen: <Badge><Target className="w-3 h-3 mr-1" />Active</Badge>,
    }
    return badges[status as keyof typeof badges] || null
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My KPI Goals</h1>
          <p className="text-muted-foreground">
            {cycle && `${getMonthName(cycle.month)} ${cycle.year}`}
          </p>
        </div>
        {cycle && getStatusBadge(cycle.status)}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cycle Summary Card */}
      {cycle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {getMonthName(cycle.month)} {cycle.year} Goals
            </CardTitle>
            <CardDescription>
              {cycle.status === 'draft' && 'Create up to 10 KPI goals and submit for HOD review'}
              {cycle.status === 'submitted' && 'Waiting for HOD to allocate points'}
              {cycle.status === 'frozen' && 'Update your progress throughout the month'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{goals.length}/10</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Allocated Points</p>
                <p className="text-2xl font-bold">{cycle.total_allocated_points || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Achieved Points</p>
                <p className="text-2xl font-bold">{cycle.total_achieved_points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {cycle?.status === 'draft' && (
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={goals.length >= 10}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
          {goals.length > 0 && (
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          )}
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first KPI goal for this month
              </p>
              {cycle?.status === 'draft' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Goal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              cycleStatus={cycle?.status || 'draft'}
              onUpdate={loadData}
            />
          ))
        )}
      </div>

      {/* Create Goal Dialog */}
      {cycle && (
        <CreateGoalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          cycleId={cycle.id}
          onSuccess={loadData}
        />
      )}
    </div>
    </ClientDashboardLayout>
  )
}
