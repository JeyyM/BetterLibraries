-- Create demo teacher and student accounts
-- Note: You'll need to run this in Supabase SQL Editor with proper permissions
-- Or create users manually in Authentication > Users section

-- First, let's create a simple table to track user roles if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Note: You cannot create auth.users directly via SQL
-- You MUST create users through:
-- 1. Supabase Dashboard > Authentication > Users > "Add User"
-- 2. Or use Supabase Admin API

-- After creating users in the dashboard, insert their profiles:
-- Example (replace USER_ID with actual UUID from auth.users):
/*
INSERT INTO user_profiles (id, email, role, full_name) VALUES
  ('USER_ID_HERE', 'teacher@test.com', 'teacher', 'Demo Teacher'),
  ('USER_ID_HERE', 'ms.johnson@school.edu', 'teacher', 'Ms. Johnson'),
  ('USER_ID_HERE', 'mr.brown@school.edu', 'teacher', 'Mr. Brown'),
  ('USER_ID_HERE', 'john.doe@school.edu', 'student', 'John Doe'),
  ('USER_ID_HERE', 'jane.smith@school.edu', 'student', 'Jane Smith');
*/
