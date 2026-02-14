-- Temporarily disable RLS for teacher dashboard queries
-- WARNING: Only use this in development! Re-enable RLS in production with proper policies

-- First, check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('classes', 'class_enrollments', 'quiz_attempts', 'quiz_answers', 'users');

-- Drop all existing policies first
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
DROP POLICY IF EXISTS "Students can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can view quiz attempts from their students" ON quiz_attempts;
DROP POLICY IF EXISTS "Teachers can update quiz attempts for their students" ON quiz_attempts;
DROP POLICY IF EXISTS "Teachers can view quiz answers from their students" ON quiz_answers;
DROP POLICY IF EXISTS "Teachers can view their students' info" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Now disable RLS on all tables
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('classes', 'class_enrollments', 'quiz_attempts', 'quiz_answers', 'users');

-- You should see 'false' for all rowsecurity columns

