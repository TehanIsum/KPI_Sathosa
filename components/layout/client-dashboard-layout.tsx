'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { logout } from '@/lib/actions/auth'
import { getCurrentUser } from '@/lib/actions/auth'
import type { SessionUser } from '@/lib/types/database'

interface ClientDashboardLayoutProps {
  children: React.ReactNode
}

export function ClientDashboardLayout({ children }: ClientDashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} userName={user.full_name} onLogout={handleLogout} />
      <main className="flex-1 transition-all duration-300 ml-64">
        {children}
      </main>
    </div>
  )
}
