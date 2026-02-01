# Supabase Auth Setup Guide

## Overview

This KPI Management System uses **Supabase Auth** for authentication instead of custom password management. The `public.users` table is automatically synced with `auth.users` via database triggers.

## Architecture

### Two-Table System

1. **`auth.users`** (Supabase managed) - Handles authentication
   - Email/password storage
   - Password hashing (bcrypt)
   - Session management
   - Password reset tokens

2. **`public.users`** (Application data) - Stores user profiles
   - Role information
   - Division/location assignments
   - Custom application fields
   - Synced automatically via triggers

### How It Works

```
User signs up/is created
        ↓
  Insert into auth.users
        ↓
  Trigger: on_auth_user_created
        ↓
  Auto-insert into public.users
        ↓
  User can login via Supabase Auth
```

## Database Setup Steps

### Step 1: Run Schema

Execute in Supabase SQL Editor:

```bash
database/schema.sql
```

This creates:
- All tables (divisions, locations, users, kpi_*, etc.)
- Triggers for auth integration
- RLS policies
- Functions and indexes

### Step 2: Seed Base Data

Execute in Supabase SQL Editor:

```bash
database/seed.sql
```

This creates:
- 7 divisions
- 20+ locations
- No users (they're created in next step)

### Step 3: Create Auth Users

Execute in Supabase SQL Editor:

```bash
database/create_auth_users.sql
```

This creates users in `auth.users` with proper metadata. The trigger automatically creates matching records in `public.users`.

**Test Users Created:**
- `admin@sathosa.lk` / `Password123!` (Admin)
- `executive@sathosa.lk` / `Password123!` (Executive)
- `hod.vehiclesales@sathosa.lk` / `Password123!` (HOD)
- `hod.spareparts@sathosa.lk` / `Password123!` (HOD)
- `emp.sp.1@sathosa.lk` / `Password123!` (Employee)
- And more...

## Verification

### Check Auth Users

```sql
SELECT id, email, created_at, raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at;
```

### Check Public Users (Should match)

```sql
SELECT id, email, full_name, role, division_id, is_active
FROM public.users
ORDER BY created_at;
```

### Verify Sync

```sql
-- Should return 0 if properly synced
SELECT COUNT(*) as orphaned_auth_users
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

## Creating New Users

### Via Supabase Dashboard

1. Go to Authentication > Users
2. Click "Add User"
3. Fill in email and password
4. Add metadata in "User Metadata" section:

```json
{
  "full_name": "John Doe",
  "role": "employee",
  "division_id": "uuid-here",
  "location_id": "uuid-here",
  "can_act_as_hod": false,
  "is_active": true,
  "is_password_reset_required": false
}
```

5. The trigger will automatically create the public.users record

### Via SQL

```sql
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'newuser@sathosa.lk',
  crypt('SecurePassword123!', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'full_name', 'New User Name',
    'role', 'employee',
    'division_id', 'division-uuid-here',
    'location_id', 'location-uuid-here',
    'can_act_as_hod', false,
    'is_active', true,
    'is_password_reset_required', false
  ),
  NOW(),
  NOW()
);
```

### Via Application API

Use the `signUp` method from `@supabase/supabase-js`:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'newuser@sathosa.lk',
  password: 'SecurePassword123!',
  options: {
    data: {
      full_name: 'New User Name',
      role: 'employee',
      division_id: 'division-uuid-here',
      location_id: 'location-uuid-here',
      can_act_as_hod: false,
      is_active: true,
      is_password_reset_required: false
    }
  }
})
```

## Migration from Custom Auth

If you were using custom authentication before:

### Option 1: Fresh Start (Recommended)

1. Drop existing users: `TRUNCATE public.users CASCADE;`
2. Run `create_auth_users.sql`
3. All users will need new passwords

### Option 2: Migrate Existing Users

```sql
-- For each user in public.users, create in auth.users
-- Note: Passwords will need to be reset as bcrypt hashes can't be migrated
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('TemporaryPassword123!', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'full_name', full_name,
    'role', role,
    'division_id', division_id::text,
    'location_id', location_id::text,
    'can_act_as_hod', can_act_as_hod,
    'is_active', is_active,
    'is_password_reset_required', true
  ),
  created_at,
  NOW()
FROM public.users;
```

## Troubleshooting

### Users not appearing in public.users

1. Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. Check function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

3. Manually trigger sync:
```sql
SELECT handle_new_user() FROM auth.users WHERE id NOT IN (SELECT id FROM public.users);
```

### RLS Policies blocking access

Temporarily disable RLS for testing (NOT in production):
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### Password resets not working

Ensure Supabase email templates are configured:
1. Go to Authentication > Email Templates
2. Configure "Reset Password" template
3. Set redirect URL to: `https://your-domain.com/auth/reset-password`

## Security Considerations

1. **Never store passwords in public.users** - The `password_hash` field is legacy and should remain empty
2. **Use RLS policies** - Always keep RLS enabled in production
3. **Validate metadata** - The trigger validates division/location relationships
4. **Role validation** - Ensure roles match: admin, employee, hod, executive
5. **Division requirements** - Employees and HODs MUST have division_id and location_id

## Files Reference

- `database/schema.sql` - Complete schema with auth integration
- `database/seed.sql` - Base data (divisions, locations)
- `database/create_auth_users.sql` - Creates test users in auth.users
- `database/auth_integration.sql` - Standalone auth integration (if needed separately)

## Next Steps

After setup:
1. Test login with test credentials
2. Verify RLS policies are working
3. Change all test passwords
4. Configure email service in Supabase
5. Set up proper environment variables
6. Deploy application

## Support

For issues:
- Check Supabase logs: Database > Logs
- Check trigger execution: `SELECT * FROM pg_stat_activity;`
- Verify user metadata format matches exactly
