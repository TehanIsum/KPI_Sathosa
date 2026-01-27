/**
 * Script to create all test users using Supabase Admin API
 * Run this with: node --env-file=.env.local scripts/create-auth-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

// Load from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  {
    id: '87396e67-684f-4b6f-8098-46669b7b7912',
    email: 'admin@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'System Administrator',
      role: 'admin'
    }
  },
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
    email: 'executive@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Chief Executive',
      role: 'executive'
    }
  },
  {
    id: 'b2c3d4e5-f6a7-4b5c-9d1e-2f3a4b5c6d7e',
    email: 'hod.vehiclesales@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Ravi Fernando',
      role: 'hod'
    }
  },
  {
    id: 'c3d4e5f6-a7b8-4c5d-9e1f-3a4b5c6d7e8f',
    email: 'hod.spareparts@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Nimal Silva',
      role: 'hod'
    }
  },
  {
    id: 'd4e5f6a7-b8c9-4d5e-9f1a-4b5c6d7e8f9a',
    email: 'emp.vs.cmb@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Kasun Perera',
      role: 'employee'
    }
  },
  {
    id: 'e5f6a7b8-c9d1-4e5f-9a1b-5c6d7e8f9a0b',
    email: 'emp.vs.kdy@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Amila Jayasinghe',
      role: 'employee'
    }
  },
  {
    id: 'f6a7b8c9-d1e2-4f5a-9b1c-6d7e8f9a0b1c',
    email: 'emp.sp.gal@sathosa.lk',
    password: 'Password123!',
    user_metadata: {
      full_name: 'Dinesh Kumar',
      role: 'employee'
    }
  }
]

console.log('🚀 Creating users in Supabase Auth...\n')

for (const user of users) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata
    })

    if (error) {
      console.error(`❌ ${user.email}: ${error.message}`)
    } else {
      console.log(`✅ ${user.email} (${user.user_metadata.full_name})`)
    }
  } catch (err) {
    console.error(`❌ ${user.email}: ${err.message}`)
  }
}

console.log('\n✅ Done! All users created.')
console.log('\n🔐 Test login at: http://localhost:3000')
console.log('   Email: admin@sathosa.lk')
console.log('   Password: Password123!')
console.log('   Role: Administrator')
