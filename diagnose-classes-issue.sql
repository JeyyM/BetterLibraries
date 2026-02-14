-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Classes and Students Data
-- Run this FIRST to see what data exists before making changes
-- ============================================================================

-- ============================================================================
-- CHECK 1: Do classes exist in the database?
-- ============================================================================
SELECT '=== CHECK 1: Classes Table ===' as check;

SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_classes,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_classes
FROM classes;

-- Show all classes
SELECT 
    id,
    name,
    grade_level,
    teacher_id,
    is_active,
    created_at
FROM classes
ORDER BY created_at DESC;

-- ============================================================================
-- CHECK 2: Do students exist?
-- ============================================================================
SELECT '=== CHECK 2: Students ===' as check;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teachers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM users;

-- Show some students
SELECT 
    id,
    name,
    email,
    role,
    is_active
FROM users
WHERE role = 'student'
LIMIT 10;

-- ============================================================================
-- CHECK 3: Are students enrolled in classes?
-- ============================================================================
SELECT '=== CHECK 3: Class Enrollments ===' as check;

SELECT COUNT(*) as total_enrollments
FROM class_enrollments;

-- Show enrollments with details
SELECT 
    ce.id,
    c.name as class_name,
    u.name as student_name,
    ce.status,
    ce.enrolled_at
FROM class_enrollments ce
LEFT JOIN classes c ON ce.class_id = c.id
LEFT JOIN users u ON ce.student_id = u.id
ORDER BY c.name, u.name
LIMIT 20;

-- ============================================================================
-- CHECK 4: RLS Policies - Are they blocking reads?
-- ============================================================================
SELECT '=== CHECK 4: RLS Status ===' as check;

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('classes', 'class_enrollments', 'users')
AND schemaname = 'public';

-- Show existing policies
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles
FROM pg_policies
WHERE tablename IN ('classes', 'class_enrollments')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- CHECK 5: Can we read classes directly?
-- ============================================================================
SELECT '=== CHECK 5: Direct Read Test ===' as check;

-- Try to read classes as if we're the app
SELECT 
    id,
    name,
    grade_level,
    is_active
FROM classes
WHERE is_active = true
ORDER BY name;

-- ============================================================================
-- CHECK 6: Test the exact query the app uses
-- ============================================================================
SELECT '=== CHECK 6: App Query Simulation ===' as check;

-- This is what your React app is trying to fetch
SELECT *
FROM classes
WHERE is_active = true
ORDER BY name;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
DECLARE
    class_count INT;
    student_count INT;
    enrollment_count INT;
    rls_enabled BOOLEAN;
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO class_count FROM classes WHERE is_active = true;
    SELECT COUNT(*) INTO student_count FROM users WHERE role = 'student' AND is_active = true;
    SELECT COUNT(*) INTO enrollment_count FROM class_enrollments WHERE status = 'active';
    SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'classes' AND schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'classes';
    
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                    DIAGNOSTIC SUMMARY                    ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Data Status:';
    RAISE NOTICE '   ✓ Active Classes: %', class_count;
    RAISE NOTICE '   ✓ Active Students: %', student_count;
    RAISE NOTICE '   ✓ Active Enrollments: %', enrollment_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security Status:';
    RAISE NOTICE '   ✓ RLS Enabled on classes: %', rls_enabled;
    RAISE NOTICE '   ✓ Policies on classes: %', policy_count;
    RAISE NOTICE '';
    
    IF class_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM: No active classes found!';
        RAISE NOTICE '   → Run setup-classes-quick.sql to create classes';
    ELSIF class_count > 0 THEN
        RAISE NOTICE '✅ Classes exist in database';
        
        IF rls_enabled = true AND policy_count = 0 THEN
            RAISE NOTICE '❌ PROBLEM: RLS is ON but no policies exist!';
            RAISE NOTICE '   → Run fix-classes-rls.sql to add read policies';
        ELSIF rls_enabled = true AND policy_count > 0 THEN
            RAISE NOTICE '✅ RLS is configured';
            RAISE NOTICE '⚠️  Check if policies allow SELECT';
        ELSE
            RAISE NOTICE '✅ RLS is OFF - should be readable';
        END IF;
    END IF;
    
    IF student_count = 0 THEN
        RAISE NOTICE '⚠️  WARNING: No students found';
        RAISE NOTICE '   → Create students in Supabase Auth Dashboard';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Next Steps:';
    IF class_count = 0 THEN
        RAISE NOTICE '   1. Run setup-classes-quick.sql';
        RAISE NOTICE '   2. Run fix-classes-rls.sql';
        RAISE NOTICE '   3. Refresh browser';
    ELSIF rls_enabled = true AND policy_count = 0 THEN
        RAISE NOTICE '   1. Run fix-classes-rls.sql';
        RAISE NOTICE '   2. Refresh browser';
    ELSE
        RAISE NOTICE '   1. Check browser console for errors';
        RAISE NOTICE '   2. Verify Supabase API key is correct';
        RAISE NOTICE '   3. Check Network tab for failed requests';
    END IF;
    RAISE NOTICE '';
END $$;
