'use server'

import { getCurrentUser } from './auth'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/lib/types/database'

/**
 * Get notifications for current user
 */
export async function getMyNotifications(unreadOnly: boolean = false) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: 'Failed to load notifications' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Get notifications error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: 'Failed to mark notification as read' }
    }

    return { success: true }
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      return { success: false, error: 'Failed to mark all notifications as read' }
    }

    return { success: true }
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: 'Failed to delete notification' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete notification error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', count: 0 }
    }

    const supabase = await createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      return { success: false, error: 'Failed to get notification count', count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Get unread notification count error:', error)
    return { success: false, error: 'An unexpected error occurred', count: 0 }
  }
}

/**
 * Create a notification (internal function)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null
      })

    if (error) {
      console.error('Failed to create notification:', error)
      return { success: false, error: 'Failed to create notification' }
    }

    return { success: true }
  } catch (error) {
    console.error('Create notification error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Notify HOD about edit request
 */
export async function notifyHODOfEditRequest(
  hodId: string,
  employeeName: string,
  goalDescription: string,
  editRequestId: string
) {
  return createNotification(
    hodId,
    'edit_request',
    'New Edit Request',
    `${employeeName} has requested to edit: ${goalDescription}`,
    'edit_request',
    editRequestId
  )
}

/**
 * Notify employee about edit request approval
 */
export async function notifyEmployeeOfEditApproval(
  employeeId: string,
  goalDescription: string,
  editRequestId: string
) {
  return createNotification(
    employeeId,
    'edit_approved',
    'Edit Request Approved',
    `Your edit request for "${goalDescription}" has been approved`,
    'edit_request',
    editRequestId
  )
}

/**
 * Notify employee about edit request rejection
 */
export async function notifyEmployeeOfEditRejection(
  employeeId: string,
  goalDescription: string,
  editRequestId: string,
  remarks?: string
) {
  const message = remarks
    ? `Your edit request for "${goalDescription}" was rejected. Reason: ${remarks}`
    : `Your edit request for "${goalDescription}" was rejected`

  return createNotification(
    employeeId,
    'edit_rejected',
    'Edit Request Rejected',
    message,
    'edit_request',
    editRequestId
  )
}

/**
 * Notify HOD about KPI submission
 */
export async function notifyHODOfKPISubmission(
  hodId: string,
  employeeName: string,
  month: number,
  year: number,
  cycleId: string
) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  
  return createNotification(
    hodId,
    'kpi_submitted',
    'KPI Cycle Submitted',
    `${employeeName} has submitted KPI goals for ${monthName} ${year}`,
    'kpi_cycle',
    cycleId
  )
}

/**
 * Notify employee about points allocation
 */
export async function notifyEmployeeOfPointsAllocation(
  employeeId: string,
  month: number,
  year: number,
  cycleId: string
) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  
  return createNotification(
    employeeId,
    'points_allocated',
    'Points Allocated',
    `Your HOD has allocated points for your ${monthName} ${year} KPI goals`,
    'kpi_cycle',
    cycleId
  )
}
