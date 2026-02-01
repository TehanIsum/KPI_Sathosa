'use client'

import { useState, useEffect } from 'react'
import { updatePassword, getCurrentUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types/database'

interface PasswordResetRequiredProps {
  email: string
}

export default function PasswordResetRequired({ email }: PasswordResetRequiredProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    // Get user role for redirect
    getCurrentUser().then(user => {
      if (user) {
        setUserRole(user.role)
      }
    })
  }, [])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)'
    }
    if (password === 'Password123!') {
      return 'Please choose a different password than the default'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const validationError = validatePassword(newPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      const result = await updatePassword(newPassword)

      if (result.success) {
        // Redirect to appropriate dashboard based on role
        const dashboards = {
          admin: '/admin/dashboard',
          employee: '/employee/dashboard',
          hod: '/hod/dashboard',
          executive: '/executive/dashboard',
        }
        const redirectUrl = userRole ? dashboards[userRole] : '/employee/dashboard'
        router.push(redirectUrl)
        router.refresh()
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-yellow-600" />
            <CardTitle className="text-2xl font-bold">Password Change Required</CardTitle>
          </div>
          <CardDescription>
            Welcome, {email}! For security reasons, you must change your default password before continuing.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !newPassword || !confirmPassword}
            >
              {submitting ? 'Updating Password...' : 'Change Password & Continue'}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>At least 8 characters long</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
