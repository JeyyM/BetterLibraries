# Supabase Integration - Quick Start

## ✅ Setup Complete!

Your BetterLibraries app is now connected to Supabase with:
- ✅ `@supabase/supabase-js` installed
- ✅ Environment variables configured in `.env.local`
- ✅ Supabase client initialized in `src/lib/supabase.ts`
- ✅ Helper functions ready in `src/lib/supabaseHelpers.ts`
- ✅ TypeScript types configured

## 📁 File Structure

```
BetterLibraries/
├── .env.local                          # Environment variables (Supabase keys)
├── src/
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client instance
│   │   └── supabaseHelpers.ts         # Helper functions (auth, storage, db)
│   ├── examples/
│   │   └── SupabaseExamples.tsx       # Usage examples
│   └── vite-env.d.ts                  # TypeScript environment types
└── schema.sql                          # Database schema (run in Supabase)
```

## 🔑 Environment Variables

Your `.env.local` file contains:

```env
VITE_SUPABASE_URL=https://iorphpkzpyjgawtvisst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_GEMINI_API_KEY=your-gemini-key
```

⚠️ **Important**: Never commit `.env.local` to Git! It's already in `.gitignore`.

## 🚀 Quick Usage

### Import the helpers

```typescript
import { auth, storage, db, realtime } from './lib/supabaseHelpers'
```

### Authentication

```typescript
// Sign up
const { data, error } = await auth.signUp('user@example.com', 'password123', {
  name: 'John Doe',
  role: 'student'
})

// Sign in
const { data, error } = await auth.signIn('user@example.com', 'password123')

// Sign out
await auth.signOut()

// Get current user
const { user, error } = await auth.getUser()
```

### Database Operations

```typescript
// Get all books
const { books, error } = await db.getBooks()

// Search books
const { books, error } = await db.searchBooks('Harry Potter')

// Get user profile
const { user, error } = await db.getUserProfile(userId)

// Create reading session
const { session, error } = await db.createReadingSession(userId, bookId)
```

### File Upload

```typescript
// Upload avatar
const { data: avatarPath, error } = await storage.uploadAvatar(userId, file)

// Upload book cover (returns public URL)
const { data: coverUrl, error } = await storage.uploadBookCover(bookId, file)

// Get signed URL for private content
const { url, error } = await storage.getBookContentUrl(contentPath)
```

### Real-time Subscriptions

```typescript
// Subscribe to notifications
const subscription = realtime.subscribeToNotifications(userId, (payload) => {
  console.log('New notification:', payload.new)
})

// Cleanup
subscription.unsubscribe()
```

## 📊 Next Steps

### 1. Set Up Database

Run the schema in your Supabase project:
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `schema.sql`
5. Click **Run**

### 2. Create Storage Buckets

Follow the instructions in `SUPABASE_SETUP.md` to create:
- `avatars` (private)
- `book-covers` (public)
- `book-content` (private)
- `quiz-uploads` (private)
- `assignment-resources` (private)

### 3. Test the Connection

Create a simple test component:

```typescript
import { db } from './lib/supabaseHelpers'

const TestConnection = () => {
  const testConnection = async () => {
    const { books, error } = await db.getBooks()
    if (error) {
      console.error('Connection failed:', error)
    } else {
      console.log('Connection successful! Books:', books)
    }
  }

  return <button onClick={testConnection}>Test Supabase</button>
}
```

### 4. Replace Mock Data

Start replacing the mock data in your components:

#### Before (Mock):
```typescript
import { MOCK_BOOKS } from './constants'
const books = MOCK_BOOKS
```

#### After (Supabase):
```typescript
import { db } from './lib/supabaseHelpers'

const [books, setBooks] = useState([])

useEffect(() => {
  db.getBooks().then(({ books }) => setBooks(books))
}, [])
```

## 🔐 Row Level Security (RLS)

Your database has RLS enabled. This means:

- ✅ Students can only see their own data
- ✅ Teachers can see students in their classes
- ✅ Everyone can view the book library
- ✅ Storage buckets have proper access control

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

## 🐛 Troubleshooting

### "Missing environment variables" error

Make sure your `.env.local` file is in the project root and variables start with `VITE_`.

### "Row level security" errors

Ensure you're authenticated before querying protected tables:

```typescript
const { user } = await auth.getUser()
if (!user) {
  // Redirect to login
}
```

### Files not uploading

Check:
1. Buckets are created in Supabase dashboard
2. File size doesn't exceed bucket limits
3. MIME type is allowed
4. User has proper RLS permissions

## 🎯 Example: Replace Login Component

Update your `Login.tsx`:

```typescript
import { auth } from './lib/supabaseHelpers'

const Login = ({ onLogin }) => {
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password)
    
    if (error) {
      alert('Login failed: ' + error.message)
      return
    }
    
    // Get user profile from database
    const { user } = await db.getUserProfile(data.user.id)
    onLogin(user.role) // Pass role to App
  }
  
  // ... rest of component
}
```

## ✨ Pro Tips

1. **Use React Query**: For better caching and state management
2. **Error Handling**: Always check for errors in responses
3. **Loading States**: Show loaders while fetching data
4. **Optimistic Updates**: Update UI before server responds
5. **Type Safety**: Use TypeScript types from the Database type

Happy coding! 🚀
