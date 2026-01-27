'use server'

import { createClient } from '@/lib/supabase/server'
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
