'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UpdateProgressDialog } from '@/components/kpi/update-progress-dialog'
import { getCurrentCycle, getGoalsForCycle } from '@/lib/actions/kpi'
import { KPICycle, KPIGoal } from '@/lib/types/database'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Award,
  Clock,
  Edit
} from 'lucide-react'

export default function ProgressTrackingPage() {
  const [cycle, setCycle] = useState<KPICycle | null>(null)
  const [goals, setGoals] = useState<KPIGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<KPIGoal | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const cycleResult = await getCurrentCycle()
      if (!cycleResult.success || !cycleResult.data) {
        setError(cycleResult.error || 'No active cycle found')
        setLoading(false)
        return
      }

      setCycle(cycleResult.data)

      const goalsResult = await getGoalsForCycle(cycleResult.data.id)
      if (goalsResult.success && goalsResult.data) {
        setGoals(goalsResult.data)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateProgress = (goal: KPIGoal) => {
    setSelectedGoal(goal)
    setShowUpdateDialog(true)
  }

  const calculateProgress = (goal: KPIGoal) => {
    if (goal.target_type === 'quantity' && goal.target_quantity) {
      const actual = goal.actual_quantity || 0
      return Math.min((actual / goal.target_quantity) * 100, 100)
    }
    if (goal.target_type === 'deadline') {
      return goal.deadline_completed ? 100 : 0
    }
    return 0
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  const canUpdateProgress = cycle?.status === 'frozen'
  const hasAllocatedPoints = goals.some(g => g.allocated_points && g.allocated_points > 0)

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

  if (!cycle) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No active KPI cycle found</AlertDescription>
          </Alert>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
        <p className="text-muted-foreground">
          {getMonthName(cycle.month)} {cycle.year} - Update your goal achievements
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Alert */}
      {cycle.status === 'draft' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your goals are still in draft. Submit them for HOD review to begin tracking progress.
          </AlertDescription>
        </Alert>
      )}

      {cycle.status === 'submitted' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Waiting for HOD to allocate points. You can update progress once points are allocated.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">Active this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Allocated</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycle.total_allocated_points || 0}</div>
            <p className="text-xs text-muted-foreground">Total weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Achieved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycle.total_achieved_points?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Current score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycle.total_allocated_points > 0
                ? ((cycle.total_achieved_points / cycle.total_allocated_points) * 100).toFixed(0)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Goals Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your KPI goals to start tracking progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const progress = calculateProgress(goal)
            const progressColor = getProgressColor(progress)
            const canUpdate = canUpdateProgress && goal.allocated_points && goal.allocated_points > 0

            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Goal {index + 1}</Badge>
                        <Badge variant={goal.target_type === 'quantity' ? 'default' : 'secondary'}>
                          {goal.target_type === 'quantity' ? (
                            <>
                              <Target className="w-3 h-3 mr-1" />
                              Quantity: {goal.target_quantity}
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3 h-3 mr-1" />
                              Deadline: {new Date(goal.target_deadline!).toLocaleDateString()}
                            </>
                          )}
                        </Badge>
                        {goal.allocated_points && (
                          <Badge variant="outline" className="bg-primary/10">
                            <Award className="w-3 h-3 mr-1" />
                            {goal.allocated_points} points
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{goal.description}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Section */}
                  {goal.allocated_points && goal.allocated_points > 0 ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={`font-bold ${progressColor}`}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        
                        {goal.target_type === 'quantity' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Actual: {goal.actual_quantity || 0}
                            </span>
                            <span className="text-muted-foreground">
                              Target: {goal.target_quantity}
                            </span>
                          </div>
                        )}
                        
                        {goal.target_type === 'deadline' && goal.deadline_completed && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Deadline met
                          </div>
                        )}
                      </div>

                      {/* Achievement Score */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Achievement Score</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            {goal.achieved_points?.toFixed(1) || 0}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            / {goal.allocated_points}
                          </span>
                        </div>
                      </div>

                      {/* HOD Remarks */}
                      {goal.hod_remarks && (
                        <div className="border-l-2 border-primary pl-4">
                          <p className="text-sm font-medium mb-1">HOD Remarks:</p>
                          <p className="text-sm text-muted-foreground">{goal.hod_remarks}</p>
                        </div>
                      )}

                      {/* Update Button */}
                      {canUpdate && (
                        <Button
                          onClick={() => handleUpdateProgress(goal)}
                          variant="outline"
                          className="w-full"
                          disabled={isPending}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Update Progress
                        </Button>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Waiting for HOD to allocate points to this goal
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Update Progress Dialog */}
      {selectedGoal && (
        <UpdateProgressDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          goal={selectedGoal}
          onSuccess={loadData}
        />
      )}
    </div>
    </ClientDashboardLayout>
  )
}
