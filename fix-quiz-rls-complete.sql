-- First, check current policies
SELECT * FROM pg_policies WHERE tablename = 'quiz_items';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON quiz_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON quiz_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON quiz_items;
DROP POLICY IF EXISTS "Users can view quiz items" ON quiz_items;

-- Create comprehensive policies for quiz_items

-- Allow anyone to read quiz items
CREATE POLICY "Allow public read access"
ON quiz_items
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert quiz items
CREATE POLICY "Allow authenticated insert"
ON quiz_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update quiz items
CREATE POLICY "Allow authenticated update"
ON quiz_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete quiz items
CREATE POLICY "Allow authenticated delete"
ON quiz_items
FOR DELETE
TO authenticated
USING (true);

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quiz_items';
