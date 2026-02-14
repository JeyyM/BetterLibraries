-- Also disable RLS on student_stats table
ALTER TABLE public.student_stats DISABLE ROW LEVEL SECURITY;

-- Verify all tables have RLS disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('classes', 'class_enrollments', 'quiz_attempts', 'quiz_answers', 'users', 'student_stats');
