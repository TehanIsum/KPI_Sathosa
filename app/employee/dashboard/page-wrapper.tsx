import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import PasswordResetRequired from '@/components/auth/password-reset-required'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'employee') {
    redirect('/login')
  }

  // Check if password reset is required
  if (user.is_password_reset_required) {
    return <PasswordResetRequired email={user.email} />
  }

  // Import the actual dashboard component
  const { EmployeeDashboardContent } = await import('./dashboard-content')
  return <EmployeeDashboardContent user={user} />
}
