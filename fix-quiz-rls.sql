-- Fix RLS policy for quiz_items table to allow inserts
-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can insert quiz items" ON quiz_items;

-- Create new policy to allow authenticated users to insert quiz items
CREATE POLICY "Enable insert for authenticated users"
ON quiz_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure authenticated users can update their quiz items
DROP POLICY IF EXISTS "Users can update quiz items" ON quiz_items;

CREATE POLICY "Enable update for authenticated users"
ON quiz_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_items';
