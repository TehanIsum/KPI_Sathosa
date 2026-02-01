import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import PasswordResetRequired from '@/components/auth/password-reset-required'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export async function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Check if password reset is required
  if (user.is_password_reset_required) {
    return <PasswordResetRequired email={user.email} />
  }

  return <>{children}</>
}
