# Fix: "User not allowed" Error

## Problem
When admin tries to create users, you get an error: **"User not allowed"**

## Cause
The `supabase.auth.admin` API requires the **Service Role Key** to perform admin operations like creating users. The anon key doesn't have these permissions.

## Solution

### Step 1: Get Service Role Key from Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (under "Project API keys")
4. Copy the key (⚠️ Keep this secret!)

### Step 2: Add to Environment Variables

Add to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Example `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Different from anon key!
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test User Creation

1. Login as admin: `admin@sathosa.lk` / `Password123!`
2. Go to `/admin/users`
3. Click "Create New User"
4. Fill in the form and submit
5. Should work now! ✅

## What Changed

### Files Modified

**`lib/supabase/server.ts`**
- Added `createAdminClient()` function that uses service role key
- This client has full admin permissions

**`lib/actions/auth.ts`**
- Updated `createUser()` to use `createAdminClient()`
- Updated `updateUser()` to use `createAdminClient()`
- Updated `resetUserPassword()` to use `createAdminClient()`

### Why Service Role Key?

The service role key bypasses Row Level Security (RLS) and has full access to:
- Create users in `auth.users`
- Update user passwords
- Delete users
- Perform other admin operations

⚠️ **Security Note**: The service role key should NEVER be exposed to the browser or committed to git!

## Verification

Check if environment variable is loaded:

```typescript
// In your code (server-side only!)
console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
```

## Common Issues

### Issue 1: Environment variable not loaded
**Solution**: Make sure `.env.local` is in the root directory and restart the server

### Issue 2: Wrong key used
**Solution**: Make sure you copied the `service_role` key, not the `anon` key

### Issue 3: Key has wrong permissions
**Solution**: Regenerate the key in Supabase dashboard if needed

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Go to your hosting platform's environment variables settings
2. Add `SUPABASE_SERVICE_ROLE_KEY` as a secret/encrypted variable
3. Never commit this to git or expose it publicly

## References

- [Supabase Admin API Documentation](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
