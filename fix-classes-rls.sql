-- Check and Fix RLS Policies for Classes Table
-- This ensures the app can read classes data

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('classes', 'class_enrollments', 'users')
AND schemaname = 'public';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Command",
    qual as "USING Expression"
FROM pg_policies
WHERE tablename IN ('classes', 'class_enrollments')
AND schemaname = 'public';

-- ============================================================================
-- FIX: Add policies to allow reading classes
-- ============================================================================

-- Allow everyone (authenticated users) to read classes
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;
CREATE POLICY "Anyone can view active classes" 
    ON classes 
    FOR SELECT 
    USING (is_active = true);

-- Allow teachers to manage their classes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
CREATE POLICY "Teachers can manage their own classes" 
    ON classes 
    FOR ALL 
    USING (
        auth.uid() = teacher_id 
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'teacher'
        )
    );

-- Allow reading class enrollments
DROP POLICY IF EXISTS "Anyone can view class enrollments" ON class_enrollments;
CREATE POLICY "Anyone can view class enrollments" 
    ON class_enrollments 
    FOR SELECT 
    USING (true);

-- Display confirmation
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS Policies updated!';
    RAISE NOTICE 'Classes table should now be readable by authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE 'Test by running: SELECT * FROM classes WHERE is_active = true;';
END $$;
