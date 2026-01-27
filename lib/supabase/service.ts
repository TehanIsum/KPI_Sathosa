import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role key
 * This bypasses RLS policies and should ONLY be used for:
 * - Authentication operations
 * - Admin operations that require bypassing RLS
 * 
 * ⚠️ NEVER expose this client to the frontend
 * ⚠️ Use with extreme caution - it has full database access
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
