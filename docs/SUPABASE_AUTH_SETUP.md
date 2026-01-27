# Supabase Auth Setup Guide

## Creating Test Users in Supabase Auth

The application now uses **Supabase Auth** for authentication instead of custom bcrypt passwords. Follow these steps to set up test users:

### Method 1: Using SQL Script (Recommended - Fastest)

**This method creates all users at once and avoids constraint errors.**

1. Go to your Supabase project: https://supabase.com/dashboard/project/mvjvcqllifglfunnkfyq
2. Navigate to **SQL Editor**
3. Open the file `database/create_auth_users.sql` from your project
4. Copy the entire SQL script
5. Paste it into the SQL Editor
6. Click **Run** or press `Cmd/Ctrl + Enter`

This will create all 7 test users in one go with proper metadata.

### Method 2: Using Supabase Dashboard (If SQL Method Fails)

1. Go to your Supabase project: https://supabase.com/dashboard/project/mvjvcqllifglfunnkfyq
2. Navigate to **Authentication** > **Users**
3. Click **Add User** > **Create New User**

**Important:** If you get "Database error creating new user", use Method 1 (SQL Script) instead.

Create these test users:

#### 1. Administrator
- **Email**: `admin@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓ (Check this box)
- **User ID**: `87396e67-684f-4b6f-8098-46669b7b7912` (already exists in auth.users)

#### 2. Executive
- **Email**: `executive@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

#### 3. HOD - Vehicle Sales
- **Email**: `hod.vehiclesales@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

#### 4. HOD - Spare Parts
- **Email**: `hod.spareparts@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

#### 5. Employee - Vehicle Sales Colombo
- **Email**: `emp.vs.cmb@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

#### 6. Employee - Vehicle Sales Kandy
- **Email**: `emp.vs.kdy@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

#### 7. Employee - Spare Parts Galle
- **Email**: `emp.sp.gal@sathosa.lk`
- **Password**: `Password123!`
- **Auto Confirm**: ✓
- Click **Create User**, then note the generated UUID

### Method 2: Using SQL (If Dashboard Method Fails)

Run this in **SQL Editor** (will be logged in server logs):

```sql
-- Note: This requires auth.users insert permissions
-- Usually done via Supabase client library in production

-- For development, use the dashboard method above
```

### Method 3: Using Signup API (Not Recommended)

This method won't set the correct metadata, so use Method 1 (SQL) or Method 2 (Dashboard) instead.

## Verifying Setup

After creating users in Supabase Auth:

1. Check **Authentication** > **Users** to see all created users
2. The `public.users` table should auto-populate via the trigger
3. Update any UUIDs in `public.users` if needed:

```sql
-- Check public.users records
SELECT id, email, role FROM public.users;

-- If UUIDs don't match, update them
UPDATE public.users 
SET id = 'NEW_UUID_FROM_AUTH_USERS'
WHERE email = 'user@example.com';
```

## Testing Login

1. Start the development server: `npm run dev`
2. Go to http://localhost:3000
3. Try logging in with:
   - **Email**: admin@sathosa.lk
   - **Password**: Password123!
   - **Role**: Administrator

## Troubleshooting

### "User profile not found" Error

This means the user exists in `auth.users` but not in `public.users`. Solutions:

1. **Check the trigger**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Manually insert into public.users**:
   ```sql
   INSERT INTO public.users (id, email, full_name, role, is_active, is_password_reset_required)
   VALUES (
     'USER_UUID_FROM_AUTH_USERS',
     'user@sathosa.lk',
     'User Full Name',
     'admin', -- or 'employee', 'hod', 'executive'
     true,
     false
   );
   ```

### "Invalid email or password" Error

- Verify user exists in Supabase Auth dashboard
- Check that email is confirmed (Auto Confirm was checked)
- Try resetting the password via dashboard

### RLS Policy Issues

If you see "new row violates row-level security policy" errors:

```sql
-- Temporarily disable RLS for setup (re-enable after)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Insert users, then re-enable
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## Production Setup

For production:

1. **Disable** email confirmation (or set up email service)
2. **Enable** leaked password protection in Auth settings
3. **Require** password reset on first login
4. **Use** strong passwords (not Password123!)
5. **Set up** proper email templates

## Migration from Old System

The old custom auth system used `password_hash` in `public.users`. This has been removed. All authentication now goes through Supabase Auth.

### Changes Made:
- ✅ Removed `password_hash` column from `public.users`
- ✅ Created trigger to auto-create `public.users` from `auth.users`
- ✅ Updated `lib/actions/auth.ts` to use Supabase Auth
- ✅ Updated middleware to check Supabase session
- ✅ Updated login page to work with Supabase Auth

---

**Need Help?** Check the Supabase Auth documentation: https://supabase.com/docs/guides/auth
