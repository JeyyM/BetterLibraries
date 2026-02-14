-- Quick Setup: Create Demo Classes and Check Student Assignment
-- This script will help you diagnose and fix the class dropdown issue

-- ============================================================================
-- STEP 1: Check Current State
-- ============================================================================

-- Check if classes exist
DO $$
DECLARE
    class_count INT;
    student_count INT;
    enrollment_count INT;
BEGIN
    SELECT COUNT(*) INTO class_count FROM classes WHERE is_active = true;
    SELECT COUNT(*) INTO student_count FROM users WHERE role = 'student' AND is_active = true;
    SELECT COUNT(*) INTO enrollment_count FROM class_enrollments WHERE status = 'active';
    
    RAISE NOTICE '📊 Current Database State:';
    RAISE NOTICE '   Classes: %', class_count;
    RAISE NOTICE '   Students: %', student_count;
    RAISE NOTICE '   Enrollments: %', enrollment_count;
    RAISE NOTICE '';
    
    IF class_count = 0 THEN
        RAISE NOTICE '⚠️  No classes found - will create demo classes';
    END IF;
    
    IF student_count = 0 THEN
        RAISE NOTICE '⚠️  No students found - you need to create student accounts in Supabase Auth';
        RAISE NOTICE '   Go to: Supabase Dashboard > Authentication > Users > Add User';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create Demo Classes (if none exist)
-- ============================================================================

-- Create demo classes - you can modify these as needed
INSERT INTO classes (name, school, grade_level, academic_year, description, is_active, created_at, updated_at)
SELECT 
    name, 
    'Washington Middle School', 
    grade_level, 
    '2025-2026',
    'Demo class for testing',
    true,
    NOW(),
    NOW()
FROM (VALUES 
    ('Grade 7A - English', '7th Grade'),
    ('Grade 7B - English', '7th Grade'),
    ('Grade 8A - Literature', '8th Grade'),
    ('Grade 6A - Reading', '6th Grade')
) AS demo_classes(name, grade_level)
WHERE NOT EXISTS (
    SELECT 1 FROM classes WHERE classes.name = demo_classes.name
);

-- ============================================================================
-- STEP 3: Auto-Enroll Students (if any exist)
-- ============================================================================

DO $$
DECLARE
    class_7b_id UUID;
    student_count INT;
    enrolled_count INT := 0;
BEGIN
    -- Get Grade 7B class ID
    SELECT id INTO class_7b_id FROM classes WHERE name = 'Grade 7B - English' LIMIT 1;
    
    -- Count students
    SELECT COUNT(*) INTO student_count FROM users WHERE role = 'student' AND is_active = true;
    
    IF student_count > 0 AND class_7b_id IS NOT NULL THEN
        -- Enroll all students into Grade 7B as default
        INSERT INTO class_enrollments (class_id, student_id, enrolled_at, status)
        SELECT 
            class_7b_id,
            u.id,
            NOW(),
            'active'
        FROM users u
        WHERE u.role = 'student' AND u.is_active = true
        ON CONFLICT (class_id, student_id) DO NOTHING;
        
        -- Count successful enrollments
        SELECT COUNT(*) INTO enrolled_count 
        FROM class_enrollments 
        WHERE class_id = class_7b_id AND status = 'active';
        
        RAISE NOTICE '✅ Enrolled % students into Grade 7B - English', enrolled_count;
    ELSIF student_count = 0 THEN
        RAISE NOTICE '⚠️  No students to enroll. Create student users first.';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Display Final Summary
-- ============================================================================

SELECT 
    c.name as "Class Name",
    c.grade_level as "Grade",
    COUNT(ce.student_id) as "Enrolled Students",
    c.is_active as "Active"
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
GROUP BY c.id, c.name, c.grade_level, c.is_active
ORDER BY c.name;

-- ============================================================================
-- STEP 5: Verify Classes are Visible to API
-- ============================================================================

-- Show what the app will see
SELECT 
    id,
    name,
    grade_level,
    is_active,
    created_at
FROM classes
WHERE is_active = true
ORDER BY name;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '✅ Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next Steps:';
    RAISE NOTICE '1. Refresh your browser (the app should now show classes in dropdown)';
    RAISE NOTICE '2. If dropdown is still empty, check browser console for errors';
    RAISE NOTICE '3. Verify RLS policies allow reading classes table';
    RAISE NOTICE '';
END $$;
