# System Architecture - KPI & Performance Management System

## Overview

The KPI & Performance Management System is a modern, enterprise-grade web application built for Sathosa Motors PLC. It follows a three-tier architecture with clear separation of concerns, strong security boundaries, and enterprise-grade auditability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Next.js 15+ (React 19+)                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Admin    │  │  Employee  │  │   HOD / Exec     │   │  │
│  │  │    UI      │  │     UI     │  │       UI         │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │       shadcn/ui + Tailwind CSS Components        │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Next.js Server Actions                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Authentication  │  KPI Management  │  Reports     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Business Logic Layer                   │  │  │
│  │  │  • Role-based Authorization                        │  │  │
│  │  │  • KPI Validation & Calculation                    │  │  │
│  │  │  • Notification Management                         │  │  │
│  │  │  • Audit Logging                                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │            Middleware Layer                         │  │  │
│  │  │  • Route Protection                                │  │  │
│  │  │  • Session Management                              │  │  │
│  │  │  • Role-based Redirects                            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Supabase (PostgreSQL)                    │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Database Tables                        │  │  │
│  │  │  divisions │ locations │ users │ kpi_cycles        │  │  │
│  │  │  kpi_goals │ notifications │ audit_logs           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Row Level Security (RLS)                   │  │  │
│  │  │  • Policy-based access control                     │  │  │
│  │  │  • Role-specific data filtering                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         Database Functions & Triggers               │  │  │
│  │  │  • Auto-calculation of achieved points             │  │  │
│  │  │  • Cycle totals update                             │  │  │
│  │  │  • Audit log creation                              │  │  │
│  │  │  • Deadline notifications                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 19+
- **Styling**: Tailwind CSS 4+
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

### Backend
- **Runtime**: Next.js Server Actions
- **Language**: TypeScript 5+
- **Authentication**: Custom (bcrypt + cookies)
- **Session Management**: HTTP-only cookies
- **Validation**: Zod schemas

### Database
- **Platform**: Supabase (managed PostgreSQL)
- **ORM**: Supabase Client (@supabase/supabase-js)
- **Security**: Row Level Security (RLS)
- **Migrations**: SQL scripts

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9+
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

## Architecture Patterns

### 1. **Three-Tier Architecture**

**Presentation Tier (Client)**
- React components with server-side rendering
- Type-safe props and state management
- Client-side validation
- Responsive design

**Application Tier (Server)**
- Next.js Server Actions for business logic
- Authentication and authorization
- Data transformation and validation
- API boundary enforcement

**Data Tier (Database)**
- PostgreSQL with RLS policies
- Stored procedures and triggers
- Automated data integrity checks
- Comprehensive audit logging

### 2. **Role-Based Access Control (RBAC)**

```typescript
User Roles Hierarchy:
├── Admin (Full System Access)
├── Executive (Read-only Analytics)
├── HOD (Division Management + Optional Employee Access)
└── Employee (Own KPI Management)
```

**Access Control Flow**:
1. User authenticates with email + password + role
2. Session created with role information
3. Middleware validates route access
4. Server actions verify permissions
5. RLS policies enforce data boundaries

### 3. **Security Model**

**Defense in Depth Strategy**:

1. **Transport Layer**
   - HTTPS enforcement (production)
   - Secure cookie flags (httpOnly, secure, sameSite)

2. **Authentication Layer**
   - Bcrypt password hashing (cost factor 10)
   - OTP-based password reset (15-minute expiry)
   - Session timeout (7 days)

3. **Authorization Layer**
   - Route-level protection (middleware)
   - Action-level validation (server actions)
   - Data-level security (RLS policies)

4. **Data Layer**
   - Input validation (Zod schemas)
   - SQL injection prevention (parameterized queries)
   - XSS protection (React escaping)

5. **Audit Layer**
   - Comprehensive activity logging
   - Immutable audit trail
   - 7-year retention policy

### 4. **Data Flow**

**Read Operation Example** (Employee views own KPIs):
```
1. User clicks "View KPIs"
2. Client → Server Action (getKPICycles)
3. Server Action → Validates session
4. Server Action → Queries Supabase
5. Supabase → RLS policy filters by user_id
6. Supabase → Returns filtered data
7. Server Action → Transforms data
8. Server Action → Returns to client
9. Client → Renders UI
```

**Write Operation Example** (HOD allocates points):
```
1. HOD submits point allocation form
2. Client → Validation (Zod schema)
3. Client → Server Action (allocatePoints)
4. Server Action → Validates session + role
5. Server Action → Business logic validation
6. Server Action → Creates audit log entry
7. Server Action → Updates kpi_goals
8. Database → Triggers recalculate totals
9. Database → RLS policy validates access
10. Server Action → Returns success
11. Client → Updates UI
12. System → Creates notification for employee
```

## Key Features Architecture

### 1. **KPI Cycle Management**

**Monthly Cycle Lifecycle**:
```
Draft → Submitted → Frozen
  ↓         ↓          ↓
Editable  Locked    Immutable
```

**Business Rules Enforcement**:
- Exactly 10 goals per cycle
- Total allocated points = 100%
- Goals locked after submission
- Edit requests required for locked goals
- Cycles frozen on 5th of following month

**Implementation**:
- Database triggers enforce rules
- Server actions validate submissions
- RLS policies prevent unauthorized edits

