/**
 * Example: How to use Supabase in BetterLibraries
 * 
 * This file contains practical examples of using Supabase for common operations.
 * Copy these patterns into your actual components.
 */

import React from 'react'
import { auth, storage, db, realtime } from '../lib/supabaseHelpers'

// ============================================================================
// EXAMPLE 1: Authentication
// ============================================================================

export const LoginExample = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await auth.signIn(email, password)
    
    if (error) {
      console.error('Login error:', error.message)
      return
    }
    
    console.log('Logged in successfully:', data.user)
    // Update your app state, redirect to dashboard, etc.
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await auth.signUp(email, password, {
      name: 'John Doe',
      role: 'student'
    })
    
    if (error) {
      console.error('Signup error:', error.message)
      return
    }
    
    console.log('Account created:', data.user)
  }

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      <button type="button" onClick={handleSignUp}>Sign Up</button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 2: Fetching Books
// ============================================================================

export const BookListExample = () => {
  const [books, setBooks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    setLoading(true)
    const { books: data, error } = await db.getBooks()
    
    if (error) {
      console.error('Error loading books:', error)
      return
    }
    
    setBooks(data)
    setLoading(false)
  }

  const searchBooks = async (searchTerm: string) => {
    const { books: results, error } = await db.searchBooks(searchTerm)
    if (!error) setBooks(results)
  }

  if (loading) return <div>Loading books...</div>

  return (
    <div>
      <input 
        type="text"
        placeholder="Search books..."
        onChange={(e) => searchBooks(e.target.value)}
      />
      {books.map(book => (
        <div key={book.id}>
          <h3>{book.title}</h3>
          <p>by {book.author}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Uploading Files
// ============================================================================

export const AvatarUploadExample = () => {
  const [userId, setUserId] = React.useState('user-123') // Get from auth
  const [uploading, setUploading] = React.useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB')
      return
    }

    setUploading(true)
    
    const { data: avatarPath, error } = await storage.uploadAvatar(userId, file)
    
    if (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar')
      setUploading(false)
      return
    }

    console.log('Avatar uploaded:', avatarPath)
    setUploading(false)
  }

  return (
    <div>
      <input 
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: Real-time Notifications
// ============================================================================

export const NotificationsExample = () => {
  const [notifications, setNotifications] = React.useState<any[]>([])
  const userId = 'user-123' // Get from auth

  React.useEffect(() => {
    // Subscribe to real-time notifications
    const subscription = realtime.subscribeToNotifications(
      userId,
      (payload) => {
        console.log('New notification:', payload.new)
        setNotifications(prev => [payload.new, ...prev])
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return (
    <div>
      <h2>Notifications</h2>
      {notifications.map(notif => (
        <div key={notif.id}>
          <strong>{notif.title}</strong>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: Creating a Reading Session
// ============================================================================

export const StartReadingExample = () => {
  const handleStartReading = async (bookId: string) => {
    const userId = 'user-123' // Get from auth
    
    const { session, error } = await db.createReadingSession(userId, bookId)
    
    if (error) {
      console.error('Error starting reading session:', error)
      return
    }
    
    console.log('Reading session started:', session)
    // Navigate to reading view with session.id
  }

  const updateProgress = async (sessionId: string, currentPage: number) => {
    const { session, error } = await db.updateReadingProgress(sessionId, currentPage)
    
    if (error) {
      console.error('Error updating progress:', error)
      return
    }
    
    console.log('Progress updated:', session)
  }

  return (
    <button onClick={() => handleStartReading('book-123')}>
      Start Reading
    </button>
  )
}

// ============================================================================
// EXAMPLE 6: Auth State Management
// ============================================================================

export const useAuth = () => {
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Check for existing session
    auth.getSession().then(({ session }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

// Usage in your app:
export const ProtectedComponent = () => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return <div>Welcome, {user.email}!</div>
}
