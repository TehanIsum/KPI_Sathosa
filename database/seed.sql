-- ============================================================================
-- KPI & Performance Management System - Seed Data
-- Sathosa Motors PLC
-- ============================================================================
-- Description: Initial seed data for development and testing
-- WARNING: This includes test users with default passwords
--          CHANGE ALL PASSWORDS in production!
-- ============================================================================

-- ============================================================================
-- SEED: divisions
-- ============================================================================
INSERT INTO divisions (name, code, is_active) VALUES
    ('Vehicle Sales', 'VS', true),
    ('Spare Parts Sales - 10 Locations', 'SP', true),
    ('Workshops', 'WS', true),
    ('Body Fabrication Division', 'BFD', true),
    ('Finance', 'FIN', true),
    ('Human Resources', 'HR', true),
    ('Information Technology', 'IT', true);

-- ============================================================================
-- SEED: locations
-- ============================================================================
-- Vehicle Sales Locations (example)
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Colombo - Head Office', 'VS-CMB', true FROM divisions WHERE code = 'VS';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Kandy Branch', 'VS-KDY', true FROM divisions WHERE code = 'VS';

-- Spare Parts Sales - 10 Locations
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Colombo Spare Parts', 'SP-CMB', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Galle Spare Parts', 'SP-GAL', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Kandy Spare Parts', 'SP-KDY', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Kurunegala Spare Parts', 'SP-KRG', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Matara Spare Parts', 'SP-MTR', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Jaffna Spare Parts', 'SP-JAF', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Anuradhapura Spare Parts', 'SP-APR', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Batticaloa Spare Parts', 'SP-BAT', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Trincomalee Spare Parts', 'SP-TRI', true FROM divisions WHERE code = 'SP';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Negombo Spare Parts', 'SP-NEG', true FROM divisions WHERE code = 'SP';

-- Workshops
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Colombo Workshop', 'WS-CMB', true FROM divisions WHERE code = 'WS';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Paliyagoda Workshop', 'WS-PLY', true FROM divisions WHERE code = 'WS';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Kurunegala Workshop', 'WS-KRG', true FROM divisions WHERE code = 'WS';

INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Matara Workshop', 'WS-MTR', true FROM divisions WHERE code = 'WS';

-- Body Fabrication
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Kaduwela Fabrication', 'BFD-KDW', true FROM divisions WHERE code = 'BFD';

-- Finance
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Head Office Finance', 'FIN-HO', true FROM divisions WHERE code = 'FIN';

-- HR
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Head Office HR', 'HR-HO', true FROM divisions WHERE code = 'HR';

-- IT
INSERT INTO locations (division_id, name, code, is_active)
SELECT id, 'Head Office IT', 'IT-HO', true FROM divisions WHERE code = 'IT';

-- ============================================================================
-- SEED: users
-- ============================================================================
-- IMPORTANT: This seed file is for reference only when using Supabase Auth
-- Users should be created via auth.users (see create_auth_users.sql)
-- The trigger will automatically populate public.users
-- 
-- If you need to manually insert users (not recommended), they will not have
-- authentication credentials. Use create_auth_users.sql instead.
-- ============================================================================

-- NOTE: When using Supabase Auth, users are created in auth.users first
-- The trigger (on_auth_user_created) will automatically create matching records here
-- See: database/create_auth_users.sql for the proper way to create users
JOIN locations l ON l.division_id = d.id
WHERE d.code = 'FIN' AND l.code = 'FIN-HO';

-- ============================================================================
-- SAMPLE KPI DATA (Optional - for testing)
-- ============================================================================

-- Sample KPI Cycle for emp.sp.1@sathosa.lk (Current Month - Draft)
DO $$
DECLARE
    v_user_id UUID;
    v_cycle_id UUID;
    v_current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    v_current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'emp.sp.1@sathosa.lk';
    
    -- Create cycle
    INSERT INTO kpi_cycles (user_id, month, year, status)
    VALUES (v_user_id, v_current_month, v_current_year, 'draft')
    RETURNING id INTO v_cycle_id;
    
    -- Create sample goals
    INSERT INTO kpi_goals (kpi_cycle_id, description, target_type, target_quantity, target_deadline)
    VALUES 
        (v_cycle_id, 'Increase spare parts sales by 15%', 'quantity', 115.00, NULL),
        (v_cycle_id, 'Process minimum 50 customer orders', 'quantity', 50.00, NULL),
        (v_cycle_id, 'Complete inventory audit', 'deadline', NULL, CURRENT_DATE + INTERVAL '20 days'),
        (v_cycle_id, 'Reduce order processing time to < 2 hours', 'quantity', 2.00, NULL),
        (v_cycle_id, 'Achieve 95% order accuracy rate', 'quantity', 95.00, NULL),
        (v_cycle_id, 'Submit quarterly report', 'deadline', NULL, CURRENT_DATE + INTERVAL '25 days'),
        (v_cycle_id, 'Train 2 new staff members on system', 'quantity', 2.00, NULL),
        (v_cycle_id, 'Resolve 100% of customer complaints within 24h', 'quantity', 100.00, NULL),
        (v_cycle_id, 'Attend monthly division meeting', 'deadline', NULL, CURRENT_DATE + INTERVAL '15 days'),
        (v_cycle_id, 'Maintain zero stock-out incidents', 'quantity', 0.00, NULL);
