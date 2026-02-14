-- Comprehensive RLS disable for all tables used in the application
-- Run this in Supabase SQL Editor to ensure all queries work

-- Disable RLS on all relevant tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_items DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might interfere
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.books;
DROP POLICY IF EXISTS "Enable read access for enrolled students" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reading_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Enable read for all users" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Enable update for own records" ON public.quiz_attempts;

-- Verify RLS is disabled on all tables
SELECT 
    schemaname,
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 
    'classes', 
    'class_enrollments', 
    'quiz_attempts', 
    'quiz_answers', 
    'student_stats',
    'books',
    'reading_progress',
    'assignments',
    'assignment_submissions',
    'quiz_items'
)
ORDER BY tablename;

-- Also check if tables exist
SELECT 
    'Table exists: ' || table_name as info
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'classes', 
    'class_enrollments', 
    'quiz_attempts', 
    'quiz_answers', 
    'student_stats',
    'books',
    'reading_progress',
    'assignments',
    'assignment_submissions',
    'quiz_items'
)
ORDER BY table_name;
