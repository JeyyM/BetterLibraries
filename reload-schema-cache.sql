-- Reload the PostgREST schema cache
-- This tells Supabase API to recognize the new columns

NOTIFY pgrst, 'reload schema';

-- Alternatively, you can use this function:
SELECT pg_notify('pgrst', 'reload schema');

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
AND column_name IN ('questions', 'total_points');

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Schema cache reload requested!';
    RAISE NOTICE 'Wait 5-10 seconds, then try publishing your assignment again.';
END $$;
