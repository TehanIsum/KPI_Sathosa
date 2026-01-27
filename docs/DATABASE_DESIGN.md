# Database Design - KPI & Performance Management System

## Overview
This document describes the database schema for the Sathosa Motors PLC KPI Management System.

## Design Principles
1. **Auditability**: Every KPI-impacting action is logged
2. **Immutability**: Historical KPI data cannot be altered retroactively
3. **Role-based Access**: RLS policies enforce role boundaries
4. **Data Integrity**: Foreign keys and constraints ensure consistency
5. **Performance**: Indexes on frequently queried columns

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   divisions  │──────<│  locations   │──────<│    users     │
└──────────────┘       └──────────────┘       └──────────────┘
                                                      │
                                                      │
                                               ┌──────┴──────┐
                                               │             │
                                               ▼             ▼
┌──────────────┐       ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ kpi_cycles   │──────<│  kpi_goals   │  │password_reset│  │audit_logs    │
└──────────────┘       └──────────────┘  └──────────────┘  └──────────────┘
                              │
                              │
                       ┌──────┴──────┐
                       │             │
                       ▼             ▼
                ┌──────────────┐  ┌──────────────┐
                │kpi_edit_req. │  │notifications │
                └──────────────┘  └──────────────┘
```

## Table Definitions

### 1. divisions
Organizational divisions within the company.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Division name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Short code (e.g., VS, SP, WS) |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

### 2. locations
Physical locations under divisions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| division_id | UUID | FK → divisions.id, NOT NULL | Parent division |
| name | VARCHAR(255) | NOT NULL | Location name |
| code | VARCHAR(50) | NOT NULL | Short code |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Constraints**: UNIQUE(division_id, name)

### 3. users
System users with role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address (login) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(255) | NOT NULL | Full name |
| role | VARCHAR(50) | NOT NULL | Primary role (admin, employee, hod, executive) |
| can_act_as_hod | BOOLEAN | DEFAULT false | Can login as HOD |
| division_id | UUID | FK → divisions.id, NULL | Division (if applicable) |
| location_id | UUID | FK → locations.id, NULL | Location (if applicable) |
| is_active | BOOLEAN | DEFAULT true | Active status |
| is_password_reset_required | BOOLEAN | DEFAULT true | Requires password reset on first login |
| last_login | TIMESTAMPTZ | NULL | Last login timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Constraints**: 
- CHECK (role IN ('admin', 'employee', 'hod', 'executive'))
- If role = 'employee' or 'hod', division_id and location_id must NOT be NULL

### 4. password_reset_tokens
OTP tokens for password reset.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User requesting reset |
| token | VARCHAR(6) | NOT NULL | 6-digit OTP |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration time |
| is_used | BOOLEAN | DEFAULT false | Whether token has been used |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Constraints**: Index on (user_id, token, expires_at, is_used)

### 5. kpi_cycles
Monthly KPI cycles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Employee |
| month | INTEGER | NOT NULL, CHECK (1-12) | Month number |
| year | INTEGER | NOT NULL | Year |
| status | VARCHAR(50) | NOT NULL | draft, submitted, frozen |
| submitted_at | TIMESTAMPTZ | NULL | Submission timestamp |
| frozen_at | TIMESTAMPTZ | NULL | Freeze timestamp |
| total_allocated_points | DECIMAL(5,2) | DEFAULT 0 | Sum of allocated points (must = 100) |
| total_achieved_points | DECIMAL(5,2) | DEFAULT 0 | Sum of achieved points |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Constraints**: 
- UNIQUE(user_id, month, year)
- CHECK (status IN ('draft', 'submitted', 'frozen'))
- CHECK (total_allocated_points >= 0 AND total_allocated_points <= 100)

### 6. kpi_goals
Individual KPI goals within a cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| kpi_cycle_id | UUID | FK → kpi_cycles.id, NOT NULL | Parent cycle |
| description | TEXT | NOT NULL | Goal description |
| target_type | VARCHAR(20) | NOT NULL | quantity or deadline |
| target_quantity | DECIMAL(12,2) | NULL | Numeric target (if quantity) |
| target_deadline | DATE | NULL | Date target (if deadline) |
| allocated_points | DECIMAL(5,2) | NULL | HOD-assigned weight (%) |
| actual_quantity | DECIMAL(12,2) | NULL | Actual achievement (if quantity) |
| deadline_completed | BOOLEAN | NULL | Whether deadline met (if deadline) |
| achieved_points | DECIMAL(5,2) | DEFAULT 0 | Auto-calculated achievement (%) |
| hod_remarks | TEXT | NULL | HOD feedback |
| is_locked | BOOLEAN | DEFAULT false | Locked after submission |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Constraints**: 
- CHECK (target_type IN ('quantity', 'deadline'))
- If target_type = 'quantity', target_quantity must NOT be NULL
- If target_type = 'deadline', target_deadline must NOT be NULL
- CHECK (allocated_points >= 0 AND allocated_points <= 100)

### 7. kpi_edit_requests
Requests to edit locked KPI goals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| kpi_goal_id | UUID | FK → kpi_goals.id, NOT NULL | Goal to edit |
| requested_by | UUID | FK → users.id, NOT NULL | Employee requesting |
| request_reason | TEXT | NOT NULL | Justification |
| requested_changes | JSONB | NOT NULL | Proposed changes |
| status | VARCHAR(50) | NOT NULL | pending, approved, rejected |
| reviewed_by | UUID | FK → users.id, NULL | HOD who reviewed |
| review_remarks | TEXT | NULL | HOD feedback |
| reviewed_at | TIMESTAMPTZ | NULL | Review timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Constraints**: 
- CHECK (status IN ('pending', 'approved', 'rejected'))

### 8. notifications
In-app and email notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Recipient |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| related_entity_type | VARCHAR(50) | NULL | Entity type (kpi_goal, edit_request) |
| related_entity_id | UUID | NULL | Entity ID |
| is_read | BOOLEAN | DEFAULT false | Read status |
| is_email_sent | BOOLEAN | DEFAULT false | Email sent status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Constraints**: 
- CHECK (type IN ('deadline_missed', 'deadline_overdue', 'edit_request', 'edit_approved', 'edit_rejected', 'kpi_submitted'))
- Index on (user_id, is_read, created_at)

### 9. audit_logs
Complete audit trail of all system actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User performing action |
| action | VARCHAR(100) | NOT NULL | Action type |
| entity_type | VARCHAR(50) | NOT NULL | Entity affected |
| entity_id | UUID | NOT NULL | Entity ID |
| old_values | JSONB | NULL | Values before change |
| new_values | JSONB | NULL | Values after change |
| ip_address | VARCHAR(45) | NULL | Request IP address |
| user_agent | TEXT | NULL | Browser/client info |
| created_at | TIMESTAMPTZ | DEFAULT now() | Action timestamp |

**Constraints**: 
- Index on (user_id, created_at)
- Index on (entity_type, entity_id, created_at)

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_locations_division ON locations(division_id);
CREATE INDEX idx_users_division ON users(division_id);
CREATE INDEX idx_users_location ON users(location_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_kpi_cycles_user_date ON kpi_cycles(user_id, year, month);
CREATE INDEX idx_kpi_goals_cycle ON kpi_goals(kpi_cycle_id);
CREATE INDEX idx_kpi_goals_deadline ON kpi_goals(target_deadline) WHERE target_type = 'deadline';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);
```

