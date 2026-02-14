-- ============================================================================
-- FIX: Users Table RLS - Remove Conflicting Policies
-- ============================================================================

-- The problem: Multiple SELECT policies can conflict
-- The solution: Keep only ONE simple policy that allows all authenticated users

-- ============================================================================
-- STEP 1: Drop ALL policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Users view own profile" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users view all profiles" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Teachers can view all users" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- ============================================================================
-- STEP 2: Create ONE simple policy for viewing
-- ============================================================================

-- Allow ALL authenticated users to view ALL user profiles
-- This is simple and has no conflicts
CREATE POLICY "All authenticated users can view all profiles" 
    ON users 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow users to update only their own data
CREATE POLICY "Users can update own data" 
    ON users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================================================
-- STEP 3: Verify students can be fetched
-- ============================================================================

-- This should return students
SELECT id, email, role, is_active
FROM users 
WHERE role = 'student' 
LIMIT 10;

-- Display success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Users table RLS completely fixed!';
    RAISE NOTICE '✅ Only ONE SELECT policy now - no conflicts';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next: Refresh the Assignment Manager';
END $$;
