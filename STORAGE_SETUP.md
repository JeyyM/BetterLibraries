# Storage Bucket Setup Instructions

## The Problem
The Add Book feature is failing to upload files because the storage buckets either:
1. Don't exist, or
2. Have incorrect permissions (RLS policies blocking uploads)

## Solution: Create Buckets in Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com
2. Go to your project
3. Click on **Storage** in the left sidebar

### Step 2: Create `book-content` Bucket
1. Click **"New bucket"**
2. Name: `book-content`
3. **Make it Public**: ✅ Check the box
4. Click **Create bucket**

### Step 3: Create `book-covers` Bucket
1. Click **"New bucket"** again
2. Name: `book-covers`
3. **Make it Public**: ✅ Check the box
4. Click **Create bucket**

### Step 4: Verify Buckets Are Public
For each bucket:
1. Click on the bucket name
2. Click the settings (gear icon)
3. Under "Public bucket", make sure it says **Public** (not Private)
4. If it says Private, toggle it to Public

## Alternative: SQL Command (Run in SQL Editor)

If you prefer to use SQL, go to the **SQL Editor** in Supabase and run:

```sql
-- Create book-content bucket
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

-- Create book-covers bucket
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

-- Set up RLS policies to allow uploads
CREATE POLICY "Allow public uploads to book-content"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'book-content');

CREATE POLICY "Allow public uploads to book-covers"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Allow public reads from book-content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-content');

CREATE POLICY "Allow public reads from book-covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');
```

## Test After Setup

1. Go back to the app
2. Login as a teacher
3. Click "Add Book"
4. Fill in a title
5. Upload a PDF and image
6. Click "Add Book to Library"
7. It should work now! ✅

## Troubleshooting

If you still get errors:

**Error: "Bucket not found"**
- Make sure buckets are created with exact names: `book-content` and `book-covers`

**Error: "Row level security policy violation"**
- Make sure buckets are set to **Public**
- Or run the RLS policy SQL commands above

**Error: "File too large"**
- File size limit is 50MB
- Try with a smaller PDF

**Error: "Invalid file type"**
- book-content only accepts PDFs
- book-covers only accepts images (JPG, PNG, WebP)
