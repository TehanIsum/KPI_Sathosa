# Admin User Management Guide

## Overview

The Admin User Management system allows administrators to create and manage user accounts with automatic Supabase Auth integration.

## Features

### 1. Create New Users
- Admin can create users from the admin panel (`/admin/users`)
- All new users get a default password: **`Password123!`**
- Users are automatically required to change password on first login
- User data is synced between `auth.users` and `public.users` via triggers

### 2. Password Management
- **Default Password**: `Password123!`
- **First Login**: User is redirected to password reset page
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
  - Cannot be the same as default password

### 3. User Fields

#### Required Fields (All Users)
- Email address
- Full name
- Role (admin, employee, hod, executive)

#### Conditional Fields
- **For Employees & HODs**:
  - Division (required)
  - Location (required)
  
- **For HODs Only**:
  - Can Act as HOD (allows login as both HOD and Employee)

#### Automatically Set
- `is_password_reset_required: true` (forces password change)
- `is_active: true` (account is active)
- Default password: `Password123!`

## Workflow

### Admin Creates User

```
1. Admin goes to /admin/users
2. Clicks "Create New User"
3. Fills in the form:
   - Email: user@sathosa.lk
   - Full Name: John Doe
   - Role: employee
   - Division: Spare Parts
   - Location: Colombo Spare Parts
4. Clicks "Create User"
```

### System Processing

```
1. Server action createUser() is called
2. User created in auth.users with:
   - email
   - password (Password123!)
   - user_metadata (all profile data)
3. Trigger on_auth_user_created fires
4. Function handle_new_user() extracts metadata
5. Record created in public.users with:
   - id (from auth.users)
   - email
   - full_name
   - role
   - division_id
   - location_id
   - is_password_reset_required: true
   - is_active: true
6. Success message shown to admin
```

### User First Login

```
1. User goes to /login
2. Enters email & Password123!
3. Selects role
4. System authenticates via Supabase Auth
5. Middleware checks is_password_reset_required
6. User redirected to /auth/reset-password
7. User must create new strong password
8. After successful change:
   - is_password_reset_required set to false
   - User redirected to their dashboard
```

## API Functions

### createUser()
Creates a new user with default password

```typescript
await createUser({
  email: 'user@sathosa.lk',
  fullName: 'John Doe',
  role: 'employee',
  canActAsHod: false,
  divisionId: 'uuid',
  locationId: 'uuid',
})
```

### updateUser()
Updates user details

```typescript
await updateUser(userId, {
  fullName: 'New Name',
  role: 'hod',
  isActive: true
})
```

### deleteUser()
Soft deletes (deactivates) a user

```typescript
await deleteUser(userId)
```

### resetUserPassword()
Resets user password to default `Password123!`

```typescript
await resetUserPassword(userId)
```

## Database Schema

### auth.users (Supabase Auth)
```sql
- id: UUID (primary key)
- email: VARCHAR
- encrypted_password: VARCHAR (hashed)
- raw_user_meta_data: JSONB
  {
    "full_name": "John Doe",
    "role": "employee",
    "division_id": "uuid",
    "location_id": "uuid",
    "can_act_as_hod": false,
    "is_active": true,
    "is_password_reset_required": true
  }
```

### public.users (Application Data)
```sql
- id: UUID (matches auth.users.id)
- email: VARCHAR
- full_name: VARCHAR
- role: VARCHAR
- can_act_as_hod: BOOLEAN
- division_id: UUID
- location_id: UUID
- is_active: BOOLEAN
- is_password_reset_required: BOOLEAN
- last_login: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Synchronization

### Trigger: on_auth_user_created
Fires when new user created in `auth.users`

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Function: handle_new_user()
Extracts metadata and creates `public.users` record

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, email, full_name, role,
        division_id, location_id,
        is_password_reset_required, ...
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        ...
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Features

### Password Requirements
- Strong password validation
- Cannot reuse default password
- Server-side validation

### Access Control
- Only admins can create users
- Role-based permissions enforced
- Active account checks

### Audit Trail
- All user creations logged
- Password reset history tracked
- Last login timestamp recorded

## Testing

### Test User Creation

1. Login as admin: `admin@sathosa.lk` / `Password123!`
2. Go to `/admin/users`
3. Create test user
4. Logout
5. Login with new user credentials
6. Verify password reset required
7. Change password
8. Verify access to dashboard

### Verify Sync

```sql
-- Check auth users
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users;

-- Check public users
SELECT id, email, role, is_password_reset_required
FROM public.users;

-- Verify sync
SELECT 
    au.email as auth_email,
    pu.email as public_email,
    pu.role,
    pu.is_password_reset_required
FROM auth.users au
JOIN public.users pu ON au.id = pu.id;
```

## Troubleshooting

### User not appearing in public.users
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
- Verify metadata format in auth.users

### Password reset not working
- Check middleware is enabled
- Verify `is_password_reset_required` field in database
- Check user session is valid

### Cannot create user
- Verify admin permissions
- Check email is not already registered
- Ensure division/location IDs are valid
- Check Supabase auth.admin permissions

## Files

### Server Actions
- `lib/actions/auth.ts` - User management functions

### Components
- `app/admin/users/page.tsx` - User management UI
- `components/auth/password-reset-required.tsx` - Password reset dialog
- `app/auth/reset-password/page.tsx` - Password reset page

### Database
- `database/schema.sql` - Contains trigger definitions
- `database/auth_integration.sql` - Standalone auth setup

### Middleware
- `middleware.ts` - Password reset enforcement

## Best Practices

1. **Always enforce password reset** for new users
2. **Use strong passwords** - enforce validation
3. **Audit user creation** - log who created what
4. **Regular password resets** - for security
5. **Deactivate not delete** - soft delete for audit trail
6. **Verify email addresses** - before creating accounts
7. **Document default credentials** - securely share with users

## Support

For issues or questions:
1. Check trigger and function are active
2. Verify Supabase Auth configuration
3. Review middleware logs
4. Check user metadata format
