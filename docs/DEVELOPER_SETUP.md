# KPI & Performance Management System - Developer Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Project Structure](#project-structure)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** or **pnpm**
- **Git**
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Code Editor** - VS Code recommended

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KPI-Sathosa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm run lint
   ```

## Environment Configuration

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase**
   
   Get your Supabase credentials from your project dashboard:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Select your project
   - Go to Settings > API
   - Copy the URL and anon key

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SESSION_SECRET=generate-a-secure-random-32-char-string
   ```

4. **Generate SESSION_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Database Setup

The database setup has been automated through migration files.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Execute the migrations in order:
   - `database/schema.sql` - Creates all tables, indexes, triggers, and RLS policies
   - `database/seed.sql` - Inserts initial data (divisions, locations, users)

### Option 2: Using Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Apply migrations**
   ```bash
   supabase db push
   ```

### Verify Database Setup

Run this query in Supabase SQL Editor to verify:

```sql
SELECT 
  (SELECT COUNT(*) FROM divisions) as divisions_count,
  (SELECT COUNT(*) FROM locations) as locations_count,
  (SELECT COUNT(*) FROM users) as users_count;
```

You should see:
- 7 divisions
- 20+ locations
- 10+ users

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
KPI-Sathosa/
├── app/                      # Next.js App Router
│   ├── admin/               # Admin role pages
│   │   └── dashboard/       # Admin dashboard
│   ├── employee/            # Employee role pages
│   │   └── dashboard/       # Employee dashboard
│   ├── hod/                 # HOD role pages
│   │   └── dashboard/       # HOD dashboard
│   ├── executive/           # Executive role pages
│   │   └── dashboard/       # Executive dashboard
│   ├── login/               # Login page
│   ├── auth/                # Authentication pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root page (redirects)
├── components/              # React components
│   └── ui/                  # UI components (shadcn)
├── lib/                     # Utility libraries
│   ├── actions/             # Server actions
│   │   └── auth.ts          # Authentication actions
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts        # Client-side client
│   │   ├── server.ts        # Server-side client
│   │   └── middleware.ts    # Middleware client
│   ├── types/               # TypeScript types
│   │   └── database.ts      # Database types
│   └── utils.ts             # Utility functions
├── database/                # Database files
│   ├── schema.sql           # Complete schema
│   └── seed.sql             # Seed data
├── docs/                    # Documentation
│   ├── DATABASE_DESIGN.md   # Database design document
│   ├── DEVELOPER_SETUP.md   # This file
│   └── ARCHITECTURE.md      # System architecture
├── middleware.ts            # Next.js middleware (route protection)
├── .env.local               # Environment variables (not in git)
├── .env.example             # Environment template
└── package.json             # Dependencies
```

## Development Workflow

### 1. Authentication Flow

The system uses cookie-based authentication with custom login:

1. User enters email, password, and selects role
2. Server validates credentials against database
3. Password is verified using bcrypt
4. Session is stored in HTTP-only cookie
5. Middleware protects routes based on role

### 2. Role-Based Access

- **Admin**: Full system access, user management
- **Employee**: Own KPI management
- **HOD**: Division management, can also act as Employee
- **Executive**: Read-only analytics and reporting

### 3. Adding New Features

1. Create database migration if needed
2. Update TypeScript types in `lib/types/database.ts`
3. Create server actions in `lib/actions/`
4. Build UI components
5. Add routes in appropriate role directory
6. Update RLS policies if needed

### 4. Database Changes

Always use migrations:

1. Create new migration file in `database/`
2. Test migration in development
3. Apply to production using Supabase dashboard
4. Update documentation

## Testing

### Test Credentials

Use these credentials for testing (from seed data):

**Admin**
- Email: `admin@sathosa.lk`
- Password: `Password123!`
- Role: Administrator

**Executive**
- Email: `executive@sathosa.lk`
- Password: `Password123!`
- Role: Executive

**HOD (Vehicle Sales)**
- Email: `hod.vehiclesales@sathosa.lk`
- Password: `Password123!`
- Role: Head of Division or Employee

**Employee (Spare Parts)**
- Email: `emp.sp.1@sathosa.lk`
- Password: `Password123!`
- Role: Employee

⚠️ **IMPORTANT**: Change all passwords in production!

### Manual Testing Checklist

- [ ] Login with each role
- [ ] Verify role-based redirects
- [ ] Test route protection
- [ ] Verify password reset flow
- [ ] Test logout functionality
- [ ] Check mobile responsiveness

## Troubleshooting

### Issue: Database connection fails

**Solution**: Check your `.env.local` file has correct Supabase credentials

### Issue: RLS policies blocking queries

**Solution**: Ensure you're authenticated and check RLS policies in Supabase dashboard

### Issue: Middleware redirect loop

**Solution**: Clear cookies and restart dev server
```bash
# Clear browser cookies for localhost:3000
# Then restart
npm run dev
```

### Issue: TypeScript errors

**Solution**: Regenerate types
```bash
npx supabase gen types typescript --project-id your-project-ref > lib/types/supabase.ts
```

### Issue: Login fails with correct credentials

**Solution**: 
1. Check if user exists in database
2. Verify password hash in users table
3. Check browser console for errors
4. Verify Supabase connection

### Issue: "Session not found" errors

**Solution**: 
1. Check if cookies are enabled
2. Verify SESSION_SECRET is set
3. Clear browser cookies
4. Check middleware.ts configuration

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

For issues and questions:
1. Check this documentation
2. Review the code comments
3. Check the database documentation
4. Contact the development team

## Security Notes

1. Never commit `.env.local` to git
2. Change all default passwords in production
3. Use strong SESSION_SECRET (32+ characters)
4. Review RLS policies before deployment
5. Enable HTTPS in production
6. Implement rate limiting for login attempts
7. Set up proper CORS policies
8. Regular security audits

## Next Steps

After completing setup:

1. ✅ Verify login works with test credentials
2. ✅ Check all role dashboards load correctly
3. ✅ Test route protection
4. 📝 Implement KPI goal creation (next feature)
5. 📝 Implement HOD point allocation
6. 📝 Build reporting dashboards

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained By**: KPI System Development Team
