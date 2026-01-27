'use server'

import { getCurrentUser } from './auth'
import { createClient } from '@/lib/supabase/server'
import { notifyHODOfEditRequest, notifyEmployeeOfEditApproval, notifyEmployeeOfEditRejection } from './notifications'

/**
 * Create an edit request for a locked goal
 */
export async function createEditRequest(
  goalId: string,
  requestReason: string,
  requestedChanges: {
    description?: string
    targetType?: string
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

    // Verify goal exists and belongs to user
    const { data: goalData } = await supabase
      .from('kpi_goals')
      .select('kpi_cycles!inner(user_id, status)')
      .eq('id', goalId)
      .single()

    if (!goalData) {
      return { success: false, error: 'Goal not found' }
    }

    const kpiCycle = goalData.kpi_cycles as unknown as { user_id: string; status: string }

    if (kpiCycle.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (kpiCycle.status === 'draft') {
      return { success: false, error: 'Goal is not locked, you can edit it directly' }
    }

    // Create edit request
    const { data: editRequest, error } = await supabase
      .from('kpi_edit_requests')
      .insert({
        kpi_goal_id: goalId,
        requested_by: user.id,
        request_reason: requestReason,
        requested_changes: requestedChanges,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error || !editRequest) {
      return { success: false, error: 'Failed to create edit request' }
    }

    // Get goal details and HOD for notification
    const { data: goalDetails } = await supabase
      .from('kpi_goals')
      .select(`
        description,
        kpi_cycles!inner(
          users!inner(division_id)
        )
      `)
      .eq('id', goalId)
      .single()

    if (goalDetails) {
      const cycle = goalDetails.kpi_cycles as any
      const employee = cycle.users as any
      const divisionId = employee.division_id

      // Find HOD of this division
      const { data: hod } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'hod')
        .eq('division_id', divisionId)
        .single()

      if (hod) {
        await notifyHODOfEditRequest(
          hod.id,
          user.full_name,
          goalDetails.description,
          editRequest.id
        )
      }
    }

    return { success: true, message: 'Edit request submitted' }
  } catch (error) {
    console.error('Create edit request error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get pending edit requests for employee
 */
export async function getMyEditRequests() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kpi_edit_requests')
      .select(`
        *,
        kpi_goals!inner(
          description,
          target_type,
          target_quantity,
          target_deadline,
          kpi_cycles!inner(month, year)
        ),
        reviewed_by_user:users!kpi_edit_requests_reviewed_by_fkey(full_name)
      `)
      .eq('requested_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Failed to load edit requests' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Get edit requests error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * HOD: Get pending edit requests from division employees
 */
export async function getPendingEditRequests() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Not authenticated or not an HOD' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kpi_edit_requests')
      .select(`
        *,
        kpi_goals!inner(
          description,
          target_type,
          target_quantity,
          target_deadline,
          kpi_cycles!inner(
            month,
            year,
            users!inner(id, full_name, email, division_id)
          )
        ),
        requested_by_user:users!kpi_edit_requests_requested_by_fkey(full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (!data || error) {
      return { success: false, error: 'Failed to load edit requests' }
    }

    // Filter for division employees
    const divisionRequests = data.filter((request: any) => {
      const cycle = request.kpi_goals?.kpi_cycles
      const employee = cycle?.users
      return employee?.division_id === user.division_id
    })

    return { success: true, data: divisionRequests }
  } catch (error) {
    console.error('Get pending edit requests error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * HOD: Approve or reject edit request
 */
export async function reviewEditRequest(
  requestId: string,
  action: 'approve' | 'reject',
  remarks?: string
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'hod') {
      return { success: false, error: 'Not authenticated or not an HOD' }
    }

    const supabase = await createClient()

    // Verify access
    const { data: request } = await supabase
      .from('kpi_edit_requests')
      .select(`
        *,
        kpi_goals!inner(
          kpi_cycles!inner(
            users!inner(division_id)
          )
        )
      `)
      .eq('id', requestId)
      .single()

    if (!request) {
      return { success: false, error: 'Edit request not found' }
    }

    const cycle = (request.kpi_goals as any).kpi_cycles
    const employee = (cycle as any).users

    if (employee.division_id !== user.division_id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request already reviewed' }
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('kpi_edit_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        review_remarks: remarks || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      return { success: false, error: 'Failed to update request' }
    }

    // If approved, apply the changes to the goal
    if (action === 'approve' && request.requested_changes) {
      const changes = request.requested_changes as any
      const updateData: any = {}

      if (changes.description) updateData.description = changes.description
      if (changes.targetType) updateData.target_type = changes.targetType
      if (changes.targetQuantity !== undefined) updateData.target_quantity = changes.targetQuantity
      if (changes.targetDeadline) updateData.target_deadline = changes.targetDeadline

      if (Object.keys(updateData).length > 0) {
        const { error: goalError } = await supabase
          .from('kpi_goals')
          .update(updateData)
          .eq('id', request.kpi_goal_id)

        if (goalError) {
          return { success: false, error: 'Failed to apply changes to goal' }
        }
      }
    }

    // Notify employee about review
    const { data: goalData } = await supabase
      .from('kpi_goals')
      .select('description')
      .eq('id', request.kpi_goal_id)
      .single()

    if (goalData) {
      if (action === 'approve') {
        await notifyEmployeeOfEditApproval(
          request.requested_by,
          goalData.description,
          requestId
        )
      } else {
        await notifyEmployeeOfEditRejection(
          request.requested_by,
          goalData.description,
          requestId,
          remarks
        )
      }
    }

    return { 
      success: true, 
      message: action === 'approve' ? 'Edit request approved and changes applied' : 'Edit request rejected'
    }
  } catch (error) {
    console.error('Review edit request error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel pending edit request (employee only)
 */
export async function cancelEditRequest(requestId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify ownership
    const { data: request } = await supabase
      .from('kpi_edit_requests')
      .select('requested_by, status')
      .eq('id', requestId)
      .single()

    if (!request) {
      return { success: false, error: 'Edit request not found' }
    }

    if (request.requested_by !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Cannot cancel reviewed request' }
    }

    const { error } = await supabase
      .from('kpi_edit_requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      return { success: false, error: 'Failed to cancel request' }
    }

    return { success: true, message: 'Edit request cancelled' }
  } catch (error) {
    console.error('Cancel edit request error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
