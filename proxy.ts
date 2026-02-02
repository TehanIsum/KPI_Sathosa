import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@/lib/types/database'

/**
 * Proxy for authentication and role-based access control using Supabase Auth
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/auth/forgot-password', '/auth/callback', '/auth/reset-password']
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return response
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active, is_password_reset_required, can_act_as_hod')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if active
  if (!profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get active role from cookie (for HODs)
  const selectedRoleCookie = request.cookies.get('kpi_selected_role')
  const activeRole = (selectedRoleCookie?.value as UserRole) || profile.role

  // Force password reset if required
  if (profile.is_password_reset_required && !pathname.startsWith('/auth/reset-password')) {
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }

  // Role-based route access
  const roleAccess: Record<UserRole, string[]> = {
    admin: ['/admin'],
    employee: ['/employee'],
    hod: ['/hod', '/employee'], // HODs can access both
    executive: ['/executive'],
  }

  const allowedRoutes = roleAccess[activeRole]
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

  // Redirect to appropriate dashboard if unauthorized
  if (!hasAccess && pathname !== '/') {
    const dashboards: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      employee: '/employee/dashboard',
      hod: '/hod/dashboard',
      executive: '/executive/dashboard',
    }
    return NextResponse.redirect(new URL(dashboards[activeRole], request.url))
  }

  // Redirect root to dashboard
  if (pathname === '/') {
    const dashboards: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      employee: '/employee/dashboard',
      hod: '/hod/dashboard',
      executive: '/executive/dashboard',
    }
    return NextResponse.redirect(new URL(dashboards[activeRole], request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
