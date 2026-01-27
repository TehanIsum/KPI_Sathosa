'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEditRequest } from '@/lib/actions/edit-requests'
import { AlertCircle } from 'lucide-react'
import type { KPIGoal } from '@/lib/types/database'

interface RequestEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: KPIGoal
  onSuccess: () => void
}

export function RequestEditDialog({ open, onOpenChange, goal, onSuccess }: RequestEditDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [description, setDescription] = useState(goal.description)
  const [targetType, setTargetType] = useState(goal.target_type)
  const [targetQuantity, setTargetQuantity] = useState(goal.target_quantity?.toString() || '')
  const [targetDeadline, setTargetDeadline] = useState(goal.target_deadline || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!requestReason.trim()) {
      setError('Please provide a reason for this edit request')
      return
    }

    // Build changes object (only include changed fields)
    const changes: any = {}
    if (description !== goal.description) changes.description = description
    if (targetType !== goal.target_type) changes.targetType = targetType
    if (targetType === 'quantity' && targetQuantity !== goal.target_quantity?.toString()) {
      changes.targetQuantity = Number(targetQuantity)
    }
    if (targetType === 'deadline' && targetDeadline !== goal.target_deadline) {
      changes.targetDeadline = targetDeadline
    }

    if (Object.keys(changes).length === 0) {
      setError('No changes detected')
      return
    }

    startTransition(async () => {
      const result = await createEditRequest(goal.id, requestReason, changes)

      if (result.success) {
        onOpenChange(false)
        onSuccess()
        // Reset form
        setRequestReason('')
        setDescription(goal.description)
        setTargetType(goal.target_type)
        setTargetQuantity(goal.target_quantity?.toString() || '')
        setTargetDeadline(goal.target_deadline || '')
      } else {
        setError(result.error || 'Failed to submit request')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Request Goal Edit</AlertDialogTitle>
          <AlertDialogDescription>
            This goal is locked. Submit an edit request for HOD approval.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Goal Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Current Goal:</p>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
            <p className="text-sm text-muted-foreground">
              {goal.target_type === 'quantity' ? (
                <>Target Quantity: {goal.target_quantity}</>
              ) : (
                <>Target Deadline: {new Date(goal.target_deadline!).toLocaleDateString()}</>
              )}
            </p>
          </div>

          {/* Reason for Edit */}
          <div className="space-y-2">
            <Label htmlFor="requestReason" className="required">
              Reason for Edit Request *
            </Label>
            <Textarea
              id="requestReason"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Explain why you need to modify this goal..."
              rows={3}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear justification for HOD review
            </p>
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Goal Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
              required
            />
          </div>

          {/* Target Type */}
          <div className="space-y-2">
            <Label htmlFor="targetType">Target Type</Label>
            <Select
              value={targetType}
              onValueChange={(value: 'quantity' | 'deadline') => setTargetType(value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantity Target</SelectItem>
                <SelectItem value="deadline">Deadline Target</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields */}
          {targetType === 'quantity' ? (
            <div className="space-y-2">
              <Label htmlFor="targetQuantity">Target Quantity</Label>
              <Input
                id="targetQuantity"
                type="number"
                step="0.01"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="targetDeadline">Target Deadline</Label>
              <Input
                id="targetDeadline"
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
