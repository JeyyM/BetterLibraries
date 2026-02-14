-- ============================================================================
-- BETTERLIBRARIES DATABASE MODIFICATIONS LOG
-- ============================================================================
-- This file tracks all schema changes and data modifications after initial setup
-- Each modification should include:
--   - Date of change
--   - Description of what changed
--   - Migration SQL (both UP and DOWN when possible)
--   - Author/reason for change
-- ============================================================================

-- ============================================================================
-- MODIFICATION LOG
-- ============================================================================
/*
Date: February 13, 2026
Author: Initial Setup
Description: Base schema deployed from schema.sql
Changes: All tables, views, functions, triggers, and storage buckets created
*/

-- ============================================================================
-- FUTURE MODIFICATIONS GO BELOW THIS LINE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Date: February 13, 2026
-- Author: System
-- Description: Add reading progress tracking table to persist user's current page per book
-- ----------------------------------------------------------------------------

-- Migration UP (apply change)
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, book_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON reading_progress(user_email, book_id);

-- Migration DOWN (rollback change)
-- DROP TABLE IF EXISTS reading_progress CASCADE;
-- DROP INDEX IF EXISTS idx_reading_progress_user_book;

-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Date: February 13, 2026
-- Author: System
-- Description: Create and configure storage buckets for book uploads
-- ----------------------------------------------------------------------------

-- Migration UP (apply change)

-- Create book-content bucket (for PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-content',
  'book-content',
  true,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Create book-covers bucket (for cover images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads to book-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from book-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to book-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from book-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from book-covers" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public uploads to book-content
CREATE POLICY "Allow public uploads to book-content"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'book-content');

-- Allow public uploads to book-covers
CREATE POLICY "Allow public uploads to book-covers"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'book-covers');

-- Allow public reads from book-content
CREATE POLICY "Allow public reads from book-content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-content');

-- Allow public reads from book-covers
CREATE POLICY "Allow public reads from book-covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');

-- Allow public updates (for upsert functionality)
CREATE POLICY "Allow public updates to book-content"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'book-content')
WITH CHECK (bucket_id = 'book-content');

CREATE POLICY "Allow public updates to book-covers"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'book-covers')
WITH CHECK (bucket_id = 'book-covers');

-- Allow public deletes (for cleanup)
CREATE POLICY "Allow public deletes from book-content"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'book-content');

CREATE POLICY "Allow public deletes from book-covers"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'book-covers');

-- Migration DOWN (rollback change)
-- DROP POLICY IF EXISTS "Allow public uploads to book-content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public uploads to book-covers" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public reads from book-content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public reads from book-covers" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public updates to book-content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public updates to book-covers" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id IN ('book-content', 'book-covers');

-- ----------------------------------------------------------------------------

-- Example format for adding modifications:
/*
-- ----------------------------------------------------------------------------
-- Date: [Date]
-- Author: [Your Name]
-- Description: [What changed and why]
-- ----------------------------------------------------------------------------

-- Migration UP (apply change)
-- [Your SQL here]

-- Migration DOWN (rollback change)
-- [Rollback SQL here]

-- ----------------------------------------------------------------------------
*/
