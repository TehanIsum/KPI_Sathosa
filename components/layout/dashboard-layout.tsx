'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { logout } from '@/lib/actions/auth'
import type { UserRole } from '@/lib/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} userName={userName} onLogout={handleLogout} />
      <main className="flex-1 transition-all duration-300 ml-64">
        {children}
      </main>
    </div>
  )
}
