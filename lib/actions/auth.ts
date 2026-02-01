'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { UserRole, SessionUser } from '@/lib/types/database'

/**
 * Login with Supabase Auth
 * Validates user credentials and role selection
 */
export async function login(
  email: string,
  password: string,
  role: UserRole
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (authError || !authData.user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !userProfile) {
      await supabase.auth.signOut()
      return { success: false, error: 'User profile not found. Please contact administrator.' }
    }

    // Check if account is active
    if (!userProfile.is_active) {
      await supabase.auth.signOut()
      return { success: false, error: 'Account is deactivated. Contact administrator.' }
    }

    // Validate role selection
    // HODs with can_act_as_hod=true can login as either 'hod' or 'employee'
    if (userProfile.role === 'hod' && userProfile.can_act_as_hod) {
      if (role !== 'hod' && role !== 'employee') {
        await supabase.auth.signOut()
        return { success: false, error: 'Invalid role selection' }
      }
    } else {
      // All other users must use their assigned role
      if (userProfile.role !== role) {
        await supabase.auth.signOut()
        return { success: false, error: 'Invalid role selection' }
      }
    }

    // Store selected role in cookie (for HODs who can switch)
    const cookieStore = await cookies()
    cookieStore.set('kpi_selected_role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userProfile.id)

    // Redirect based on password reset requirement
    if (userProfile.is_password_reset_required) {
      return { success: true, redirectTo: '/auth/reset-password' }
    }

    // Redirect to role-specific dashboard
    const dashboards: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      employee: '/employee/dashboard',
      hod: '/hod/dashboard',
      executive: '/executive/dashboard',
    }

    return { success: true, redirectTo: dashboards[role] }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Logout - clear Supabase session and cookies
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('kpi_selected_role')

    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}

/**
 * Get current authenticated user with profile data
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient()

    // Get Supabase auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // Get profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    // Get selected role from cookie (for HODs)
    const cookieStore = await cookies()
    const selectedRoleCookie = cookieStore.get('kpi_selected_role')
    const activeRole = (selectedRoleCookie?.value as UserRole) || profile.role

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: activeRole,
      can_act_as_hod: profile.can_act_as_hod,
      division_id: profile.division_id,
      location_id: profile.location_id,
      is_password_reset_required: profile.is_password_reset_required,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Request password reset email via Supabase Auth
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      }
    )

    if (error) {
      console.error('Password reset error:', error)
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    }
  } catch (error) {
    console.error('Request password reset error:', error)
    return {
      success: false,
      error: 'Unable to process request. Please try again.',
    }
  }
}

/**
 * Update password (from reset link)
 */
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Update password with Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Update password error:', error)
      return { success: false, error: 'Failed to update password' }
    }

    // Mark password reset as complete in user profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ is_password_reset_required: false })
        .eq('id', user.id)
    }

    return { success: true, message: 'Password updated successfully' }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'An error occurred. Please try again.' }
  }
}

/**
 * Change password for logged-in user
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('Change password error:', updateError)
      return { success: false, error: 'Failed to change password' }
    }

    // Mark password reset as complete
    await supabase
      .from('users')
      .update({ is_password_reset_required: false })
      .eq('id', user.id)

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'An error occurred. Please try again.' }
  }
}

/**
 * Admin: Create new user
 * Creates user in both auth.users and public.users via trigger
 */
