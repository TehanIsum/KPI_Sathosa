-- ============================================================================
-- KPI & Performance Management System - Database Schema
-- Sathosa Motors PLC
-- ============================================================================
-- Description: Complete database schema with tables, indexes, RLS policies,
--              triggers, and functions for the KPI management system.
-- Version: 1.0.0
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: divisions
-- Description: Organizational divisions within the company
-- ============================================================================
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE divisions IS 'Organizational divisions (Vehicle Sales, Spare Parts, etc.)';
COMMENT ON COLUMN divisions.code IS 'Short code for division (e.g., VS, SP, WS)';

-- ============================================================================
-- TABLE: locations
-- Description: Physical locations under divisions
-- ============================================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_division_location UNIQUE(division_id, name)
);

COMMENT ON TABLE locations IS 'Physical locations under divisions';
CREATE INDEX idx_locations_division ON locations(division_id);

-- ============================================================================
-- TABLE: users
-- Description: System users with role-based access
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee', 'hod', 'executive')),
    can_act_as_hod BOOLEAN DEFAULT false NOT NULL,
    division_id UUID REFERENCES divisions(id) ON DELETE RESTRICT,
    location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_password_reset_required BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_employee_division CHECK (
        (role IN ('employee', 'hod') AND division_id IS NOT NULL AND location_id IS NOT NULL)
        OR (role IN ('admin', 'executive'))
    )
);

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON COLUMN users.role IS 'Primary role: admin, employee, hod, executive';
COMMENT ON COLUMN users.can_act_as_hod IS 'Allows HODs to login as either HOD or employee';
COMMENT ON COLUMN users.is_password_reset_required IS 'Forces password reset on first login';

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_division ON users(division_id);
CREATE INDEX idx_users_location ON users(location_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- TABLE: password_reset_tokens
-- Description: OTP tokens for password reset
-- ============================================================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE password_reset_tokens IS 'OTP tokens for email-based password reset';
CREATE INDEX idx_password_reset_tokens_lookup ON password_reset_tokens(user_id, token, expires_at, is_used);

-- ============================================================================
-- TABLE: kpi_cycles
-- Description: Monthly KPI cycles for employees
-- ============================================================================
CREATE TABLE kpi_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'frozen')),
    submitted_at TIMESTAMPTZ,
    frozen_at TIMESTAMPTZ,
    total_allocated_points DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (total_allocated_points >= 0 AND total_allocated_points <= 100),
    total_achieved_points DECIMAL(5,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_month_year UNIQUE(user_id, month, year)
);

COMMENT ON TABLE kpi_cycles IS 'Monthly KPI cycles - max 10 goals per cycle';
COMMENT ON COLUMN kpi_cycles.status IS 'draft: editable, submitted: locked, frozen: immutable';
COMMENT ON COLUMN kpi_cycles.total_allocated_points IS 'Sum of all allocated_points (must = 100 to submit)';

CREATE INDEX idx_kpi_cycles_user_date ON kpi_cycles(user_id, year, month);
CREATE INDEX idx_kpi_cycles_status ON kpi_cycles(status);

-- ============================================================================
-- TABLE: kpi_goals
-- Description: Individual KPI goals within a cycle (max 10 per cycle)
-- ============================================================================
CREATE TABLE kpi_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_cycle_id UUID NOT NULL REFERENCES kpi_cycles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('quantity', 'deadline')),
    target_quantity DECIMAL(12,2),
    target_deadline DATE,
    allocated_points DECIMAL(5,2) CHECK (allocated_points >= 0 AND allocated_points <= 100),
    actual_quantity DECIMAL(12,2),
    deadline_completed BOOLEAN,
    achieved_points DECIMAL(5,2) DEFAULT 0 NOT NULL,
    hod_remarks TEXT,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_target_quantity CHECK (
        (target_type = 'quantity' AND target_quantity IS NOT NULL AND target_quantity > 0)
        OR (target_type = 'deadline' AND target_deadline IS NOT NULL)
    )
);

