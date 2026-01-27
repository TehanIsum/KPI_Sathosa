import { getCurrentUser } from '@/lib/actions/auth'
import { getHODStatistics } from '@/lib/actions/kpi'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Users, Target, FileCheck, TrendingUp, MapPin, Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HODDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'hod') {
    redirect('/login')
  }

  const statsResult = await getHODStatistics()
  const stats = statsResult.success ? statsResult.stats : null

  return (
    <DashboardLayout userRole={user.role} userName={user.full_name}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">HOD Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.full_name}
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Division Management</h2>
          <p className="text-muted-foreground">
            Review and manage employee KPI goals
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting point allocation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Employees
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                With frozen goals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Performance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgPerformance || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Division average
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Review & Allocate Points
              </CardTitle>
              <CardDescription>
                Review submitted goals and allocate weighted points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/hod/review">
                <Button className="w-full">Review Submissions</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee Performance
              </CardTitle>
              <CardDescription>View performance by employee</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Performance
              </CardTitle>
              <CardDescription>View performance by location</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Edit Requests
              </CardTitle>
              <CardDescription>Approve or reject KPI change requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Division Reports
              </CardTitle>
              <CardDescription>Generate performance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>View alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        </div>

        {user.can_act_as_hod && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> You can also access employee features by
              logging in as an Employee.
            </p>
          </div>
        )}
      </main>
      </div>
    </DashboardLayout>
  )
}
