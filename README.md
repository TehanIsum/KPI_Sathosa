# KPI & Performance Management System

> Enterprise-grade KPI and performance management system for Sathosa Motors PLC

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)]()

## 🎯 Overview

A production-grade, mission-critical web application designed for enterprise KPI and performance management. This system directly impacts employee salary evaluations and performance reviews, requiring the highest standards of security, auditability, and reliability.

### Key Features

✅ **Role-Based Access Control**
- Admin, Employee, HOD, and Executive roles
- Granular permissions with Row Level Security (RLS)
- HODs can act as both manager and employee

✅ **Monthly KPI Cycles**
- Up to 10 goals per employee per month
- Quantity-based and deadline-based targets
- Immutable frozen records after month end

✅ **Transparent Calculations**
- Automated achievement scoring
- Real-time point allocation tracking
- Clear audit trail for all changes

✅ **Enterprise Security**
- OWASP Top 10 compliance
- Comprehensive audit logging
- Encrypted passwords (bcrypt)
- Session-based authentication

✅ **Notification System**
- Deadline miss alerts to HODs
- Escalation to executives (3+ days overdue)
- Email and in-app notifications

## 🏗️ Architecture

Built on modern, scalable architecture:

- **Frontend**: Next.js 15+ with React 19+ (Server Components)
- **Backend**: Next.js Server Actions (TypeScript)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Custom cookie-based sessions
- **UI**: shadcn/ui + Tailwind CSS

[View detailed architecture →](docs/ARCHITECTURE.md)

## 📋 Prerequisites

- Node.js 20+
- npm / yarn / pnpm
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd KPI-Sathosa
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Setup Database

Execute the SQL migrations in your Supabase dashboard:

1. `database/schema.sql` - Creates tables, triggers, RLS policies
2. `database/seed.sql` - Inserts test data

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login with Test Credentials

**Admin**
- Email: `admin@sathosa.lk`
- Password: `Password123!`
- Role: Administrator

**Employee**
- Email: `emp.sp.1@sathosa.lk`
- Password: `Password123!`
- Role: Employee

[See all test credentials →](docs/DEVELOPER_SETUP.md#test-credentials)

⚠️ **Change all passwords in production!**

## 📖 Documentation

- **[Developer Setup Guide](docs/DEVELOPER_SETUP.md)** - Complete setup instructions
- **[Database Design](docs/DATABASE_DESIGN.md)** - Schema, ERD, and RLS policies
- **[System Architecture](docs/ARCHITECTURE.md)** - Technical architecture overview

## 🗂️ Project Structure

```
KPI-Sathosa/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── employee/          # Employee dashboard
│   ├── hod/               # HOD dashboard
│   ├── executive/         # Executive dashboard
│   └── login/             # Login page
├── components/            # React components
│   └── ui/               # UI component library
├── lib/                   # Core utilities
│   ├── actions/          # Server actions
│   ├── supabase/         # Database clients
│   └── types/            # TypeScript types
├── database/              # SQL migrations
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Seed data
├── docs/                  # Documentation
└── middleware.ts          # Route protection
```

## 🔐 Security Features

- **Authentication**: Bcrypt password hashing, OTP-based password reset
- **Authorization**: Role-based access control with RLS policies
- **Session Management**: HTTP-only cookies, 7-day expiry
- **Audit Logging**: Complete trail of all KPI-impacting actions
- **Data Protection**: SQL injection prevention, XSS protection
- **Compliance**: OWASP Top 10, least privilege principle

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|-------------|
| **Admin** | Full system | User management, system configuration, audit logs |
| **Employee** | Own KPIs | Set goals, report achievements, view history |
| **HOD** | Division + Employee | Allocate points, approve edits, manage team |
| **Executive** | Read-only analytics | Company-wide performance, reports, trends |

## 🔄 KPI Lifecycle

```
┌────────┐    ┌───────────┐    ┌────────┐
│ Draft  │ →  │ Submitted │ →  │ Frozen │
│        │    │ (Locked)  │    │(Final) │
└────────┘    └───────────┘    └────────┘
  Editable      Edit requires      Immutable
                HOD approval       (month end)
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5+
- **UI**: React 19+
- **Styling**: Tailwind CSS 4+
- **Components**: shadcn/ui (Radix UI)

### Backend
- **Runtime**: Next.js Server Actions
- **Authentication**: Custom (bcrypt + cookies)
- **Validation**: Zod schemas

### Database
- **Platform**: Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS)
- **ORM**: @supabase/supabase-js

## 📊 Database Schema

7 divisions, 20+ locations, comprehensive audit trail:

- **Core**: divisions, locations, users
- **KPI**: kpi_cycles, kpi_goals, kpi_edit_requests
- **System**: notifications, audit_logs, password_reset_tokens

[View complete schema →](docs/DATABASE_DESIGN.md)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Run production build
npm run start
```

**Manual Testing**: See [test credentials](docs/DEVELOPER_SETUP.md#test-credentials)

## 📝 Development Workflow

1. **Feature Development**
   - Create database migration if needed
   - Update TypeScript types
   - Implement server actions
   - Build UI components
   - Update RLS policies

2. **Code Quality**
   - TypeScript strict mode
   - ESLint configuration
   - Code review required

3. **Deployment**
   - Test in staging environment
   - Run migrations
   - Deploy application
   - Verify security policies

## 🔜 Roadmap

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Database schema with RLS
- ✅ Role-based dashboards
- 🔄 KPI goal management
- 🔄 HOD point allocation
- 🔄 Notification system

### Phase 2
- 📋 Advanced reporting
- 📋 Email integration
- 📋 Data export (Excel/PDF)
- 📋 Performance analytics

### Phase 3
- 📋 Mobile app
- 📋 Real-time notifications
- 📋 ML-based predictions
- 📋 HR system integration

## 🤝 Contributing

This is a proprietary enterprise system. For contribution guidelines, contact the development team.

## 📄 License

Proprietary - Sathosa Motors PLC. All rights reserved.

## 📞 Support

For issues, questions, or support:
1. Check the [documentation](docs/)
2. Review the [developer setup guide](docs/DEVELOPER_SETUP.md)
3. Contact the development team

## ⚠️ Important Notes

1. **Production Deployment**: 
   - Change ALL default passwords
   - Use strong SESSION_SECRET (32+ characters)
   - Enable HTTPS
   - Configure email service
   - Set up monitoring

2. **Security**: 
   - Never commit `.env.local`
   - Regular security audits required
   - Keep dependencies updated
   - Monitor audit logs

3. **Data Integrity**:
   - Historical KPI data is immutable
   - All changes are logged
   - 7-year audit retention

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Active Development  
**Maintained by**: KPI System Development Team

Made with ❤️ for Sathosa Motors PLC

