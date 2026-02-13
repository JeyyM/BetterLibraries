# BetterLibraries - Supabase Setup Guide

## 📋 Overview

This guide walks you through setting up the BetterLibraries database on Supabase, including the built-in CDN for file storage.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `betterlibraries`
5. Generate a strong database password
6. Select a region close to your users
7. Wait for project to initialize (~2 minutes)

### 2. Run the Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy the entire contents of `schema.sql`
3. Click "Run" to execute
4. Verify all tables were created in the Table Editor

### 3. Create Storage Buckets

You can create buckets either via the Dashboard or SQL:

#### Option A: Via Dashboard (Recommended)

1. Navigate to **Storage** in the left sidebar
2. Click **New bucket** for each of the following:

**Bucket 1: avatars**
- Name: `avatars`
- Public: ❌ No (Private)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: book-covers**
- Name: `book-covers`
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 3: book-content**
- Name: `book-content`
- Public: ❌ No (Private)
- File size limit: 50MB
- Allowed MIME types: `application/pdf, application/epub+zip`

**Bucket 4: quiz-uploads**
- Name: `quiz-uploads`
- Public: ❌ No (Private)
- File size limit: 10MB
- Allowed MIME types: `text/plain, application/pdf`

**Bucket 5: assignment-resources**
- Name: `assignment-resources`
- Public: ❌ No (Private)
- File size limit: 20MB
- Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, image/jpeg, image/png`

#### Option B: Via SQL

The bucket creation SQL commands are already in `schema.sql`. They will execute automatically when you run the schema.

### 4. Configure Storage Policies

The RLS policies for storage buckets are included in `schema.sql` and will be automatically created. Verify them in the Storage section:

1. Go to **Storage** → Select a bucket → **Policies**
2. Confirm policies are active for each bucket

### 5. Enable Realtime (Optional)

For live activity feeds and notifications:

1. Go to **Database** → **Replication**
2. Toggle on the following tables:
   - `activity_log`
   - `notifications`
   - `discussion_posts`
   - `reading_sessions`

### 6. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy the following:
   - Project URL: `https://[YOUR-PROJECT-REF].supabase.co`
   - Anon/Public key: `eyJ...`
   - Service Role key: `eyJ...` (keep secret!)

### 7. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Optional
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

## 🔧 Integration with React App

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Initialize Supabase

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Example Usage: Upload Book Cover

```typescript
import { supabase } from './lib/supabase'

async function uploadBookCover(bookId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${bookId}/cover.${fileExt}`

  const { data, error } = await supabase.storage
    .from('book-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('book-covers')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### Example Usage: Get Private Book Content

```typescript
async function getBookContent(bookId: string) {
  const filePath = `${bookId}/full.pdf`

  // Create a signed URL valid for 1 hour
  const { data, error } = await supabase.storage
    .from('book-content')
    .createSignedUrl(filePath, 3600)

  if (error) throw error

  return data.signedUrl
}
```

### Example Usage: Upload User Avatar

```typescript
async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/profile.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  // Update user profile
  await supabase
    .from('users')
    .update({ profile_avatar_path: filePath })
    .eq('id', userId)

  return filePath
}
```

### Example Usage: Realtime Subscriptions

```typescript
// Subscribe to new notifications
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
      // Update UI with new notification
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

## 🎯 Storage Best Practices

### 1. File Naming Convention

Always use consistent paths:
- Avatars: `{user_id}/profile.{ext}`
- Book covers: `{book_id}/cover.{ext}`
- Book content: `{book_id}/full.{pdf|epub}`
- Quiz uploads: `{teacher_id}/{timestamp}-{filename}`

### 2. Image Optimization

Before uploading book covers and avatars:
- Resize to appropriate dimensions (e.g., 400x600 for covers)
- Compress images to reduce file size
- Use WebP format for better compression

### 3. CDN Performance

Supabase Storage uses a global CDN (Cloudflare). To maximize performance:
- Set appropriate `Cache-Control` headers
- Use public buckets for frequently accessed files
- Generate signed URLs for private content and cache them

### 4. File Validation

Always validate files before upload:

```typescript
function validateBookCover(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 2 * 1024 * 1024 // 2MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP.')
  }

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 2MB.')
  }

  return true
}
```

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Students Can:
- ✅ View their own profile
- ✅ View their own stats and badges
- ✅ View books in the library
- ✅ View classes they're enrolled in
- ✅ Submit quizzes and assignments
- ✅ Post in discussions
- ❌ View other students' data
- ❌ Modify other students' work

### Teachers Can:
- ✅ View all students in their classes
- ✅ Create and manage assignments
- ✅ Grade student work
- ✅ Create custom badges
- ✅ Upload books and resources
- ✅ Moderate discussions
- ❌ Access other teachers' classes

### Testing RLS

Test policies with different user roles:

```sql
-- Simulate student access
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "student-user-id"}';

-- Try querying
SELECT * FROM public.users;

-- Reset
RESET ROLE;
```

## 📊 Database Migrations

For future schema changes, use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref [your-project-ref]

# Create a migration
supabase migration new add_new_feature

# Apply migration
supabase db push
```

## 🚨 Troubleshooting

### Issue: Tables not created
- Check SQL Editor output for errors
- Ensure extensions are enabled
- Run schema in correct order

### Issue: RLS blocking queries
- Verify user is authenticated
- Check policy conditions match your use case
- Use service role key for admin operations

### Issue: Storage upload fails
- Verify bucket exists and is accessible
- Check file size limits
- Ensure MIME type is allowed
- Verify RLS policies on storage.objects

### Issue: Can't access private files
- Use `createSignedUrl()` for private buckets
- Don't use `getPublicUrl()` on private buckets
- Check user has permission via RLS policy

## 📈 Monitoring & Analytics

### View Storage Usage

```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

### View Active Users

```sql
SELECT 
  COUNT(DISTINCT user_id) as daily_active_users
FROM public.activity_log
WHERE created_at >= CURRENT_DATE;
```

### View Popular Books

```sql
SELECT 
  b.title,
  COUNT(rs.id) as reading_sessions
FROM public.books b
JOIN public.reading_sessions rs ON b.id = rs.book_id
WHERE rs.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.title
ORDER BY reading_sessions DESC
LIMIT 10;
```

## 🔄 Backup & Recovery

Supabase provides automatic daily backups for paid plans.

### Manual Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Restore
supabase db reset --db-url "postgresql://..."
```

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## ✅ Deployment Checklist

Before going to production:

- [ ] All tables created successfully
- [ ] All storage buckets created with correct permissions
- [ ] RLS policies tested for all user roles
- [ ] Sample data inserted for testing
- [ ] Environment variables configured
- [ ] Authentication flow tested
- [ ] File upload/download tested
- [ ] Realtime subscriptions tested (if using)
- [ ] Backup strategy in place
- [ ] Monitoring/analytics configured
- [ ] Edge Functions deployed (if using)