### 2. **Notification System**

**Notification Types**:
- Deadline missed (to HOD)
- Deadline overdue 3+ days (to Executives)
- Edit request submitted (to HOD)
- Edit approved/rejected (to Employee)
- KPI submitted (to HOD)
- Points allocated (to Employee)

**Notification Flow**:
1. Event occurs (e.g., deadline passes)
2. Database function checks conditions
3. Creates notification records
4. System sends email (TODO: integration)
5. User sees in-app notification
6. User marks as read

### 3. **Audit Logging**

**What Gets Logged**:
- All KPI cycle changes
- All KPI goal modifications
- Edit request lifecycle
- User management actions
- Password changes
- Login/logout events

**Audit Log Structure**:
```typescript
{
  user_id: UUID,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  entity_type: 'kpi_cycles' | 'kpi_goals' | ...,
  entity_id: UUID,
  old_values: JSON,
  new_values: JSON,
  ip_address: string,
  user_agent: string,
  timestamp: timestamp
}
```

## Database Design Highlights

### **Normalization**: 3NF
All tables are normalized to Third Normal Form to eliminate redundancy.

### **Referential Integrity**
- Foreign keys with appropriate cascade rules
- Check constraints for data validity
- Unique constraints where needed

### **Indexing Strategy**
```sql
-- Performance indexes
CREATE INDEX idx_kpi_cycles_user_date ON kpi_cycles(user_id, year, month);
CREATE INDEX idx_kpi_goals_deadline ON kpi_goals(target_deadline) WHERE target_type = 'deadline';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
```

### **Triggers for Business Logic**
1. `update_updated_at` - Auto-timestamp updates
2. `calculate_achieved_points` - Auto-calculate KPI scores
3. `update_cycle_totals` - Maintain aggregate totals
4. `lock_goals_on_submit` - Enforce locking rules
5. `validate_cycle_submission` - Enforce 10 goals + 100% rule
6. `prevent_frozen_cycle_edits` - Immutability enforcement
7. `create_audit_log` - Automatic audit trail

## Scalability Considerations

### **Horizontal Scalability**
- Stateless server actions
- Cookie-based sessions (no server state)
- Database connection pooling (Supabase)

### **Vertical Scalability**
- Efficient SQL queries with proper indexes
- Pagination for large datasets
- Lazy loading of UI components

### **Performance Optimizations**
- Server-side rendering (Next.js)
- Database query optimization
- Caching strategies (React cache)
- CDN for static assets

## Security Best Practices

### **OWASP Top 10 Compliance**

1. **Broken Access Control** ✅
   - RLS policies enforce data access
   - Middleware protects routes
   - Server actions validate permissions

2. **Cryptographic Failures** ✅
   - Bcrypt for password hashing
   - HTTPS in production
   - Secure cookie flags

3. **Injection** ✅
   - Parameterized queries (Supabase client)
   - Input validation (Zod)
   - SQL injection prevention

4. **Insecure Design** ✅
   - Principle of least privilege
   - Defense in depth
   - Audit logging

5. **Security Misconfiguration** ✅
   - Environment variable management
   - Secure defaults
   - Production hardening checklist

6. **Vulnerable Components** ✅
   - Regular dependency updates
   - Security advisories monitoring
   - Minimal dependencies

7. **Authentication Failures** ✅
   - Strong password requirements
   - Rate limiting (TODO: implement)
   - Session timeout

8. **Software/Data Integrity** ✅
   - Audit logging
   - Immutable records
   - Version control

9. **Logging Failures** ✅
   - Comprehensive audit logs
   - Error tracking
   - Security event monitoring

10. **SSRF** ✅
    - No external API calls from user input
    - Whitelist approach

## Deployment Architecture

### **Development Environment**
```
Developer Machine
├── Next.js Dev Server (localhost:3000)
├── Supabase Local (optional)
└── VS Code / IDE
```

### **Production Environment** (Recommended)
```
┌─────────────────────────────────────────┐
│           Vercel / Cloud Provider        │
│  ┌───────────────────────────────────┐  │
│  │      Next.js Application          │  │
│  │  (Serverless Functions)           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│           Supabase Cloud                 │
│  ┌───────────────────────────────────┐  │
│  │    PostgreSQL Database            │  │
│  │    (Managed, Auto-backup)         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### **Backup Strategy**
- Daily automated backups (Supabase)
- Point-in-time recovery enabled
- Audit logs retained for 7 years
- Migration scripts version controlled

## Future Enhancements

### Phase 2 Features
- [ ] Email integration (SendGrid/AWS SES)
- [ ] Advanced reporting dashboards
- [ ] Data export functionality
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSockets)

### Phase 3 Features
- [ ] Machine learning for KPI predictions
- [ ] Integration with HR systems
- [ ] Multi-language support
- [ ] Advanced analytics (BI integration)

## Maintenance & Monitoring

### **Health Checks**
- Database connection status
- API response times
- Error rates
- User session counts

### **Monitoring Tools** (To Implement)
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Log aggregation (Datadog/CloudWatch)
- Uptime monitoring

### **Maintenance Schedule**
- Weekly dependency updates
- Monthly security reviews
- Quarterly performance audits
- Annual architecture review

---

**Document Version**: 1.0.0  
**Last Updated**: January 2026  
**Authors**: KPI System Development Team
