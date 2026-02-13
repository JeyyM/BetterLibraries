-- ============================================================================
-- BETTERLIBRARIES ONE-TIME DATA INSERTIONS
-- ============================================================================
-- This file contains temporary SQL for one-time data insertions
-- After running, clear this file for the next insertion
-- ============================================================================

-- ============================================================================
-- AUTOMATED ACCOUNT CREATION
-- ============================================================================
-- Accounts are now created via setup-accounts.js script
-- Run: npm run setup
-- This creates:
--   - 1 Teacher (Jerry Smith)
--   - 20 Students (10 in Section A, 10 in Section B)
--   - All with password: 123
-- ============================================================================

-- NOTE: For authentication, you need to create users via Supabase Auth first
-- Use the Supabase Dashboard or Auth API to create these accounts:
-- Then run this SQL to add the extended user data

-- Step 1: Create auth users first (do this via Supabase Dashboard > Authentication > Add User)
-- OR use Supabase Auth API to create these users with email/password

-- For now, assuming auth.users entries will be created manually or via signup,
-- we'll prepare the INSERT statements with placeholder UUIDs
-- You'll need to replace these UUIDs with actual auth.user IDs after creating accounts

-- ============================================================================
-- OPTION 1: Manual Account Creation (Recommended for Supabase)
-- ============================================================================
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Create these accounts:
-- 1. jerrysmith@email.com / 123 (Teacher)
-- 2. Student accounts with pattern: firstname.lastname@email.com / 123

-- After creating in dashboard, get their UUIDs and update this file

-- ============================================================================
-- OPTION 2: Direct Insert (IF using service role key)
-- ============================================================================
-- WARNING: This bypasses Supabase Auth and should only be used for development

-- Insert Teacher Account
-- First create in auth.users, then extend in public.users
-- You'll need to do this via Supabase client or dashboard

-- For demonstration, here's the SQL structure you'll need:
-- Replace {teacher_uuid} with actual UUID from auth.users after account creation

/*
-- Teacher: Jerry Smith
INSERT INTO public.users (id, email, name, role, school, current_lexile_level, created_at, updated_at, is_active)
VALUES 
  ('{teacher_uuid}', 'jerrysmith@email.com', 'Jerry Smith', 'teacher', 'Washington Elementary', 800, NOW(), NOW(), true);

-- Insert student stats for teacher (optional)
INSERT INTO public.student_stats (user_id, created_at, updated_at)
VALUES ('{teacher_uuid}', NOW(), NOW());
*/

-- ============================================================================
-- PRACTICAL APPROACH: Use these INSERT statements after creating auth accounts
-- ============================================================================

-- After creating auth accounts via Supabase Dashboard/API, run these:
-- Replace the UUIDs with actual IDs from auth.users table

