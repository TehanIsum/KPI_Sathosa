-- Create Auth Users for KPI System
-- Run this script in Supabase SQL Editor to create all test users at once

-- This script creates users in auth.users with metadata that the trigger will use
-- to properly populate public.users

-- NOTE: Run this as a single transaction
BEGIN;

-- 1. Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '87396e67-684f-4b6f-8098-46669b7b7912',
  'authenticated',
  'authenticated',
  'admin@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'System Administrator',
    'role', 'admin',
    'is_active', true,
    'is_password_reset_required', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 2. Executive User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d',
  'authenticated',
  'authenticated',
  'executive@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Chief Executive',
    'role', 'executive',
    'is_active', true,
    'is_password_reset_required', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 3. HOD - Vehicle Sales
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2c3d4e5-f6a7-4b5c-9d1e-2f3a4b5c6d7e',
  'authenticated',
  'authenticated',
  'hod.vehiclesales@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Ravi Fernando',
    'role', 'hod',
    'is_active', true,
    'is_password_reset_required', false,
    'division_id', '07b1c8f6-5278-417e-98db-6efac52f37a0',
    'location_id', 'cf2d04db-b48b-4e39-aff4-b03e2fe2db66'
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 4. HOD - Spare Parts
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c3d4e5f6-a7b8-4c5d-9e1f-3a4b5c6d7e8f',
  'authenticated',
  'authenticated',
  'hod.spareparts@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Nimal Silva',
    'role', 'hod',
    'is_active', true,
    'is_password_reset_required', false,
    'division_id', 'a63970db-78df-4443-887c-7c8ab6e4bb8b',
    'location_id', '8cf1a732-3a69-4872-8afb-7b97965b0192'
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 5. Employee - Vehicle Sales Colombo
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd4e5f6a7-b8c9-4d5e-9f1a-4b5c6d7e8f9a',
  'authenticated',
  'authenticated',
  'emp.vs.cmb@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Kasun Perera',
    'role', 'employee',
    'is_active', true,
    'is_password_reset_required', false,
    'division_id', '07b1c8f6-5278-417e-98db-6efac52f37a0',
    'location_id', 'cf2d04db-b48b-4e39-aff4-b03e2fe2db66'
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 6. Employee - Vehicle Sales Kandy
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e5f6a7b8-c9d1-4e5f-9a1b-5c6d7e8f9a0b',
  'authenticated',
  'authenticated',
  'emp.vs.kdy@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Amila Jayasinghe',
    'role', 'employee',
    'is_active', true,
    'is_password_reset_required', false,
    'division_id', '07b1c8f6-5278-417e-98db-6efac52f37a0',
    'location_id', 'd8011b54-8312-4688-993b-dd85af10f1cd'
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 7. Employee - Spare Parts Galle
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f6a7b8c9-d1e2-4f5a-9b1c-6d7e8f9a0b1c',
  'authenticated',
  'authenticated',
  'emp.sp.gal@sathosa.lk',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Dinesh Kumar',
    'role', 'employee',
    'is_active', true,
    'is_password_reset_required', false,
    'division_id', 'a63970db-78df-4443-887c-7c8ab6e4bb8b',
    'location_id', '8cf1a732-3a69-4872-8afb-7b97965b0192'
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify users were created
SELECT id, email, email_confirmed_at, raw_user_meta_data->>'full_name' as name
FROM auth.users
ORDER BY email;

-- Check public.users sync
SELECT id, email, full_name, role, is_active
FROM public.users
ORDER BY email;