export async function createUser(userData: {
  email: string
  fullName: string
  role: UserRole
  canActAsHod?: boolean
  divisionId?: string
  locationId?: string
}): Promise<{ success: boolean; message?: string; error?: string; userId?: string }> {
  try {
    // Verify admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    // Validate required fields based on role
    if ((userData.role === 'employee' || userData.role === 'hod') && (!userData.divisionId || !userData.locationId)) {
      return { success: false, error: 'Division and location are required for employees and HODs' }
    }

    // Use admin client with service role key
    const adminClient = createAdminClient()

    // Create user in Supabase Auth with default password
    const defaultPassword = 'Password123!'
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: userData.email.toLowerCase().trim(),
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role,
        can_act_as_hod: userData.canActAsHod || false,
        division_id: userData.divisionId || null,
        location_id: userData.locationId || null,
        is_active: true,
        is_password_reset_required: true, // Force password change on first login
      },
    })

    if (authError) {
      console.error('Create user error:', authError)
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Email already registered' }
      }
      return { success: false, error: authError.message || 'Failed to create user' }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // The trigger will automatically create the public.users record
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify the user was created in public.users (use regular client for query)
    const supabase = await createClient()
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', authData.user.id)
      .single()

    if (publicError || !publicUser) {
      console.error('Public user verification error:', publicError)
      // Try to clean up auth user if public user creation failed
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: 'Failed to create user profile. Please try again.' }
    }

    return {
      success: true,
      message: `User created successfully. Default password: ${defaultPassword}`,
      userId: authData.user.id,
    }
  } catch (error) {
    console.error('Create user error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Admin: Update user details
 */
export async function updateUser(
  userId: string,
  updates: {
    fullName?: string
    role?: UserRole
    canActAsHod?: boolean
    divisionId?: string | null
    locationId?: string | null
    isActive?: boolean
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Verify admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    // Update public.users
    const publicUpdates: any = {}
    if (updates.fullName !== undefined) publicUpdates.full_name = updates.fullName
    if (updates.role !== undefined) publicUpdates.role = updates.role
    if (updates.canActAsHod !== undefined) publicUpdates.can_act_as_hod = updates.canActAsHod
    if (updates.divisionId !== undefined) publicUpdates.division_id = updates.divisionId
    if (updates.locationId !== undefined) publicUpdates.location_id = updates.locationId
    if (updates.isActive !== undefined) publicUpdates.is_active = updates.isActive

    const { error: publicError } = await supabase
      .from('users')
      .update(publicUpdates)
      .eq('id', userId)

    if (publicError) {
      console.error('Update user error:', publicError)
      return { success: false, error: 'Failed to update user' }
    }

    // Update auth.users metadata using admin client
    const metadataUpdates: any = {}
    if (updates.fullName) metadataUpdates.full_name = updates.fullName
    if (updates.role) metadataUpdates.role = updates.role
    if (updates.canActAsHod !== undefined) metadataUpdates.can_act_as_hod = updates.canActAsHod
    if (updates.divisionId !== undefined) metadataUpdates.division_id = updates.divisionId
    if (updates.locationId !== undefined) metadataUpdates.location_id = updates.locationId
    if (updates.isActive !== undefined) metadataUpdates.is_active = updates.isActive

    if (Object.keys(metadataUpdates).length > 0) {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdates,
      })
    }

    return { success: true, message: 'User updated successfully' }
  } catch (error) {
    console.error('Update user error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Admin: Delete user (soft delete)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Verify admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    const supabase = await createClient()

    // Soft delete in public.users
    const { error: deactivateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (deactivateError) {
      console.error('Deactivate user error:', deactivateError)
      return { success: false, error: 'Failed to deactivate user' }
    }

    return { success: true, message: 'User deactivated successfully' }
  } catch (error) {
    console.error('Delete user error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Admin: Reset user password to default
 */
export async function resetUserPassword(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Verify admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin access required.' }
    }

    // Use admin client for password reset
    const adminClient = createAdminClient()

    // Reset to default password
    const defaultPassword = 'Password123!'
    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: defaultPassword,
    })

    if (resetError) {
      console.error('Reset password error:', resetError)
      return { success: false, error: 'Failed to reset password' }
    }

    // Mark password reset as required (use regular client for queries)
    const supabase = await createClient()
    await supabase
      .from('users')
      .update({ is_password_reset_required: true })
      .eq('id', userId)

    return { 
      success: true, 
      message: `Password reset to default: ${defaultPassword}` 
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
