'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Target, Calendar, ArrowLeft, Save } from 'lucide-react'
import { getGoalsForEmployeeCycle, allocatePoints } from '@/lib/actions/kpi'
import { ClientDashboardLayout } from '@/components/layout/client-dashboard-layout'
import type { KPIGoal } from '@/lib/types/database'
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
  }
}

export default function AllocatePointsPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cycle, setCycle] = useState<CycleWithUser | null>(null)
  const [goals, setGoals] = useState<KPIGoal[]>([])
  const [allocations, setAllocations] = useState<{ [goalId: string]: { points: string; remarks: string } }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cycleId, setCycleId] = useState<string>('')

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setCycleId(resolvedParams.cycleId)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (cycleId) {
      loadData()
    }
  }, [cycleId])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const result = await getGoalsForEmployeeCycle(cycleId)
    if (result.success && result.data) {
      setCycle(result.data.cycle)
      setGoals(result.data.goals)
      
      // Initialize allocations
      const initial: { [goalId: string]: { points: string; remarks: string } } = {}
      result.data.goals.forEach((goal: KPIGoal) => {
        initial[goal.id] = { points: '', remarks: '' }
      })
      setAllocations(initial)
    } else {
      setError(result.error || 'Failed to load data')
    }
    setLoading(false)
  }

  const getTotalPoints = () => {
    return Object.values(allocations).reduce((sum, a) => sum + (Number(a.points) || 0), 0)
  }

  const handleSubmit = () => {
    const total = getTotalPoints()
    
    if (total !== 100) {
      setError(`Total points must equal 100 (current: ${total})`)
      return
    }

    // Check all goals have points
    const missingPoints = goals.some(goal => !allocations[goal.id].points || Number(allocations[goal.id].points) <= 0)
    if (missingPoints) {
      setError('All goals must have points allocated')
      return
    }

    startTransition(async () => {
      const allocationData = goals.map(goal => ({
        goalId: goal.id,
        points: Number(allocations[goal.id].points),
        remarks: allocations[goal.id].remarks.trim() || undefined,
      }))

      const result = await allocatePoints(cycleId, allocationData)
      if (result.success) {
        router.push('/hod/review')
        router.refresh()
      } else {
        setError(result.error || 'Failed to allocate points')
      }
    })
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  const totalPoints = getTotalPoints()
  const remainingPoints = 100 - totalPoints

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

  if (!cycle) {
    return (
      <ClientDashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cycle not found</AlertDescription>
          </Alert>
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hod/review">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Allocate Points</h1>
          <p className="text-muted-foreground">
            {cycle.users.full_name} - {getMonthName(cycle.month)} {cycle.year}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Points Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Points Distribution</CardTitle>
          <CardDescription>
            Total must equal 100 points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Allocated</p>
              <p className="text-3xl font-bold">{totalPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-3xl font-bold ${remainingPoints < 0 ? 'text-destructive' : remainingPoints === 0 ? 'text-green-600' : ''}`}>
                {remainingPoints}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Goals</p>
              <p className="text-3xl font-bold">{goals.length}</p>
            </div>
          </div>
          <Progress value={Math.min(totalPoints, 100)} />
          {totalPoints === 100 && (
            <p className="text-sm text-green-600 font-medium">✓ Points correctly distributed</p>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      <div className="space-y-4">
        {goals.map((goal, index) => (
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
                  </div>
                  <CardTitle className="text-lg">{goal.description}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`points-${goal.id}`}>
                    Allocated Points * <span className="text-xs text-muted-foreground">(Weighted %)</span>
                  </Label>
                  <Input
                    id={`points-${goal.id}`}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter points"
                    value={allocations[goal.id]?.points || ''}
                    onChange={(e) => setAllocations({
                      ...allocations,
                      [goal.id]: { ...allocations[goal.id], points: e.target.value }
                    })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`remarks-${goal.id}`}>
                    HOD Remarks <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id={`remarks-${goal.id}`}
                    placeholder="Add feedback or comments"
                    value={allocations[goal.id]?.remarks || ''}
                    onChange={(e) => setAllocations({
                      ...allocations,
                      [goal.id]: { ...allocations[goal.id], remarks: e.target.value }
                    })}
                    disabled={isPending}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Link href="/hod/review">
          <Button variant="outline" disabled={isPending}>
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={isPending || totalPoints !== 100}
        >
          <Save className="w-4 h-4 mr-2" />
          {isPending ? 'Allocating...' : 'Allocate & Freeze Cycle'}
        </Button>
      </div>
    </div>
    </ClientDashboardLayout>
  )
}
