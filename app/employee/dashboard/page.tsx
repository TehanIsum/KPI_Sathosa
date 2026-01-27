import { getCurrentUser } from '@/lib/actions/auth'
import { getCycleStatistics } from '@/lib/actions/kpi'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Target, TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'employee') {
    redirect('/login')
  }

  const statsResult = await getCycleStatistics()
  const stats = statsResult.success ? statsResult.stats : null

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardLayout userRole={user.role} userName={user.full_name}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Employee Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.full_name}
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            KPI Dashboard - {currentMonth}
          </h2>
          <p className="text-muted-foreground">
            Manage your monthly goals and track your performance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Goals
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeGoals || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Points Allocated
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.allocatedPoints || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total weight
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Points Achieved
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.achievedPoints?.toFixed(1) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Current score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Average progress
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Manage Goals
              </CardTitle>
              <CardDescription>
                Create, edit, and submit your KPI goals for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/employee/goals">
                <Button className="w-full">
                  View Goals
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Track Progress
              </CardTitle>
              <CardDescription>
                Update your achievements and monitor your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/employee/progress">
                <Button className="w-full">
                  Update Progress
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Performance History
              </CardTitle>
              <CardDescription>
                View your past performance and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </DashboardLayout>
  )
}
