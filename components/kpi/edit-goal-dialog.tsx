'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { updateGoal } from '@/lib/actions/kpi'
import type { KPIGoal, KPITargetType } from '@/lib/types/database'

interface EditGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: KPIGoal
  onSuccess: () => void
}

export function EditGoalDialog({ open, onOpenChange, goal, onSuccess }: EditGoalDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    description: goal.description,
    targetType: goal.target_type,
    targetQuantity: goal.target_quantity?.toString() || '',
    targetDeadline: goal.target_deadline || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    if (formData.targetType === 'quantity' && !formData.targetQuantity) {
      setError('Target quantity is required')
      return
    }

    if (formData.targetType === 'deadline' && !formData.targetDeadline) {
      setError('Target deadline is required')
      return
    }

    startTransition(async () => {
      const result = await updateGoal(goal.id, {
        description: formData.description.trim(),
        targetType: formData.targetType,
        targetQuantity: formData.targetQuantity ? Number(formData.targetQuantity) : undefined,
        targetDeadline: formData.targetDeadline || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(result.error || 'Failed to update goal')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit KPI Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Update goal details (only available for draft goals)
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Goal Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isPending}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type *</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => setFormData({ ...formData, targetType: value as KPITargetType })}
                disabled={isPending}
              >
                <SelectTrigger id="targetType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity Target</SelectItem>
                  <SelectItem value="deadline">Deadline Target</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.targetType === 'quantity' && (
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Quantity *</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  min="1"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                  disabled={isPending}
                  required
                />
              </div>
            )}

            {formData.targetType === 'deadline' && (
              <div className="space-y-2">
                <Label htmlFor="targetDeadline">Target Deadline *</Label>
                <Input
                  id="targetDeadline"
                  type="date"
                  value={formData.targetDeadline}
                  onChange={(e) => setFormData({ ...formData, targetDeadline: e.target.value })}
                  disabled={isPending}
                  required
                />
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
              {isPending ? 'Updating...' : 'Update Goal'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
