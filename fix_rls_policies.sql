-- Fix RLS policies for teacher dashboard queries
-- Run this in Supabase SQL Editor

-- First, drop all existing policies that might conflict
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can view quiz attempts from their students" ON quiz_attempts;
DROP POLICY IF EXISTS "Teachers can view quiz answers from their students" ON quiz_answers;
DROP POLICY IF EXISTS "Teachers can update quiz attempts for their students" ON quiz_attempts;
DROP POLICY IF EXISTS "Teachers can view their students' info" ON users;

-- Enable RLS on tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Allow teachers to read their own classes
CREATE POLICY "Teachers can view their own classes"
ON classes
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- Allow teachers to read students in their classes
CREATE POLICY "Teachers can view students in their classes"
ON class_enrollments
FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);

-- Allow teachers to read quiz attempts for their class students
CREATE POLICY "Teachers can view quiz attempts from their students"
ON quiz_attempts
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM class_enrollments WHERE class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  )
);

-- Allow teachers to view quiz answers from their students
CREATE POLICY "Teachers can view quiz answers from their students"
ON quiz_answers
FOR SELECT
TO authenticated
USING (
  attempt_id IN (
    SELECT id FROM quiz_attempts WHERE student_id IN (
      SELECT student_id FROM class_enrollments WHERE class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
      )
    )
  )
);

-- Allow teachers to update quiz attempts (for grading)
CREATE POLICY "Teachers can update quiz attempts for their students"
ON quiz_attempts
FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM class_enrollments WHERE class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  )
)
WITH CHECK (
  student_id IN (
    SELECT student_id FROM class_enrollments WHERE class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  )
);

-- Allow teachers to read user info for their students
CREATE POLICY "Teachers can view their students' info"
ON users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id FROM class_enrollments WHERE class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  )
  OR
  id = auth.uid()
);

-- Allow students to view their own enrollments
CREATE POLICY "Students can view their own enrollments"
ON class_enrollments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Allow students to view classes they're enrolled in
CREATE POLICY "Students can view their classes"
ON classes
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT class_id FROM class_enrollments WHERE student_id = auth.uid()
  )
);
