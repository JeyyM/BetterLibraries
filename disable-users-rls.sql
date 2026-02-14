-- ============================================================================
-- TEMPORARY: Disable RLS on users table for debugging
-- ============================================================================

-- This will allow you to see if RLS is the problem
-- WARNING: This makes the users table completely public!
-- Only use for testing, then re-enable RLS after

-- ============================================================================
-- STEP 1: Disable RLS entirely
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Test if students can be fetched now
-- ============================================================================

SELECT id, email, role
FROM users 
WHERE role = 'student' 
LIMIT 10;

-- Display warning
DO $$ 
BEGIN 
    RAISE NOTICE '⚠️  RLS DISABLED on users table!';
    RAISE NOTICE '⚠️  This is TEMPORARY for debugging only';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Refresh Assignment Manager and check if students appear';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  After confirming, re-enable RLS!';
END $$;