COMMENT ON TABLE kpi_goals IS 'Individual KPI goals - max 10 per cycle';
COMMENT ON COLUMN kpi_goals.target_type IS 'quantity: numeric target, deadline: date target';
COMMENT ON COLUMN kpi_goals.allocated_points IS 'Weight assigned by HOD (% of total)';
COMMENT ON COLUMN kpi_goals.achieved_points IS 'Auto-calculated based on actual vs target';
COMMENT ON COLUMN kpi_goals.is_locked IS 'Locked after cycle submission - requires edit request';

CREATE INDEX idx_kpi_goals_cycle ON kpi_goals(kpi_cycle_id);
CREATE INDEX idx_kpi_goals_deadline ON kpi_goals(target_deadline) WHERE target_type = 'deadline';

-- ============================================================================
-- TABLE: kpi_edit_requests
-- Description: Requests to edit locked KPI goals
-- ============================================================================
CREATE TABLE kpi_edit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_goal_id UUID NOT NULL REFERENCES kpi_goals(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    request_reason TEXT NOT NULL,
    requested_changes JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE kpi_edit_requests IS 'Edit requests for locked KPI goals';
COMMENT ON COLUMN kpi_edit_requests.requested_changes IS 'JSONB with proposed field changes';

CREATE INDEX idx_kpi_edit_requests_goal ON kpi_edit_requests(kpi_goal_id);
CREATE INDEX idx_kpi_edit_requests_status ON kpi_edit_requests(status);

-- ============================================================================
-- TABLE: notifications
-- Description: In-app and email notifications
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'deadline_missed',
        'deadline_overdue',
        'edit_request',
        'edit_approved',
        'edit_rejected',
        'kpi_submitted',
        'points_allocated'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_email_sent BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE notifications IS 'In-app and email notifications for users';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- ============================================================================
-- TABLE: audit_logs
-- Description: Complete audit trail of all system actions
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail - retained for 7 years';
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);

-- ============================================================================
-- FUNCTION: update_updated_at_column
-- Description: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_cycles_updated_at BEFORE UPDATE ON kpi_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_goals_updated_at BEFORE UPDATE ON kpi_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: calculate_achieved_points
-- Description: Auto-calculate achieved_points based on actual vs target
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_achieved_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.allocated_points IS NULL THEN
        NEW.achieved_points := 0;
        RETURN NEW;
    END IF;

    IF NEW.target_type = 'quantity' THEN
        IF NEW.actual_quantity IS NOT NULL AND NEW.target_quantity IS NOT NULL AND NEW.target_quantity > 0 THEN
            -- Allow achieved points to exceed 100% if actual > target
            NEW.achieved_points := (NEW.actual_quantity / NEW.target_quantity) * NEW.allocated_points;
        ELSE
            NEW.achieved_points := 0;
        END IF;
    ELSIF NEW.target_type = 'deadline' THEN
        IF NEW.deadline_completed = true THEN
            NEW.achieved_points := NEW.allocated_points;
        ELSE
            NEW.achieved_points := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_kpi_achieved_points BEFORE INSERT OR UPDATE ON kpi_goals
    FOR EACH ROW EXECUTE FUNCTION calculate_achieved_points();

