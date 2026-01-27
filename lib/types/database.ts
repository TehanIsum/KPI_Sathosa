/**
 * Database Types
 * Auto-generated types matching the database schema
 */

export type UserRole = 'admin' | 'employee' | 'hod' | 'executive'

export type KPICycleStatus = 'draft' | 'submitted' | 'frozen'

export type KPITargetType = 'quantity' | 'deadline'

export type EditRequestStatus = 'pending' | 'approved' | 'rejected'

export type NotificationType =
  | 'deadline_missed'
  | 'deadline_overdue'
  | 'edit_request'
  | 'edit_approved'
  | 'edit_rejected'
  | 'kpi_submitted'
  | 'points_allocated'

export interface Division {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  division_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  can_act_as_hod: boolean
  division_id: string | null
  location_id: string | null
  is_active: boolean
  is_password_reset_required: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

// Password reset is now handled by Supabase Auth
// No need for custom password reset tokens table

export interface KPICycle {
  id: string
  user_id: string
  month: number
  year: number
  status: KPICycleStatus
  submitted_at: string | null
  frozen_at: string | null
  total_allocated_points: number
  total_achieved_points: number
  created_at: string
  updated_at: string
}

export interface KPIGoal {
  id: string
  kpi_cycle_id: string
  description: string
  target_type: KPITargetType
  target_quantity: number | null
  target_deadline: string | null
  allocated_points: number | null
  actual_quantity: number | null
  deadline_completed: boolean | null
  achieved_points: number
  hod_remarks: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface KPIEditRequest {
  id: string
  kpi_goal_id: string
  requested_by: string
  request_reason: string
  requested_changes: Record<string, any>
  status: EditRequestStatus
  reviewed_by: string | null
  review_remarks: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_entity_type: string | null
  related_entity_id: string | null
  is_read: boolean
  is_email_sent: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

/**
 * Extended types with relations
 */
export interface UserWithRelations extends User {
  division?: Division
  location?: Location
}

export interface KPICycleWithGoals extends KPICycle {
  goals: KPIGoal[]
}

export interface KPIGoalWithCycle extends KPIGoal {
  cycle: KPICycle
}

export interface NotificationWithRelations extends Notification {
  user: User
}

/**
 * Form input types (without auto-generated fields)
 */
export interface CreateUserInput {
  email: string
  password: string
  full_name: string
  role: UserRole
  can_act_as_hod?: boolean
  division_id?: string | null
  location_id?: string | null
}

export interface CreateKPIGoalInput {
  kpi_cycle_id: string
  description: string
  target_type: KPITargetType
  target_quantity?: number | null
  target_deadline?: string | null
}

export interface UpdateKPIGoalInput {
  description?: string
  actual_quantity?: number | null
  deadline_completed?: boolean | null
}

export interface CreateEditRequestInput {
  kpi_goal_id: string
  request_reason: string
  requested_changes: Record<string, any>
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Session user type (public safe)
 */
export interface SessionUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  can_act_as_hod: boolean
  division_id: string | null
  location_id: string | null
  is_password_reset_required: boolean
}
