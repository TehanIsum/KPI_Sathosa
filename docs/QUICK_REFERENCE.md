# Quick Reference Guide - KPI Management System

## 🚀 Quick Start

### Start Development Server
```bash
cd /Users/tehanisum/Documents/KPI-Sathosa
npm run dev
```
Access: http://localhost:3001 (or 3000 if available)

### Login with Test Accounts
```
Admin:     admin@sathosa.lk / Password123!
Executive: executive@sathosa.lk / Password123!
HOD:       hod.vehiclesales@sathosa.lk / Password123!
Employee:  emp.sp.1@sathosa.lk / Password123!
```

## 📁 Key File Locations

### Configuration
- Environment: `.env.local`
- Database Schema: `database/schema.sql`
- Seed Data: `database/seed.sql`

### Authentication
- Server Actions: `lib/actions/auth.ts`
- Middleware: `middleware.ts`
- Supabase Clients: `lib/supabase/`

### UI Components
- Login: `app/login/page.tsx`
- Admin: `app/admin/dashboard/page.tsx`
- Employee: `app/employee/dashboard/page.tsx`
- HOD: `app/hod/dashboard/page.tsx`
- Executive: `app/executive/dashboard/page.tsx`

### Types
- Database Types: `lib/types/database.ts`

## 🗄️ Database Quick Reference

### Tables
```
divisions        - Organizational divisions (7 rows)
locations        - Physical locations (20+ rows)
users            - System users (10 test users)
kpi_cycles       - Monthly KPI cycles
kpi_goals        - Individual goals (max 10 per cycle)
kpi_edit_requests - Edit requests for locked goals
notifications    - System notifications
audit_logs       - Complete audit trail
password_reset_tokens - OTP tokens
```

### Key RLS Policies
- Admins: Full access to all tables
- Employees: Access own data only
- HODs: Access division data + own employee data
- Executives: Read-only access to all

### Important Functions
```sql
calculate_achieved_points()  - Auto-calculate KPI scores
update_cycle_totals()        - Recalculate totals
lock_goals_on_submit()       - Lock goals when submitted
validate_cycle_submission()  - Enforce 10 goals + 100% rule
check_missed_deadlines()     - Daily deadline check
auto_freeze_cycles()         - Freeze on 5th of month
```

## 🔑 User Roles & Access

| Role | Can Access | Key Functions |
|------|-----------|---------------|
| **Admin** | Everything | User mgmt, system config, audit logs |
| **Employee** | Own KPIs | Create goals, report progress, view history |
| **HOD** | Division + Employee | Allocate points, approve edits, view team |
| **Executive** | All (read-only) | Analytics, reports, trends |

## 🔐 Security Checklist

### Development
- ✅ Test credentials work
- ✅ RLS policies active
- ✅ Session management working
- ✅ Route protection enabled

### Production (Before Deploy)
- ⚠️ Change all passwords
- ⚠️ Strong SESSION_SECRET
- ⚠️ Configure email service
- ⚠️ Enable HTTPS
- ⚠️ Set up monitoring

## 📊 KPI Lifecycle

```
1. Employee creates 10 goals (DRAFT)
2. HOD allocates points (must total 100%)
3. Employee submits cycle (SUBMITTED - goals locked)
4. Employee reports progress
5. Auto-calculated achievement scores
6. 5th of next month: cycle FROZEN (immutable)
```

## 🛠️ Common Tasks

### Create New User (via SQL)
```sql
INSERT INTO users (email, password_hash, full_name, role, division_id, location_id)
VALUES (
  'newuser@sathosa.lk',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'New User Name',
  'employee',
  (SELECT id FROM divisions WHERE code = 'SP'),
  (SELECT id FROM locations WHERE code = 'SP-CMB')
);
```

### Check User's KPI Cycles
```sql
SELECT c.*, u.full_name 
FROM kpi_cycles c
JOIN users u ON u.id = c.user_id
WHERE u.email = 'emp.sp.1@sathosa.lk';
```

### View Audit Logs
```sql
SELECT * FROM audit_logs 
WHERE entity_type = 'kpi_cycles'
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 Troubleshooting

### Can't Login
1. Check email exists in users table
2. Verify password: `Password123!`
3. Check role matches login selection
4. Clear browser cookies

### Database Connection Error
1. Check `.env.local` has correct Supabase URL/key
2. Verify Supabase project is active
3. Check internet connection

### RLS Blocking Query
1. Verify you're authenticated (check cookies)
2. Check RLS policy for that table
3. Verify your role has access
4. Check console for auth errors

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 📝 Development Workflow

### Adding New Feature
1. Design database changes (if needed)
2. Create migration SQL
3. Update TypeScript types
4. Create server actions
5. Build UI components
6. Test with all roles
7. Update documentation

### Database Changes
1. Write SQL in `database/migrations/`
2. Test in Supabase SQL Editor
3. Update `lib/types/database.ts`
4. Apply to production via dashboard

## 🎯 Next Features to Implement

### Phase 2 Priority:
1. **KPI Goal Creation** - Employee creates monthly goals
2. **Point Allocation** - HOD assigns weights
3. **Progress Updates** - Employee reports achievements
4. **Edit Requests** - Request changes to locked goals
5. **Notifications** - Real-time alerts

## 📞 Support

### Resources:
- [Full Documentation](./DEVELOPER_SETUP.md)
- [Database Design](./DATABASE_DESIGN.md)
- [Architecture](./ARCHITECTURE.md)
- [Phase 1 Summary](./PHASE_1_COMPLETION.md)

### Quick Links:
- Supabase Dashboard: https://app.supabase.com/
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com/

## 💡 Tips

1. **Use Server Actions** - Avoid API routes, use server actions
2. **Check RLS** - Always verify RLS policies when adding tables
3. **Type Everything** - Strict TypeScript is your friend
4. **Test All Roles** - Feature must work for all affected roles
5. **Audit Critical Actions** - Add audit logs for salary-impacting changes
6. **Read Documentation** - Check docs before asking questions

## ⚡ Keyboard Shortcuts (Future)

*Not implemented yet - Phase 3 feature*

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: January 26, 2026  
**System Status**: ✅ Phase 1 Complete
