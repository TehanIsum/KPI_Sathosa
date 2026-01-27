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
import { createGoal } from '@/lib/actions/kpi'
import type { KPITargetType } from '@/lib/types/database'

interface CreateGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleId: string
  onSuccess: () => void
}

export function CreateGoalDialog({ open, onOpenChange, cycleId, onSuccess }: CreateGoalDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    description: '',
    targetType: '' as KPITargetType | '',
    targetQuantity: '',
    targetDeadline: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    if (!formData.targetType) {
      setError('Target type is required')
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
      const result = await createGoal({
        cycleId,
        description: formData.description.trim(),
        targetType: formData.targetType as KPITargetType,
        targetQuantity: formData.targetQuantity ? Number(formData.targetQuantity) : undefined,
        targetDeadline: formData.targetDeadline || undefined,
      })

      if (result.success) {
        setFormData({ description: '', targetType: '', targetQuantity: '', targetDeadline: '' })
        onOpenChange(false)
        onSuccess()
      } else {
        setError(result.error || 'Failed to create goal')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New KPI Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Define a specific, measurable goal for this month
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
                placeholder="Example: Complete customer satisfaction survey for all vehicle sales"
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
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity Target</SelectItem>
                  <SelectItem value="deadline">Deadline Target</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Quantity: Achieve a specific number (e.g., 50 sales calls)<br />
                Deadline: Complete by a specific date
              </p>
            </div>

            {formData.targetType === 'quantity' && (
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Quantity *</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  min="1"
                  placeholder="Enter target quantity"
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
              {isPending ? 'Creating...' : 'Create Goal'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
