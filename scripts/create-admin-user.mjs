import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const adminUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@sathosa.lk',
  password: 'Password123!',
  user_metadata: {
    full_name: 'System Administrator',
    role: 'admin',
  },
}

console.log('🚀 Creating admin user...')

try {
  const { data, error } = await supabase.auth.admin.createUser({
    id: adminUser.id,
    email: adminUser.email,
    password: adminUser.password,
    email_confirm: true,
    user_metadata: adminUser.user_metadata,
  })

  if (error) {
    console.error(`❌ ${adminUser.email}: ${error.message}`)
  } else {
    console.log(`✅ ${adminUser.email} (${adminUser.user_metadata.full_name})`)
  }
} catch (err) {
  console.error(`❌ Error: ${err.message}`)
}

console.log('\n✅ Done!')