## Row Level Security (RLS) Policies

### users table
- Admins: Full access
- HODs: Can view users in their division
- Employees: Can view own record only
- Executives: Can view all users (read-only)

### kpi_cycles table
- Employees: Full access to own cycles
- HODs: Can view and update cycles for users in their division
- Executives: Read-only access to all cycles
- Admins: Read-only access to all cycles

### kpi_goals table
- Employees: Full access to own goals (with lock restrictions)
- HODs: Can view and update allocated_points and hod_remarks for their division
- Executives: Read-only access to all goals
- Admins: Read-only access to all goals

### kpi_edit_requests table
- Employees: Can create and view own requests
- HODs: Can view and review requests from their division
- Others: No access

### notifications table
- Users can only see their own notifications

### audit_logs table
- Admins: Full read access
- Executives: Read access
- Others: No access

## Triggers

### 1. update_updated_at
Auto-update `updated_at` timestamp on row modification.

### 2. calculate_achieved_points
Auto-calculate `achieved_points` when `actual_quantity` or `deadline_completed` changes.

### 3. update_cycle_totals
Recalculate `total_allocated_points` and `total_achieved_points` when goals change.

### 4. create_audit_log
Log all INSERT, UPDATE, DELETE operations on critical tables.

### 5. check_deadline_notifications
Daily job to check missed deadlines and create notifications.

## Data Validation Rules

1. **KPI Cycle Submission**: Can only submit if exactly 10 goals are defined
2. **Point Allocation**: Sum of allocated_points across all goals in a cycle must equal 100%
3. **Goal Locking**: Goals are locked after cycle submission
4. **Cycle Freezing**: Cycles freeze automatically on the 5th of the following month
5. **Edit Requests**: Only possible for locked (but not frozen) goals

## Backup & Recovery

- Daily automated backups
- Point-in-time recovery enabled
- Audit logs retained for 7 years (compliance requirement)
