# Fix "Database error creating new user" - Simple Solution

## Problem
When creating users via Supabase Dashboard → Authentication → Users, you get:
```
Failed to create user: Database error creating new user
```

## Root Cause
The trigger function tries to insert into `public.users`, but the check constraint requires employees/HODs to have `division_id` and `location_id`, which aren't provided when creating via dashboard.

## ✅ Solution: Use the SQL Script

Instead of creating users one-by-one in the dashboard, use the SQL script that creates all users at once with proper metadata.

### Steps:

1. **Go to SQL Editor**
   - URL: https://supabase.com/dashboard/project/mvjvcqllifglfunnkfyq/sql

2. **Copy this script** (from `database/create_auth_users.sql`)
   - Or just run the file directly in SQL Editor

3. **Click Run**
   - All 7 users will be created with passwords set to `Password123!`

4. **Verify**
   ```sql
   -- Check auth.users
   SELECT email, email_confirmed_at FROM auth.users;
   
   -- Check public.users
   SELECT email, role, division_id FROM public.users;
   ```

## Alternative: Manual Dashboard Creation (Workaround)

If you still want to use the dashboard method:

### Step 1: Temporarily change default role
```sql
-- Run this in SQL Editor first
UPDATE pg_proc 
SET prosrc = replace(prosrc, 
  'COALESCE(NEW.raw_user_meta_data->>''role'', ''admin'')', 
  'COALESCE(NEW.raw_user_meta_data->>''role'', ''executive'')')
WHERE proname = 'handle_new_user';
```

### Step 2: Create users in dashboard
Now the dashboard will default to 'executive' role which doesn't require division/location.

### Step 3: Update roles manually
```sql
-- After creating users, update their roles:
UPDATE public.users 
SET role = 'employee',
    division_id = (SELECT id FROM divisions WHERE code = 'VS'),
    location_id = (SELECT id FROM locations WHERE code = 'VS-CMB')
WHERE email = 'emp.vs.cmb@sathosa.lk';

-- Repeat for other users...
```

## What Was Fixed

✅ Updated trigger to default to 'admin' role (bypasses constraint)  
✅ Created SQL script to bulk-create users with metadata  
✅ Improved trigger to read division_id/location_id from metadata  
✅ Added better error handling in trigger function  

## Test Login

After running the SQL script:

1. Go to http://localhost:3000
2. Email: `admin@sathosa.lk`
3. Password: `Password123!`
4. Role: `Administrator`
5. Should work! ✅

## Files

- **SQL Script**: `database/create_auth_users.sql`
- **Documentation**: `docs/SUPABASE_AUTH_SETUP.md`
- **Quick Guide**: `QUICK_START.md`
