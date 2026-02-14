-- ============================================================================
-- FIX: Infinite Recursion in Users Table RLS Policies
-- ============================================================================

-- The problem: Policies on 'users' table that reference 'users' cause recursion
-- The solution: Use auth.uid() directly without querying the users table

-- ============================================================================
-- STEP 1: Drop all existing policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Teachers can view all users" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- Policy 1: Users can view their OWN data (no recursion)
CREATE POLICY "Users view own profile" 
    ON users 
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Users can update their OWN data (no recursion)
CREATE POLICY "Users update own profile" 
    ON users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Policy 3: ALL authenticated users can view other users' basic info
-- This is needed so teachers can see students and vice versa
-- No subquery - just check if user is authenticated
CREATE POLICY "Authenticated users view all profiles" 
    ON users 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 3: Test the fix
-- ============================================================================

-- This should work now without recursion
SELECT id, email, role 
FROM users 
WHERE role = 'student' 
LIMIT 5;

-- Display success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Users table RLS policies fixed!';
    RAISE NOTICE '✅ Infinite recursion eliminated';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next: Try fetching students in the app';
END $$;
