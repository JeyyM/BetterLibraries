-- Create Demo Classes and Student Enrollments
-- Run this to populate your database with sample data

-- First, check if we have a teacher user to assign classes to
-- If not, we'll use a system user or you can replace with your teacher ID

-- Create demo classes
INSERT INTO classes (id, name, teacher_id, school, grade_level, academic_year, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Grade 7A - English', NULL, 'Washington Middle School', '7th Grade', '2025-2026', true, NOW(), NOW()),
    (gen_random_uuid(), 'Grade 7B - English', NULL, 'Washington Middle School', '7th Grade', '2025-2026', true, NOW(), NOW()),
    (gen_random_uuid(), 'Grade 8A - Literature', NULL, 'Washington Middle School', '8th Grade', '2025-2026', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the class IDs we just created
DO $$
DECLARE
    class_7a UUID;
    class_7b UUID;
    class_8a UUID;
    student_count INT := 0;
BEGIN
    -- Get class IDs
    SELECT id INTO class_7a FROM classes WHERE name = 'Grade 7A - English' LIMIT 1;
    SELECT id INTO class_7b FROM classes WHERE name = 'Grade 7B - English' LIMIT 1;
    SELECT id INTO class_8a FROM classes WHERE name = 'Grade 8A - Literature' LIMIT 1;
    
    -- Check how many students exist
    SELECT COUNT(*) INTO student_count FROM users WHERE role = 'student';
    
    IF student_count = 0 THEN
        RAISE NOTICE 'No students found in database. You need to create student users first.';
        RAISE NOTICE 'Run create-demo-users.sql or create students through your app.';
    ELSE
        -- Enroll students in classes
        -- This will enroll all students into Grade 7B as an example
        -- You can modify this to distribute students across classes
        
        INSERT INTO class_enrollments (id, class_id, student_id, enrolled_at, status)
        SELECT 
            gen_random_uuid(),
            class_7b, -- Enrolling in Grade 7B
            id,
            NOW(),
            'active'
        FROM users 
        WHERE role = 'student' AND is_active = true
        ON CONFLICT (class_id, student_id) DO NOTHING;
        
        RAISE NOTICE 'Enrolled % students into Grade 7B - English', student_count;
    END IF;
END $$;

-- Display results
SELECT 
    c.name as class_name,
    c.grade_level,
    COUNT(ce.student_id) as enrolled_students
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.grade_level
ORDER BY c.name;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Demo classes created successfully!';
    RAISE NOTICE 'You can now select these classes in the Assignment Lab.';
END $$;