-- ============================================================================
-- FUNCTION: update_cycle_totals
-- Description: Recalculate cycle totals when goals change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_cycle_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE kpi_cycles
    SET 
        total_allocated_points = (
            SELECT COALESCE(SUM(allocated_points), 0)
            FROM kpi_goals
            WHERE kpi_cycle_id = COALESCE(NEW.kpi_cycle_id, OLD.kpi_cycle_id)
        ),
        total_achieved_points = (
            SELECT COALESCE(SUM(achieved_points), 0)
            FROM kpi_goals
            WHERE kpi_cycle_id = COALESCE(NEW.kpi_cycle_id, OLD.kpi_cycle_id)
        )
    WHERE id = COALESCE(NEW.kpi_cycle_id, OLD.kpi_cycle_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cycle_totals_on_goal_change
    AFTER INSERT OR UPDATE OR DELETE ON kpi_goals
    FOR EACH ROW EXECUTE FUNCTION update_cycle_totals();

-- ============================================================================
-- FUNCTION: lock_goals_on_submit
-- Description: Lock all goals when cycle is submitted
-- ============================================================================
CREATE OR REPLACE FUNCTION lock_goals_on_submit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
        UPDATE kpi_goals
        SET is_locked = true
        WHERE kpi_cycle_id = NEW.id;
        
        NEW.submitted_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_goals_on_cycle_submit
    BEFORE UPDATE ON kpi_cycles
    FOR EACH ROW EXECUTE FUNCTION lock_goals_on_submit();

-- ============================================================================
-- FUNCTION: validate_cycle_submission
-- Description: Ensure cycle can only be submitted with exactly 10 goals and 100% points
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_cycle_submission()
RETURNS TRIGGER AS $$
DECLARE
    goal_count INTEGER;
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
        SELECT COUNT(*) INTO goal_count
        FROM kpi_goals
        WHERE kpi_cycle_id = NEW.id;
        
        IF goal_count != 10 THEN
            RAISE EXCEPTION 'Cannot submit cycle: must have exactly 10 goals (current: %)', goal_count;
        END IF;
        
        IF NEW.total_allocated_points != 100 THEN
            RAISE EXCEPTION 'Cannot submit cycle: total allocated points must equal 100%% (current: %)', NEW.total_allocated_points;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_cycle_submission_trigger
    BEFORE UPDATE ON kpi_cycles
    FOR EACH ROW EXECUTE FUNCTION validate_cycle_submission();

-- ============================================================================
-- FUNCTION: prevent_frozen_cycle_edits
-- Description: Prevent any edits to frozen cycles
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_frozen_cycle_edits()
RETURNS TRIGGER AS $$
DECLARE
    cycle_status VARCHAR(50);
BEGIN
    SELECT status INTO cycle_status
    FROM kpi_cycles
    WHERE id = NEW.kpi_cycle_id;
    
    IF cycle_status = 'frozen' THEN
        RAISE EXCEPTION 'Cannot modify goals in frozen cycle';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_frozen_goal_edits
    BEFORE UPDATE ON kpi_goals
    FOR EACH ROW EXECUTE FUNCTION prevent_frozen_cycle_edits();

-- ============================================================================
-- FUNCTION: create_audit_log_trigger
-- Description: Generic function to create audit logs
-- ============================================================================
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_kpi_cycles AFTER INSERT OR UPDATE OR DELETE ON kpi_cycles
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_kpi_goals AFTER INSERT OR UPDATE OR DELETE ON kpi_goals
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_kpi_edit_requests AFTER INSERT OR UPDATE OR DELETE ON kpi_edit_requests
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user division
CREATE OR REPLACE FUNCTION get_user_division()
RETURNS UUID AS $$
    SELECT division_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: divisions
-- ============================================================================
CREATE POLICY "Admins full access to divisions" ON divisions
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "All users can view divisions" ON divisions
    FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES: locations
-- ============================================================================
CREATE POLICY "Admins full access to locations" ON locations
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "All users can view locations" ON locations
    FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES: users
-- ============================================================================
CREATE POLICY "Admins full access to users" ON users
    FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "HODs can view division users" ON users
    FOR SELECT USING (
        get_user_role() = 'hod' AND division_id = get_user_division()
    );

CREATE POLICY "Executives can view all users" ON users
    FOR SELECT USING (get_user_role() = 'executive');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================================
-- RLS POLICIES: password_reset_tokens
-- ============================================================================
CREATE POLICY "Users can access own reset tokens" ON password_reset_tokens
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: kpi_cycles
-- ============================================================================
CREATE POLICY "Employees full access to own cycles" ON kpi_cycles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "HODs can view division cycles" ON kpi_cycles
    FOR SELECT USING (
        get_user_role() = 'hod' AND 
        user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
    );

CREATE POLICY "HODs can update division cycles" ON kpi_cycles
    FOR UPDATE USING (
        get_user_role() = 'hod' AND 
        user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
    );

CREATE POLICY "Executives read-only access to cycles" ON kpi_cycles
    FOR SELECT USING (get_user_role() = 'executive');

CREATE POLICY "Admins read-only access to cycles" ON kpi_cycles
    FOR SELECT USING (get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: kpi_goals
-- ============================================================================
CREATE POLICY "Employees access own goals" ON kpi_goals
    FOR ALL USING (
        kpi_cycle_id IN (SELECT id FROM kpi_cycles WHERE user_id = auth.uid())
    );

CREATE POLICY "HODs can view division goals" ON kpi_goals
    FOR SELECT USING (
        get_user_role() = 'hod' AND
        kpi_cycle_id IN (
            SELECT id FROM kpi_cycles 
            WHERE user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
        )
    );

CREATE POLICY "HODs can update division goals" ON kpi_goals
    FOR UPDATE USING (
        get_user_role() = 'hod' AND
        kpi_cycle_id IN (
            SELECT id FROM kpi_cycles 
            WHERE user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
        )
    );

CREATE POLICY "Executives read-only access to goals" ON kpi_goals
    FOR SELECT USING (get_user_role() = 'executive');

CREATE POLICY "Admins read-only access to goals" ON kpi_goals
    FOR SELECT USING (get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: kpi_edit_requests
-- ============================================================================
CREATE POLICY "Employees can create and view own edit requests" ON kpi_edit_requests
    FOR ALL USING (requested_by = auth.uid());

CREATE POLICY "HODs can view division edit requests" ON kpi_edit_requests
    FOR SELECT USING (
        get_user_role() = 'hod' AND
        kpi_goal_id IN (
            SELECT g.id FROM kpi_goals g
            JOIN kpi_cycles c ON c.id = g.kpi_cycle_id
            WHERE c.user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
        )
    );

CREATE POLICY "HODs can update division edit requests" ON kpi_edit_requests
    FOR UPDATE USING (
        get_user_role() = 'hod' AND
        kpi_goal_id IN (
            SELECT g.id FROM kpi_goals g
            JOIN kpi_cycles c ON c.id = g.kpi_cycle_id
            WHERE c.user_id IN (SELECT id FROM users WHERE division_id = get_user_division())
        )
    );

-- ============================================================================
-- RLS POLICIES: notifications
-- ============================================================================
CREATE POLICY "Users can access own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: audit_logs
-- ============================================================================
CREATE POLICY "Admins full access to audit logs" ON audit_logs
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Executives read-only access to audit logs" ON audit_logs
    FOR SELECT USING (get_user_role() = 'executive');

-- ============================================================================
-- SCHEDULED JOBS (To be implemented via pg_cron or external scheduler)
-- ============================================================================

-- Job 1: Check for missed deadlines (runs daily)
CREATE OR REPLACE FUNCTION check_missed_deadlines()
RETURNS void AS $$
DECLARE
    goal_record RECORD;
BEGIN
    FOR goal_record IN
        SELECT g.id, g.target_deadline, g.description, c.user_id, u.full_name, u.division_id
        FROM kpi_goals g
        JOIN kpi_cycles c ON c.id = g.kpi_cycle_id
        JOIN users u ON u.id = c.user_id
        WHERE g.target_type = 'deadline'
        AND g.target_deadline < CURRENT_DATE
        AND g.deadline_completed IS NULL
        AND c.status != 'frozen'
    LOOP
        -- Notify HOD
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        SELECT id, 'deadline_missed', 
            'KPI Deadline Missed',
            format('Employee %s missed deadline for: %s', goal_record.full_name, goal_record.description),
            'kpi_goal',
            goal_record.id
        FROM users
        WHERE role = 'hod' AND division_id = goal_record.division_id;
        
        -- If 3+ days overdue, notify executives
        IF goal_record.target_deadline < CURRENT_DATE - INTERVAL '3 days' THEN
            INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
            SELECT id, 'deadline_overdue',
                'KPI Deadline Overdue (3+ days)',
                format('Employee %s has overdue KPI: %s', goal_record.full_name, goal_record.description),
                'kpi_goal',
                goal_record.id
            FROM users
            WHERE role = 'executive';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Job 2: Auto-freeze cycles (runs on 5th of each month)
CREATE OR REPLACE FUNCTION auto_freeze_cycles()
RETURNS void AS $$
BEGIN
    UPDATE kpi_cycles
    SET status = 'frozen', frozen_at = now()
    WHERE status = 'submitted'
    AND month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
    AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    AND EXTRACT(DAY FROM CURRENT_DATE) >= 5;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (Adjust based on your Supabase setup)
-- ============================================================================
-- Grant necessary permissions to authenticated users
-- Note: Supabase handles this automatically for authenticated role

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
