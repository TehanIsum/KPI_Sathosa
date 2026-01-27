'use server'

import { getCurrentUser } from './auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Get organization-wide statistics for executives
 */
export async function getOrganizationStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'executive') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Total active employees
    const { count: totalEmployees } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee')
      .eq('is_active', true)

    // Total frozen cycles this month
    const { count: activeCycles } = await supabase
      .from('kpi_cycles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'frozen')
      .eq('month', currentMonth)
      .eq('year', currentYear)

    // Average performance across organization
    const { data: cycles } = await supabase
      .from('kpi_cycles')
      .select('total_allocated_points, total_achieved_points')
      .eq('status', 'frozen')
      .eq('month', currentMonth)
      .eq('year', currentYear)

    let avgPerformance = 0
    if (cycles && cycles.length > 0) {
      const totalPerformance = cycles.reduce((sum, cycle) => {
        if (cycle.total_allocated_points > 0) {
          return sum + (cycle.total_achieved_points / cycle.total_allocated_points) * 100
        }
        return sum
      }, 0)
      avgPerformance = Math.round(totalPerformance / cycles.length)
    }

    // Total goals tracked
    const { count: totalGoals } = await supabase
      .from('kpi_goals')
      .select('id, kpi_cycles!inner(month, year, status)', { count: 'exact', head: true })
      .eq('kpi_cycles.month', currentMonth)
      .eq('kpi_cycles.year', currentYear)
      .eq('kpi_cycles.status', 'frozen')

    return {
      success: true,
      stats: {
        totalEmployees: totalEmployees || 0,
        activeCycles: activeCycles || 0,
        avgPerformance,
        totalGoals: totalGoals || 0
      }
    }
  } catch (error) {
    console.error('Get organization statistics error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get division performance comparison for executives
 */
export async function getDivisionPerformance() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'executive') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: divisions } = await supabase
      .from('divisions')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name')

    if (!divisions) {
      return { success: false, error: 'Failed to load divisions' }
    }

    const divisionStats = await Promise.all(
      divisions.map(async (division) => {
        // Get employee count
        const { count: employeeCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('division_id', division.id)
          .eq('role', 'employee')
          .eq('is_active', true)

        // Get cycles for this division
        const { data: cycles } = await supabase
          .from('kpi_cycles')
          .select('total_allocated_points, total_achieved_points, users!inner(division_id)')
          .eq('users.division_id', division.id)
          .eq('status', 'frozen')
          .eq('month', currentMonth)
          .eq('year', currentYear)

        let avgPerformance = 0
        let activeCycles = 0
        if (cycles && cycles.length > 0) {
          activeCycles = cycles.length
          const totalPerformance = cycles.reduce((sum, cycle) => {
            if (cycle.total_allocated_points > 0) {
              return sum + (cycle.total_achieved_points / cycle.total_allocated_points) * 100
            }
            return sum
          }, 0)
          avgPerformance = Math.round(totalPerformance / cycles.length)
        }

        return {
          ...division,
          employeeCount: employeeCount || 0,
          activeCycles,
          avgPerformance
        }
      })
    )

    return { success: true, data: divisionStats }
  } catch (error) {
    console.error('Get division performance error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get performance trends over time for executives
 */
export async function getPerformanceTrends(months: number = 6) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'executive') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const currentDate = new Date()
    
    const trends = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const { data: cycles } = await supabase
        .from('kpi_cycles')
        .select('total_allocated_points, total_achieved_points')
        .eq('status', 'frozen')
        .eq('month', month)
        .eq('year', year)

      let avgPerformance = 0
      let cycleCount = 0
      if (cycles && cycles.length > 0) {
        cycleCount = cycles.length
        const totalPerformance = cycles.reduce((sum, cycle) => {
          if (cycle.total_allocated_points > 0) {
            return sum + (cycle.total_achieved_points / cycle.total_allocated_points) * 100
          }
          return sum
        }, 0)
        avgPerformance = Math.round(totalPerformance / cycles.length)
      }

      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthNumber: month,
        year,
        avgPerformance,
        cycleCount
      })
    }

    return { success: true, data: trends }
  } catch (error) {
    console.error('Get performance trends error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all users for admin management
 */
export async function getAllUsers() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: users } = await supabase
      .from('users')
      .select(`
        *,
        divisions(id, name, code),
        locations(id, name, code)
      `)
      .order('created_at', { ascending: false })

    if (!users) {
      return { success: false, error: 'Failed to load users' }
    }

    return { success: true, data: users }
  } catch (error) {
    console.error('Get all users error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get system-wide statistics for admin dashboard
 */
export async function getSystemStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Total users by role
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalDivisions } = await supabase
      .from('divisions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // This month's activity
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { count: activeCycles } = await supabase
      .from('kpi_cycles')
      .select('*', { count: 'exact', head: true })
      .eq('month', currentMonth)
      .eq('year', currentYear)

    const { count: pendingEditRequests } = await supabase
      .from('kpi_edit_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalDivisions: totalDivisions || 0,
        totalLocations: totalLocations || 0,
        activeCycles: activeCycles || 0,
        pendingEditRequests: pendingEditRequests || 0
      }
    }
  } catch (error) {
    console.error('Get system statistics error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get top performers for executive view
 */
export async function getTopPerformers(limit: number = 10) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'executive') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: cycles } = await supabase
      .from('kpi_cycles')
      .select(`
        total_allocated_points,
        total_achieved_points,
        users!inner(id, full_name, email, divisions(name), locations(name))
      `)
      .eq('status', 'frozen')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .gt('total_allocated_points', 0)

    if (!cycles) {
      return { success: false, error: 'Failed to load performance data' }
    }

    const performers = cycles
      .map((cycle: any) => {
        const performance = (cycle.total_achieved_points / cycle.total_allocated_points) * 100
        return {
          userId: cycle.users.id,
          name: cycle.users.full_name,
          email: cycle.users.email,
          division: cycle.users.divisions?.name || 'N/A',
          location: cycle.users.locations?.name || 'N/A',
          performance: Math.round(performance),
          achievedPoints: cycle.total_achieved_points,
          allocatedPoints: cycle.total_allocated_points
        }
      })
      .sort((a, b) => b.performance - a.performance)
      .slice(0, limit)

    return { success: true, data: performers }
  } catch (error) {
    console.error('Get top performers error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get deadline alerts for executives
 */
export async function getDeadlineAlerts() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'executive') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: goals } = await supabase
      .from('kpi_goals')
      .select(`
        id,
        description,
        target_deadline,
        deadline_completed,
        kpi_cycles!inner(
          month,
          year,
          status,
          users!inner(id, full_name, email, divisions(name))
        )
      `)
      .eq('target_type', 'deadline')
      .eq('kpi_cycles.status', 'frozen')
      .lt('target_deadline', today)
      .or('deadline_completed.is.null,deadline_completed.eq.false')

    if (!goals) {
      return { success: false, error: 'Failed to load deadline alerts' }
    }

    const alerts = goals.map((goal: any) => {
      const cycle = goal.kpi_cycles
      const user = cycle.users
      const daysMissed = Math.floor(
        (new Date().getTime() - new Date(goal.target_deadline).getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        goalId: goal.id,
        description: goal.description,
        deadline: goal.target_deadline,
        daysMissed,
        isCritical: daysMissed >= 3,
        employeeName: user.full_name,
        employeeEmail: user.email,
        division: user.divisions?.name || 'N/A',
        month: new Date(cycle.year, cycle.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    })

    return { success: true, data: alerts.sort((a, b) => b.daysMissed - a.daysMissed) }
  } catch (error) {
    console.error('Get deadline alerts error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
