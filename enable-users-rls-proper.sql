-- ============================================================================
-- RE-ENABLE RLS on users table with proper policy
-- ============================================================================

-- ============================================================================
-- STEP 1: Re-enable RLS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop any existing policies
-- ============================================================================

DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users view own profile" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users view all profiles" ON users;

-- ============================================================================
-- STEP 3: Create proper policies
-- ============================================================================

-- Allow authenticated users to view all user profiles
-- Using true instead of auth.role() to avoid any potential issues
CREATE POLICY "Enable read access for authenticated users" 
    ON users 
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" 
    ON users 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Display success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS re-enabled on users table!';
    RAISE NOTICE '✅ Proper policies in place';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Students should now be visible in Assignment Manager';
END $$;
