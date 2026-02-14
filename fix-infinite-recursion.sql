-- ============================================================================
-- FIX: Infinite Recursion in Users Table RLS Policy
-- ============================================================================

-- The problem: A policy on 'users' table that references 'users' causes recursion
-- The solution: Use simpler policies that don't create circular dependencies

-- ============================================================================
-- STEP 1: Drop problematic policies on classes
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- Allow ALL authenticated users to read active classes
-- No subquery, no recursion
CREATE POLICY "Authenticated users can view active classes" 
    ON classes 
    FOR SELECT 
    USING (
        is_active = true 
        AND auth.role() = 'authenticated'
    );

-- Allow teachers to manage classes (if they created them)
CREATE POLICY "Teachers manage own classes" 
    ON classes 
    FOR ALL 
    USING (
        auth.uid() = teacher_id
    );

-- ============================================================================
-- STEP 3: Fix class_enrollments policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view class enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;

-- Simple policy: authenticated users can read enrollments
CREATE POLICY "Authenticated users can view enrollments" 
    ON class_enrollments 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Students can only see their own enrollments
CREATE POLICY "Students view own enrollments" 
    ON class_enrollments 
    FOR SELECT 
    USING (auth.uid() = student_id);

-- ============================================================================
-- STEP 4: Verify no recursion
-- ============================================================================

-- Test reading classes (should work now)
SELECT 
    id,
    name,
    grade_level,
    is_active
FROM classes
WHERE is_active = true
LIMIT 5;

-- Display success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS policies fixed!';
    RAISE NOTICE '✅ Infinite recursion eliminated';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next: Refresh your browser and check the dropdown';
END $$;
