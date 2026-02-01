import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import PasswordResetRequired from '@/components/auth/password-reset-required'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // If password reset is not required, redirect to dashboard
  if (!user.is_password_reset_required) {
    const dashboards = {
      admin: '/admin/dashboard',
      employee: '/employee/dashboard',
      hod: '/hod/dashboard',
      executive: '/executive/dashboard',
    }
    redirect(dashboards[user.role])
  }

  return <PasswordResetRequired email={user.email} />
}
