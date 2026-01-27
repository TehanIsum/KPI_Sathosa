'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Edit2, Trash2, Target, Calendar, Lock, CheckCircle, FileEdit } from 'lucide-react'
import { deleteGoal, updateProgress } from '@/lib/actions/kpi'
import type { KPIGoal, KPICycleStatus } from '@/lib/types/database'
import { EditGoalDialog } from './edit-goal-dialog'
import { UpdateProgressDialog } from './update-progress-dialog'
import { RequestEditDialog } from './request-edit-dialog'

interface GoalCardProps {
  goal: KPIGoal
  cycleStatus: KPICycleStatus
  onUpdate: () => void
}

export function GoalCard({ goal, cycleStatus, onUpdate }: GoalCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [showRequestEditDialog, setShowRequestEditDialog] = useState(false)

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    startTransition(async () => {
      const result = await deleteGoal(goal.id)
      if (result.success) {
        onUpdate()
      }
    })
  }

  const calculateProgress = () => {
    if (goal.target_type === 'quantity' && goal.target_quantity) {
      const actual = goal.actual_quantity || 0
      return Math.min((actual / goal.target_quantity) * 100, 100)
    }
    if (goal.target_type === 'deadline') {
      return goal.deadline_completed ? 100 : 0
    }
    return 0
  }

  const progress = calculateProgress()
  const isEditable = cycleStatus === 'draft' && !goal.is_locked
  const canUpdateProgress = cycleStatus === 'frozen'
  const canRequestEdit = goal.is_locked && (cycleStatus === 'submitted' || cycleStatus === 'frozen')

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">{goal.description}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                {goal.is_locked && (
                  <Badge variant="outline">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
                {goal.allocated_points && (
                  <Badge variant="secondary">
                    {goal.allocated_points} points
                  </Badge>
                )}
              </div>
            </div>

            {isEditable && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                  disabled={isPending}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          {(canUpdateProgress || goal.allocated_points) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} />
              {goal.target_type === 'quantity' && (
                <p className="text-sm text-muted-foreground">
                  {goal.actual_quantity || 0} / {goal.target_quantity} completed
                </p>
              )}
              {goal.target_type === 'deadline' && goal.deadline_completed && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Deadline met
                </div>
              )}
            </div>
          )}

          {/* HOD Remarks */}
          {goal.hod_remarks && (
            <div className="border-l-2 border-muted pl-4">
              <p className="text-sm font-medium mb-1">HOD Remarks:</p>
              <p className="text-sm text-muted-foreground">{goal.hod_remarks}</p>
            </div>
          )}

          {/* Achieved Points */}
          {goal.achieved_points > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Points Achieved</span>
              <span className="text-lg font-bold text-primary">{goal.achieved_points}</span>
            </div>
          )}

          {/* Update Progress Button */}
          {canUpdateProgress && goal.allocated_points && (
            <Button
              onClick={() => setShowProgressDialog(true)}
              variant="outline"
              className="w-full"
            >
              Update Progress
            </Button>
          )}

          {/* Request Edit Button */}
          {canRequestEdit && (
            <Button
              onClick={() => setShowRequestEditDialog(true)}
              variant="outline"
              className="w-full"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Request Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditGoalDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        goal={goal}
        onSuccess={onUpdate}
      />

      {/* Progress Update Dialog */}
      <UpdateProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        goal={goal}
        onSuccess={onUpdate}
      />

      {/* Request Edit Dialog */}
      <RequestEditDialog
        open={showRequestEditDialog}
        onOpenChange={setShowRequestEditDialog}
        goal={goal}
        onSuccess={onUpdate}
      />
    </>
  )
}
