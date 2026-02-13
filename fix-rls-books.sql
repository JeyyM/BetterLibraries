-- Fix RLS policy issues for books table
-- This script disables RLS for the books table since it's public read-only data

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Anyone can view active books" ON books;
DROP POLICY IF EXISTS "Public books are viewable by everyone" ON books;

-- Disable RLS on books table (it's public data anyway)
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use a simple policy without recursion
-- ALTER TABLE books ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON books
--   FOR SELECT
--   USING (is_active = true);
