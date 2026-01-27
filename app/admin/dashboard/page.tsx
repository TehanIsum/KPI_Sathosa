import { getCurrentUser } from '@/lib/actions/auth'
import { getSystemStatistics } from '@/lib/actions/reporting'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Users, Building2, MapPin, Target, FileEdit, Settings, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  const statsResult = await getSystemStatistics()
  const stats = statsResult.success ? statsResult.stats : null

  return (
    <DashboardLayout userRole={user.role} userName={user.full_name}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              System administration and management
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* System Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeUsers || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Divisions</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDivisions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active divisions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLocations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeCycles || 0}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <FileEdit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingEditRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Edit requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage system users and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button className="w-full">Manage Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Divisions & Locations
                </CardTitle>
                <CardDescription>Manage organizational structure</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/structure">
                  <Button className="w-full">Manage Structure</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Reports
                </CardTitle>
                <CardDescription>Generate system reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/reports">
                  <Button className="w-full">View Reports</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>View system audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/audit">
                  <Button className="w-full">View Logs</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Configure system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/settings">
                  <Button className="w-full">Settings</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>Monitor system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/health">
                  <Button className="w-full">View Status</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
