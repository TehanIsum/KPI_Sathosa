'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { notifyHODOfKPISubmission, notifyEmployeeOfPointsAllocation } from './notifications'
import type { KPITargetType } from '@/lib/types/database'

/**
 * Get or create KPI cycle for current month
 */
export async function getCurrentCycle() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Try to get existing cycle
    const { data: cycle, error: fetchError } = await supabase
      .from('kpi_cycles')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (cycle) {
      return { success: true, data: cycle }
    }

    // Create new cycle if doesn't exist
    if (fetchError?.code === 'PGRST116') {
      const { data: newCycle, error: createError } = await supabase
        .from('kpi_cycles')
        .insert({
          user_id: user.id,
          month,
          year,
          status: 'draft',
        })
        .select()
        .single()

      if (createError) {
        return { success: false, error: 'Failed to create KPI cycle' }
      }

      return { success: true, data: newCycle }
    }

    return { success: false, error: 'Failed to fetch KPI cycle' }
  } catch (error) {
    console.error('Get current cycle error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all KPI goals for a cycle
 */
export async function getGoalsForCycle(cycleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data: goals, error } = await supabase
      .from('kpi_goals')
      .select('*')
      .eq('kpi_cycle_id', cycleId)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: 'Failed to fetch goals' }
    }

    return { success: true, data: goals }
  } catch (error) {
    console.error('Get goals error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new KPI goal
 */
export async function createGoal(data: {
  cycleId: string
  description: string
  targetType: KPITargetType
  targetQuantity?: number
  targetDeadline?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Check if cycle is in draft status
    const { data: cycle } = await supabase
      .from('kpi_cycles')
      .select('status')
      .eq('id', data.cycleId)
      .eq('user_id', user.id)
      .single()

    if (!cycle || cycle.status !== 'draft') {
      return { success: false, error: 'Can only add goals to draft cycles' }
    }

    // Check goal count (max 10)
    const { count } = await supabase
      .from('kpi_goals')
      .select('*', { count: 'exact', head: true })
      .eq('kpi_cycle_id', data.cycleId)

    if (count && count >= 10) {
      return { success: false, error: 'Maximum 10 goals allowed per cycle' }
    }

    // Create goal
    const { data: goal, error } = await supabase
      .from('kpi_goals')
      .insert({
        kpi_cycle_id: data.cycleId,
        description: data.description,
        target_type: data.targetType,
        target_quantity: data.targetType === 'quantity' ? data.targetQuantity : null,
        target_deadline: data.targetType === 'deadline' ? data.targetDeadline : null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Failed to create goal' }
    }

    return { success: true, data: goal }
  } catch (error) {
    console.error('Create goal error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a KPI goal (only in draft status)
 */
export async function updateGoal(
  goalId: string,
  data: {
    description?: string
    targetType?: KPITargetType
    targetQuantity?: number
    targetDeadline?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Check if goal is editable
    const { data: goalData } = await supabase
      .from('kpi_goals')
      .select('is_locked, kpi_cycles!inner(status, user_id)')
      .eq('id', goalId)
      .single()

    if (!goalData) {
      return { success: false, error: 'Goal not found' }
    }

    const kpiCycle = goalData.kpi_cycles as unknown as { status: string; user_id: string }

    if (kpiCycle.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (goalData.is_locked || kpiCycle.status !== 'draft') {
      return { success: false, error: 'Cannot edit locked or submitted goals' }
    }

    // Update goal
    const { data: updated, error } = await supabase
      .from('kpi_goals')
      .update({
        ...(data.description && { description: data.description }),
        ...(data.targetType && { target_type: data.targetType }),
        ...(data.targetType === 'quantity' && { target_quantity: data.targetQuantity }),
        ...(data.targetType === 'deadline' && { target_deadline: data.targetDeadline }),
      })
      .eq('id', goalId)
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Failed to update goal' }
    }

    return { success: true, data: updated }
  } catch (error) {
    console.error('Update goal error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a KPI goal (only in draft status)
 */
export async function deleteGoal(goalId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Check if goal is deletable
    const { data: goalData } = await supabase
      .from('kpi_goals')
      .select('is_locked, kpi_cycles!inner(status, user_id)')
      .eq('id', goalId)
      .single()

    if (!goalData) {
      return { success: false, error: 'Goal not found' }
    }

    const kpiCycle = goalData.kpi_cycles as unknown as { status: string; user_id: string }

    if (kpiCycle.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (goalData.is_locked || kpiCycle.status !== 'draft') {
      return { success: false, error: 'Cannot delete locked or submitted goals' }
    }

    const { error } = await supabase
      .from('kpi_goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      return { success: false, error: 'Failed to delete goal' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete goal error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Submit KPI cycle for HOD review
 */
export async function submitCycle(cycleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify cycle ownership and status
    const { data: cycles, error: cycleError } = await supabase
      .from('kpi_cycles')
      .select('status, user_id')
      .eq('id', cycleId)
      .eq('user_id', user.id)

    if (cycleError) {
      console.error('[submitCycle] Cycle query error:', cycleError)
      return { success: false, error: `Database error: ${cycleError.message}` }
    }

    if (!cycles || cycles.length === 0) {
      return { success: false, error: 'Cycle not found or you do not have permission to submit it' }
    }

    const cycle = cycles[0]

    if (cycle.status !== 'draft') {
      return { success: false, error: 'Cycle already submitted' }
    }

    // Check if there are any goals (minimum 1, maximum 10)
    const { count, error: countError } = await supabase
      .from('kpi_goals')
      .select('*', { count: 'exact', head: true })
      .eq('kpi_cycle_id', cycleId)

    if (countError) {
      console.error('[submitCycle] Goals count error:', countError)
      return { success: false, error: 'Failed to verify goals' }
    }

    if (!count || count === 0) {
      return { success: false, error: 'Cannot submit cycle without goals' }
    }

    if (count > 10) {
      return { success: false, error: 'Cannot submit cycle: maximum 10 goals allowed' }
    }

    // Submit cycle (goal locking is handled by database trigger)
    const { error: updateError } = await supabase
      .from('kpi_cycles')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .eq('user_id', user.id) // Extra safety check

    if (updateError) {
      console.error('Update cycle error:', updateError)
      return { success: false, error: `Failed to submit cycle: ${updateError.message}` }
    }

    // Get cycle details for notification
    const { data: cycleDetails } = await supabase
      .from('kpi_cycles')
      .select('month, year')
      .eq('id', cycleId)
      .single()

    if (cycleDetails && user.division_id) {
      // Find HOD of this division
      const { data: hod } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'hod')
        .eq('division_id', user.division_id)
        .single()

      if (hod) {
        await notifyHODOfKPISubmission(
          hod.id,
          user.full_name,
          cycleDetails.month,
          cycleDetails.year,
          cycleId
        )
      }
    }

    return { success: true, message: 'Goals submitted for review' }
  } catch (error) {
    console.error('Submit cycle error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update progress on a goal (actual quantity or deadline completion)
 */
export async function updateProgress(
  goalId: string,
  data: {
    actualQuantity?: number
    deadlineCompleted?: boolean
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify goal ownership and get cycle status
    const { data: goalData, error: goalError } = await supabase
      .from('kpi_goals')
      .select('kpi_cycle_id')
      .eq('id', goalId)
      .single()

    if (goalError) {
      console.error('[updateProgress] Goal query error:', goalError)
      return { success: false, error: `Database error: ${goalError.message}` }
    }

    if (!goalData) {
      return { success: false, error: 'Goal not found' }
    }

    // Get cycle details
    const { data: cycleData, error: cycleError } = await supabase
      .from('kpi_cycles')
      .select('user_id, status')
      .eq('id', goalData.kpi_cycle_id)
      .single()

    if (cycleError) {
      console.error('[updateProgress] Cycle query error:', cycleError)
      return { success: false, error: `Database error: ${cycleError.message}` }
    }

    if (!cycleData) {
      return { success: false, error: 'Cycle not found' }
    }

    if (cycleData.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (cycleData.status !== 'frozen') {
      return { success: false, error: 'Can only update progress on frozen cycles' }
    }

    // Update the goal
    const { error: updateError } = await supabase
      .from('kpi_goals')
      .update({
        ...(data.actualQuantity !== undefined && { actual_quantity: data.actualQuantity }),
        ...(data.deadlineCompleted !== undefined && { deadline_completed: data.deadlineCompleted }),
      })
      .eq('id', goalId)

    if (updateError) {
      console.error('[updateProgress] Update error:', updateError)
      return { success: false, error: `Failed to update progress: ${updateError.message}` }
    }

    return { success: true, message: 'Progress updated' }
  } catch (error) {
    console.error('Update progress error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * HOD: Get submitted cycles from employees in their division
 */
export async function getEmployeeSubmittedCycles() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Get cycles from employees in same division
    const { data: cycles, error } = await supabase
      .from('kpi_cycles')
      .select(`
        *,
        users!inner(id, email, full_name, division_id, location_id)
      `)
      .eq('status', 'submitted')
      .eq('users.division_id', user.division_id)
      .order('submitted_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Failed to fetch cycles' }
    }

    return { success: true, data: cycles }
  } catch (error) {
    console.error('Get employee cycles error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * HOD: Get all goals for a specific cycle with employee details
 */
export async function getGoalsForEmployeeCycle(cycleId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Get cycle with employee info
    const { data: cycle, error: cycleError } = await supabase
      .from('kpi_cycles')
      .select(`
        *,
        users!inner(id, email, full_name, division_id)
      `)
      .eq('id', cycleId)
      .eq('users.division_id', user.division_id)
      .single()

    if (cycleError || !cycle) {
      return { success: false, error: 'Cycle not found or unauthorized' }
    }

    // Get goals for this cycle
    const { data: goals, error: goalsError } = await supabase
      .from('kpi_goals')
      .select('*')
      .eq('kpi_cycle_id', cycleId)
      .order('created_at', { ascending: true })

    if (goalsError) {
      return { success: false, error: 'Failed to fetch goals' }
    }

    return { success: true, data: { cycle, goals } }
  } catch (error) {
    console.error('Get employee cycle goals error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * HOD: Allocate points to goals (must total 100)
 */
export async function allocatePoints(
  cycleId: string,
  allocations: { goalId: string; points: number; remarks?: string }[]
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate total points = 100
    const totalPoints = allocations.reduce((sum, a) => sum + a.points, 0)
    if (totalPoints !== 100) {
      return { success: false, error: `Total points must equal 100 (current: ${totalPoints})` }
    }

    const supabase = await createClient()

    // Verify cycle ownership and status
    const { data: cycle } = await supabase
      .from('kpi_cycles')
      .select('status, users!inner(division_id)')
      .eq('id', cycleId)
      .single()

    if (!cycle) {
      return { success: false, error: 'Cycle not found' }
    }

    // Type assertion for nested join
    const cycleUsers = cycle.users as unknown as { division_id: string }

    if (cycleUsers.division_id !== user.division_id) {
      return { success: false, error: 'Unauthorized access' }
    }

    if (cycle.status !== 'submitted') {
      return { success: false, error: 'Can only allocate points to submitted cycles' }
    }

    // Update each goal with allocated points and remarks
    for (const allocation of allocations) {
      const { error } = await supabase
        .from('kpi_goals')
        .update({
          allocated_points: allocation.points,
          hod_remarks: allocation.remarks || null,
        })
        .eq('id', allocation.goalId)
        .eq('kpi_cycle_id', cycleId)

      if (error) {
        return { success: false, error: 'Failed to allocate points' }
      }
    }

    // Update cycle: set status to frozen and update total_allocated_points
    const { error: cycleError } = await supabase
      .from('kpi_cycles')
      .update({
        status: 'frozen',
        frozen_at: new Date().toISOString(),
        total_allocated_points: 100,
      })
      .eq('id', cycleId)

    if (cycleError) {
      return { success: false, error: 'Failed to freeze cycle' }
    }

    // Get cycle details for notification
    const { data: cycleDetails } = await supabase
      .from('kpi_cycles')
      .select('user_id, month, year')
      .eq('id', cycleId)
      .single()

    if (cycleDetails) {
      await notifyEmployeeOfPointsAllocation(
        cycleDetails.user_id,
        cycleDetails.month,
        cycleDetails.year,
        cycleId
      )
    }

    return { success: true, message: 'Points allocated and cycle frozen' }
  } catch (error) {
    console.error('Allocate points error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get current cycle statistics for employee dashboard
 */
export async function getCycleStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get current cycle
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { data: cycle } = await supabase
      .from('kpi_cycles')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    if (!cycle) {
      return {
        success: true,
        stats: {
          activeGoals: 0,
          allocatedPoints: 0,
          achievedPoints: 0,
          completionRate: 0,
          status: 'no_cycle'
        }
      }
    }

    // Get goals count
    const { count } = await supabase
      .from('kpi_goals')
      .select('*', { count: 'exact', head: true })
      .eq('kpi_cycle_id', cycle.id)

    const completionRate = cycle.total_allocated_points > 0
      ? (cycle.total_achieved_points / cycle.total_allocated_points) * 100
      : 0

    return {
      success: true,
      stats: {
        activeGoals: count || 0,
        allocatedPoints: cycle.total_allocated_points || 0,
        achievedPoints: cycle.total_achieved_points || 0,
        completionRate: Math.round(completionRate),
        status: cycle.status
      }
    }
  } catch (error) {
    console.error('Get cycle statistics error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get HOD division statistics
 */
export async function getHODStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Not authenticated or not an HOD' }
    }

    const supabase = await createClient()

    // Get count of pending reviews (submitted cycles)
    const { count: pendingCount } = await supabase
      .from('kpi_cycles')
      .select('id, users!inner(division_id)', { count: 'exact', head: true })
      .eq('users.division_id', user.division_id)
      .eq('status', 'submitted')

    // Get count of active employees (with frozen cycles this month)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { count: activeCount } = await supabase
      .from('kpi_cycles')
      .select('id, users!inner(division_id)', { count: 'exact', head: true })
      .eq('users.division_id', user.division_id)
      .eq('status', 'frozen')
      .eq('month', currentMonth)
      .eq('year', currentYear)

    // Calculate average performance across division for current month
    const { data: cycles } = await supabase
      .from('kpi_cycles')
      .select('total_allocated_points, total_achieved_points, users!inner(division_id)')
      .eq('users.division_id', user.division_id)
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

    return {
      success: true,
      stats: {
        pendingReviews: pendingCount || 0,
        activeEmployees: activeCount || 0,
        avgPerformance
      }
    }
  } catch (error) {
    console.error('Get HOD statistics error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
