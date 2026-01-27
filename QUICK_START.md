# Quick Start Guide - Supabase Auth Login

## ⚡ Fast Setup (5 Minutes)

### 1. Create Test Users in Supabase (Required!)

**Option A: SQL Script (Fastest - Recommended)**

1. Go to: https://supabase.com/dashboard/project/mvjvcqllifglfunnkfyq/sql
2. Open `database/create_auth_users.sql` from your project
3. Copy and paste the entire script into SQL Editor
4. Click **Run** - Done! All 7 users created at once.

**Option B: Dashboard (If you prefer manual creation)**

Go to: https://supabase.com/dashboard/project/mvjvcqllifglfunnkfyq/auth/users

Click **Add User** and create these 6 users (admin already exists):

```
executive@sathosa.lk       | Password123! | ✓ Auto Confirm
hod.vehiclesales@sathosa.lk | Password123! | ✓ Auto Confirm  
hod.spareparts@sathosa.lk   | Password123! | ✓ Auto Confirm
emp.vs.cmb@sathosa.lk       | Password123! | ✓ Auto Confirm
emp.vs.kdy@sathosa.lk       | Password123! | ✓ Auto Confirm
emp.sp.gal@sathosa.lk       | Password123! | ✓ Auto Confirm
```

### 2. Start the Server

```bash
npm run dev
```

Server runs at: **http://localhost:3000**

### 3. Login

**Test Credentials:**
- Email: `admin@sathosa.lk`
- Password: `Password123!`
- Role: `Administrator`

### 4. Verify It Works

✅ Should redirect to `/admin/dashboard`  
✅ See "Welcome, System Administrator" message  
✅ No errors in browser console

---

## 🔧 If Something Doesn't Work

### Problem: "Database error creating new user"

**Root Cause:** The trigger tries to create a user in `public.users` but fails the check constraint (employees need division_id and location_id).

**Solution 1 - Use SQL Script (Best):**
```sql
-- Run this in SQL Editor: database/create_auth_users.sql
-- It creates all users with proper metadata in one go
```

**Solution 2 - Temporarily Disable Constraint:**
```sql
-- Run in SQL Editor
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Now create users in dashboard, then re-enable:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Update roles manually after creation:
UPDATE public.users 
SET role = 'employee', 
    division_id = 'DIVISION_UUID', 
    location_id = 'LOCATION_UUID'
WHERE email = 'user@sathosa.lk';
```

### Problem: "User profile not found"

The user exists in `auth.users` but trigger didn't create `public.users` record.

**Fix:**
Run this in SQL Editor:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If records missing in public.users, insert manually
INSERT INTO public.users (id, email, full_name, role, is_active, is_password_reset_required)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1), 
  CASE 
    WHEN email LIKE 'admin%' THEN 'admin'
    WHEN email LIKE 'executive%' THEN 'executive'
    WHEN email LIKE 'hod%' THEN 'hod'
    ELSE 'employee'
  END as role,
  true,
  false
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.users.id);
```

### Problem: "Invalid email or password"

**Checklist:**
- [ ] Did you create the user in Supabase Auth dashboard?
- [ ] Did you check **Auto Confirm** when creating?
- [ ] Is the password exactly `Password123!` (case-sensitive)?
- [ ] Is the email exactly as shown (lowercase)?

### Problem: Build errors

```bash
npm run build
```

Should see: `✓ Compiled successfully`

### Problem: Server won't start

```bash
# Kill any running process
pkill -f "next dev"

# Start fresh
npm run dev
```

---

## 📋 What Changed

### ✅ Implemented
- Supabase Auth for authentication (no more custom bcrypt)
- Auto-sync trigger from `auth.users` to `public.users`
- Updated login page with better UX
- Updated middleware for Supabase session checking
- Role-based access control maintained

### ❌ Removed
- Custom `password_hash` column
- Manual bcrypt password verification
- Custom session JSON cookies (now uses Supabase session)
- Security definer auth bypass functions

---

## 🎯 Test All Roles

| Email | Password | Role | Dashboard URL |
|-------|----------|------|---------------|
| admin@sathosa.lk | Password123! | Administrator | /admin/dashboard |
| executive@sathosa.lk | Password123! | Executive | /executive/dashboard |
| hod.vehiclesales@sathosa.lk | Password123! | Head of Division | /hod/dashboard |
| emp.vs.cmb@sathosa.lk | Password123! | Employee | /employee/dashboard |

---

## 📚 Full Documentation

- **Complete Setup**: `docs/SUPABASE_AUTH_SETUP.md`
- **Migration Details**: `docs/AUTH_MIGRATION_COMPLETE.md`
- **Developer Setup**: `docs/DEVELOPER_SETUP.md`

---

## 🚀 You're Ready!

Once login works with admin account, you're all set to:
1. ✅ Test other user roles
2. ✅ Continue with Phase 2 (KPI Goal Management)
3. ✅ Build additional features

**Need help?** Check the detailed docs above or review browser/server console logs.
