'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { updateProgress } from '@/lib/actions/kpi'
import type { KPIGoal } from '@/lib/types/database'

interface UpdateProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: KPIGoal
  onSuccess: () => void
}

export function UpdateProgressDialog({ open, onOpenChange, goal, onSuccess }: UpdateProgressDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [actualQuantity, setActualQuantity] = useState(goal.actual_quantity?.toString() || '')
  const [deadlineCompleted, setDeadlineCompleted] = useState(goal.deadline_completed || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const data: { actualQuantity?: number; deadlineCompleted?: boolean } = {}
      
      if (goal.target_type === 'quantity') {
        data.actualQuantity = actualQuantity ? Number(actualQuantity) : 0
      } else {
        data.deadlineCompleted = deadlineCompleted
      }

      const result = await updateProgress(goal.id, data)

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(result.error || 'Failed to update progress')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Report your progress on this goal
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">{goal.description}</p>
              {goal.target_type === 'quantity' && (
                <p className="text-sm text-muted-foreground">Target: {goal.target_quantity}</p>
              )}
              {goal.target_type === 'deadline' && (
                <p className="text-sm text-muted-foreground">
                  Deadline: {new Date(goal.target_deadline!).toLocaleDateString()}
                </p>
              )}
            </div>

            {goal.target_type === 'quantity' && (
              <div className="space-y-2">
                <Label htmlFor="actualQuantity">Actual Quantity Achieved</Label>
                <Input
                  id="actualQuantity"
                  type="number"
                  min="0"
                  step="any"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  disabled={isPending}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Target: {goal.target_quantity}. You can enter more if you overachieved!
                </p>
              </div>
            )}

            {goal.target_type === 'deadline' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deadlineCompleted"
                  checked={deadlineCompleted}
                  onCheckedChange={(checked) => setDeadlineCompleted(checked as boolean)}
                  disabled={isPending}
                />
                <label
                  htmlFor="deadlineCompleted"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have completed this task by the deadline
                </label>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Progress'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
