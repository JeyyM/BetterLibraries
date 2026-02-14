-- Check if classes exist
SELECT 
    id,
    name,
    grade_level,
    teacher_id,
    is_active,
    created_at
FROM classes
ORDER BY name;

-- Check if students exist
SELECT 
    id,
    name,
    email,
    role,
    is_active
FROM users
WHERE role = 'student'
ORDER BY name;

-- Check class enrollments
SELECT 
    ce.id,
    c.name as class_name,
    u.name as student_name,
    ce.status,
    ce.enrolled_at
FROM class_enrollments ce
JOIN classes c ON ce.class_id = c.id
JOIN users u ON ce.student_id = u.id
ORDER BY c.name, u.name;

-- Count summary
SELECT 
    'Classes' as type,
    COUNT(*) as count
FROM classes
WHERE is_active = true
UNION ALL
SELECT 
    'Students' as type,
    COUNT(*) as count
FROM users
WHERE role = 'student' AND is_active = true
UNION ALL
SELECT 
    'Enrollments' as type,
    COUNT(*) as count
FROM class_enrollments
WHERE status = 'active';
