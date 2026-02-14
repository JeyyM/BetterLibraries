-- Verify assignments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'assignments'
ORDER BY ordinal_position;

-- Check if questions column exists specifically
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'questions'
) AS questions_column_exists;

-- Check if total_points column exists specifically
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'total_points'
) AS total_points_column_exists;
