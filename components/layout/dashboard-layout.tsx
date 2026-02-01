'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        userRole={userRole} 
        userName={userName} 
        onLogout={handleLogout}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <main className={cn(
        'flex-1 transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        {children}
      </main>
    </div>
  )
}
