import { getCurrentUser } from '@/lib/actions/auth'
import { getOrganizationStatistics } from '@/lib/actions/reporting'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Users, Target, TrendingUp, BarChart3, AlertTriangle, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ExecutiveDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'executive') {
    redirect('/login')
  }

  const statsResult = await getOrganizationStatistics()
  const stats = statsResult.success ? statsResult.stats : null

  return (
    <DashboardLayout userRole={user.role} userName={user.full_name}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Executive Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Organization-wide performance overview
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* KPI Overview Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Company-wide
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Cycles
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Avg Performance
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgPerformance || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Organization average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Goals
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalGoals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Tracked this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Division Performance
                </CardTitle>
                <CardDescription>Compare performance across divisions</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/divisions">
                  <Button className="w-full">View Divisions</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Historical performance analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/analytics">
                  <Button className="w-full">View Analytics</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest performing employees</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/top-performers">
                  <Button className="w-full">View Performers</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
                <CardDescription>Overdue and missed deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/alerts">
                  <Button className="w-full" variant="destructive">View Alerts</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Overview
                </CardTitle>
                <CardDescription>Detailed employee performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/employees">
                  <Button className="w-full">View Employees</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Reports
                </CardTitle>
                <CardDescription>Generate comprehensive reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/executive/reports">
                  <Button className="w-full">Generate Reports</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
