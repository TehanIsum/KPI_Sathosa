'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './notification-bell'
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  FileCheck,
  Users,
  MapPin,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Award,
  Calendar,
  Bell,
  LogOut,
  FileEdit
} from 'lucide-react'
import type { UserRole } from '@/lib/types/database'

interface SidebarProps {
  userRole: UserRole
  userName: string
  onLogout: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  // Employee items
  {
    title: 'Dashboard',
    href: '/employee/dashboard',
    icon: LayoutDashboard,
    roles: ['employee']
  },
  {
    title: 'My Goals',
    href: '/employee/goals',
    icon: Target,
    roles: ['employee']
  },
  {
    title: 'Track Progress',
    href: '/employee/progress',
    icon: TrendingUp,
    roles: ['employee']
  },
  {
    title: 'Edit Requests',
    href: '/employee/edit-requests',
    icon: FileEdit,
    roles: ['employee']
  },
  {
    title: 'Performance History',
    href: '/employee/history',
    icon: Calendar,
    roles: ['employee']
  },
  // HOD items
  {
    title: 'Dashboard',
    href: '/hod/dashboard',
    icon: LayoutDashboard,
    roles: ['hod']
  },
  {
    title: 'Employee Performance',
    href: '/hod/performance',
    icon: BarChart3,
    roles: ['hod']
  },
  {
    title: 'Review Goals',
    href: '/hod/review',
    icon: FileCheck,
    roles: ['hod']
  },
  {
    title: 'Edit Requests',
    href: '/hod/edit-requests',
    icon: FileEdit,
    roles: ['hod']
  },
  {
    title: 'Location Reports',
    href: '/hod/locations',
    icon: MapPin,
    roles: ['hod']
  },
  // Admin items
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['admin']
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin']
  },
  {
    title: 'System Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['admin']
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['admin']
  },
  // Executive items
  {
    title: 'Dashboard',
    href: '/executive/dashboard',
    icon: LayoutDashboard,
    roles: ['executive']
  },
  {
    title: 'Organization Overview',
    href: '/executive/overview',
    icon: BarChart3,
    roles: ['executive']
  },
  {
    title: 'Performance Analytics',
    href: '/executive/analytics',
    icon: TrendingUp,
    roles: ['executive']
  },
  {
    title: 'Division Comparison',
    href: '/executive/divisions',
    icon: Users,
    roles: ['executive']
  }
]

export function Sidebar({ userRole, userName, onLogout, collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()

  const userNavItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="font-bold">KPI System</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(collapsed && 'mx-auto')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {userNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    collapsed && 'justify-center',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-2 space-y-1">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-start px-2')}>
            <NotificationBell />
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn('w-full justify-start gap-3', collapsed && 'justify-center')}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