END $$;

-- Sample KPI Cycle for emp.vs.1@sathosa.lk (Previous Month - Frozen)
DO $$
DECLARE
    v_user_id UUID;
    v_cycle_id UUID;
    v_goal_id UUID;
    v_prev_month INTEGER;
    v_prev_year INTEGER;
BEGIN
    -- Calculate previous month
    IF EXTRACT(MONTH FROM CURRENT_DATE) = 1 THEN
        v_prev_month := 12;
        v_prev_year := EXTRACT(YEAR FROM CURRENT_DATE) - 1;
    ELSE
        v_prev_month := EXTRACT(MONTH FROM CURRENT_DATE) - 1;
        v_prev_year := EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'emp.vs.1@sathosa.lk';
    
    -- Create cycle
    INSERT INTO kpi_cycles (user_id, month, year, status, submitted_at, frozen_at)
    VALUES (v_user_id, v_prev_month, v_prev_year, 'frozen', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '5 days')
    RETURNING id INTO v_cycle_id;
    
    -- Create and complete goals
    INSERT INTO kpi_goals (
        kpi_cycle_id, description, target_type, target_quantity, target_deadline,
        allocated_points, actual_quantity, deadline_completed, is_locked, hod_remarks
    )
    VALUES 
        (v_cycle_id, 'Sell 10 vehicles', 'quantity', 10.00, NULL, 20.00, 12.00, NULL, true, 'Excellent performance'),
        (v_cycle_id, 'Generate 50 qualified leads', 'quantity', 50.00, NULL, 15.00, 48.00, NULL, true, 'Good effort'),
        (v_cycle_id, 'Complete sales training', 'deadline', NULL, CURRENT_DATE - INTERVAL '10 days', 10.00, NULL, true, true, 'Completed on time'),
        (v_cycle_id, 'Achieve customer satisfaction > 90%', 'quantity', 90.00, NULL, 10.00, 92.00, NULL, true, 'Great customer feedback'),
        (v_cycle_id, 'Close 15 test drive appointments', 'quantity', 15.00, NULL, 10.00, 14.00, NULL, true, 'Almost there'),
        (v_cycle_id, 'Submit monthly sales report', 'deadline', NULL, CURRENT_DATE - INTERVAL '15 days', 5.00, NULL, true, true, 'Timely submission'),
        (v_cycle_id, 'Update CRM with 100% of interactions', 'quantity', 100.00, NULL, 10.00, 100.00, NULL, true, 'Perfect compliance'),
        (v_cycle_id, 'Conduct 5 vehicle demonstrations', 'quantity', 5.00, NULL, 10.00, 6.00, NULL, true, 'Exceeded target'),
        (v_cycle_id, 'Attend division meeting', 'deadline', NULL, CURRENT_DATE - INTERVAL '20 days', 5.00, NULL, true, true, 'Active participation'),
        (v_cycle_id, 'Zero customer complaints', 'quantity', 0.00, NULL, 5.00, 0.00, NULL, true, 'Excellent service');
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records
DO $$
DECLARE
    div_count INTEGER;
    loc_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO div_count FROM divisions;
    SELECT COUNT(*) INTO loc_count FROM locations;
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE 'Seed data loaded successfully:';
    RAISE NOTICE '  Divisions: %', div_count;
    RAISE NOTICE '  Locations: %', loc_count;
    RAISE NOTICE '  Users: %', user_count;
END $$;

-- ============================================================================
-- DEFAULT LOGIN CREDENTIALS (FOR TESTING ONLY)
-- ============================================================================
-- 
-- Admin:
--   Email: admin@sathosa.lk
--   Password: Password123!
--
-- Executive:
--   Email: executive@sathosa.lk
--   Password: Password123!
--
-- HOD (Vehicle Sales):
--   Email: hod.vehiclesales@sathosa.lk
--   Password: Password123!
--   Can login as: HOD or Employee
--
-- Employee (Spare Parts):
--   Email: emp.sp.1@sathosa.lk
--   Password: Password123!
--
-- ⚠️ IMPORTANT: Change all passwords immediately in production!
-- ============================================================================
