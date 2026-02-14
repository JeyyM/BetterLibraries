-- ============================================================================
-- SIMPLE STORAGE SETUP FOR BETTERLIBRARIES
-- Run this AFTER deleting all buckets from the dashboard
-- ============================================================================

-- Create buckets (these will auto-create in database)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-covers', 'book-covers', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-content', 'book-content', true, 52428800, ARRAY['application/pdf', 'application/epub+zip']),
  ('quiz-uploads', 'quiz-uploads', false, 10485760, ARRAY['text/plain', 'application/pdf']),
  ('assignment-resources', 'assignment-resources', false, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to book-covers" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to book-content" ON storage.objects;
DROP POLICY IF EXISTS "Public read book-content" ON storage.objects;
DROP POLICY IF EXISTS "Public read book-covers" ON storage.objects;

-- SIMPLE PUBLIC POLICIES (since we're not using Supabase Auth)
-- Allow public read access to book-covers
CREATE POLICY "Public read book-covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'book-covers');

-- Allow public read access to book-content  
CREATE POLICY "Public read book-content"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'book-content');

-- Allow public upload to book-covers
CREATE POLICY "Public upload to book-covers"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'book-covers');

-- Allow public upload to book-content
CREATE POLICY "Public upload to book-content"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'book-content');

-- Allow public update to book-covers (for upsert)
CREATE POLICY "Public update book-covers"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'book-covers')
  WITH CHECK (bucket_id = 'book-covers');

-- Allow public update to book-content (for upsert)
CREATE POLICY "Public update book-content"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'book-content')
  WITH CHECK (bucket_id = 'book-content');

-- Allow public delete from book-covers
CREATE POLICY "Public delete book-covers"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'book-covers');

-- Allow public delete from book-content
CREATE POLICY "Public delete book-content"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'book-content');