-- Example structure (you'll need actual UUIDs):
-- SELECT id, email FROM auth.users WHERE email IN ('jerrysmith@email.com', 'john.doe@email.com', ...);

-- Section A Students (10 students)
-- john.doe@email.com
-- jane.smith@email.com  
-- michael.johnson@email.com
-- emily.williams@email.com
-- david.brown@email.com
-- sarah.jones@email.com
-- james.garcia@email.com
-- linda.martinez@email.com
-- robert.rodriguez@email.com
-- mary.wilson@email.com

-- Section B Students (10 students)
-- william.anderson@email.com
-- patricia.taylor@email.com
-- richard.thomas@email.com
-- jennifer.moore@email.com
-- charles.jackson@email.com
-- elizabeth.white@email.com
-- joseph.harris@email.com
-- susan.martin@email.com
-- thomas.thompson@email.com
-- jessica.lee@email.com

-- ============================================================================
-- SQL TEMPLATE: Run this AFTER creating auth users
-- ============================================================================

-- Step 1: Get teacher UUID
-- Run in Supabase SQL Editor:
-- SELECT id FROM auth.users WHERE email = 'jerrysmith@email.com';

-- Step 2: Create teacher in public.users (replace {teacher_id} with actual UUID)
/*
INSERT INTO public.users (id, email, name, role, school, created_at, updated_at, is_active)
VALUES 
  ('{teacher_id}', 'jerrysmith@email.com', 'Jerry Smith', 'teacher', 'Washington Elementary', NOW(), NOW(), true);
*/

-- Step 3: Create classes
/*
INSERT INTO public.classes (id, name, teacher_id, school, grade_level, academic_year, created_at, updated_at, is_active)
VALUES 
  (gen_random_uuid(), 'Section A', '{teacher_id}', 'Washington Elementary', '5th Grade', '2025-2026', NOW(), NOW(), true),
  (gen_random_uuid(), 'Section B', '{teacher_id}', 'Washington Elementary', '5th Grade', '2025-2026', NOW(), NOW(), true);
*/

-- Step 4: Get class IDs
-- SELECT id, name FROM public.classes WHERE teacher_id = '{teacher_id}';

-- Step 5: Insert students (replace UUIDs with actual auth.user IDs)
/*
INSERT INTO public.users (id, email, name, role, school, current_lexile_level, created_at, updated_at, is_active)
VALUES 
  -- Section A Students
  ('{student_1_id}', 'john.doe@email.com', 'John Doe', 'student', 'Washington Elementary', 450, NOW(), NOW(), true),
  ('{student_2_id}', 'jane.smith@email.com', 'Jane Smith', 'student', 'Washington Elementary', 520, NOW(), NOW(), true),
  ('{student_3_id}', 'michael.johnson@email.com', 'Michael Johnson', 'student', 'Washington Elementary', 480, NOW(), NOW(), true),
  ('{student_4_id}', 'emily.williams@email.com', 'Emily Williams', 'student', 'Washington Elementary', 540, NOW(), NOW(), true),
  ('{student_5_id}', 'david.brown@email.com', 'David Brown', 'student', 'Washington Elementary', 460, NOW(), NOW(), true),
  ('{student_6_id}', 'sarah.jones@email.com', 'Sarah Jones', 'student', 'Washington Elementary', 510, NOW(), NOW(), true),
  ('{student_7_id}', 'james.garcia@email.com', 'James Garcia', 'student', 'Washington Elementary', 490, NOW(), NOW(), true),
  ('{student_8_id}', 'linda.martinez@email.com', 'Linda Martinez', 'student', 'Washington Elementary', 530, NOW(), NOW(), true),
  ('{student_9_id}', 'robert.rodriguez@email.com', 'Robert Rodriguez', 'student', 'Washington Elementary', 470, NOW(), NOW(), true),
  ('{student_10_id}', 'mary.wilson@email.com', 'Mary Wilson', 'student', 'Washington Elementary', 500, NOW(), NOW(), true),
  
  -- Section B Students
  ('{student_11_id}', 'william.anderson@email.com', 'William Anderson', 'student', 'Washington Elementary', 440, NOW(), NOW(), true),
  ('{student_12_id}', 'patricia.taylor@email.com', 'Patricia Taylor', 'student', 'Washington Elementary', 515, NOW(), NOW(), true),
  ('{student_13_id}', 'richard.thomas@email.com', 'Richard Thomas', 'student', 'Washington Elementary', 475, NOW(), NOW(), true),
  ('{student_14_id}', 'jennifer.moore@email.com', 'Jennifer Moore', 'student', 'Washington Elementary', 535, NOW(), NOW(), true),
  ('{student_15_id}', 'charles.jackson@email.com', 'Charles Jackson', 'student', 'Washington Elementary', 455, NOW(), NOW(), true),
  ('{student_16_id}', 'elizabeth.white@email.com', 'Elizabeth White', 'student', 'Washington Elementary', 525, NOW(), NOW(), true),
  ('{student_17_id}', 'joseph.harris@email.com', 'Joseph Harris', 'student', 'Washington Elementary', 485, NOW(), NOW(), true),
  ('{student_18_id}', 'susan.martin@email.com', 'Susan Martin', 'student', 'Washington Elementary', 505, NOW(), NOW(), true),
  ('{student_19_id}', 'thomas.thompson@email.com', 'Thomas Thompson', 'student', 'Washington Elementary', 465, NOW(), NOW(), true),
  ('{student_20_id}', 'jessica.lee@email.com', 'Jessica Lee', 'student', 'Washington Elementary', 495, NOW(), NOW(), true);
*/

-- Step 6: Create student stats for each student
/*
INSERT INTO public.student_stats (user_id, books_read, quizzes_completed, average_score, streak_days, total_points, created_at, updated_at)
SELECT 
  id,
  0, -- books_read
  0, -- quizzes_completed
  0.00, -- average_score
  0, -- streak_days
  0, -- total_points
  NOW(),
  NOW()
FROM public.users
WHERE role = 'student';
*/

-- Step 7: Enroll students in classes
/*
-- Enroll Section A students (get section_a_id from step 4)
INSERT INTO public.class_enrollments (class_id, student_id, enrolled_at, status)
VALUES 
  ('{section_a_id}', '{student_1_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_2_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_3_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_4_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_5_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_6_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_7_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_8_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_9_id}', NOW(), 'active'),
  ('{section_a_id}', '{student_10_id}', NOW(), 'active');

-- Enroll Section B students (get section_b_id from step 4)
INSERT INTO public.class_enrollments (class_id, student_id, enrolled_at, status)
VALUES 
  ('{section_b_id}', '{student_11_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_12_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_13_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_14_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_15_id}', NOW(), 'active'),
  ('{section_b_id}', '{section_b_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_17_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_18_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_19_id}', NOW(), 'active'),
  ('{section_b_id}', '{student_20_id}', NOW(), 'active');
*/

-- ============================================================================
-- QUICK REFERENCE: Account Creation via Supabase Client (JavaScript)
-- ============================================================================
/*
// Use this in your app or via Supabase CLI to create accounts programmatically

const accounts = [
  { email: 'jerrysmith@email.com', password: '123', name: 'Jerry Smith', role: 'teacher' },
  { email: 'john.doe@email.com', password: '123', name: 'John Doe', role: 'student' },
  { email: 'jane.smith@email.com', password: '123', name: 'Jane Smith', role: 'student' },
  // ... etc
];

for (const account of accounts) {
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
  });
  
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      email: account.email,
      name: account.name,
      role: account.role,
      school: 'Washington Elementary',
    });
  }
}
*/
