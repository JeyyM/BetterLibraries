import { supabase } from './supabase'
import type { User, Book } from '../../types'

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

export const auth = {
  /**
   * Sign up a new user with email and password
   */
  signUp: async (email: string, password: string, metadata: { name: string; role: 'student' | 'teacher' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  },

  /**
   * Sign in an existing user
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get the current user session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { session: data.session, error }
  },

  /**
   * Get the current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export const storage = {
  /**
   * Upload a user avatar
   */
  uploadAvatar: async (userId: string, file: File) => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/profile.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) return { data: null, error }

    // Update user profile with new avatar path
    await supabase
      .from('users')
      .update({ profile_avatar_path: filePath })
      .eq('id', userId)

    return { data: filePath, error: null }
  },

  /**
   * Get avatar URL (creates signed URL for private bucket)
   */
  getAvatarUrl: async (avatarPath: string) => {
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600) // 1 hour expiry

    return { url: data?.signedUrl || null, error }
  },

  /**
   * Upload a book cover (public bucket)
   */
  uploadBookCover: async (bookId: string, file: File) => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${bookId}/cover.${fileExt}`

    const { data, error } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) return { data: null, error }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath)

    return { data: publicUrl, error: null }
  },

  /**
   * Upload book content (PDF/EPUB)
   */
  uploadBookContent: async (bookId: string, file: File) => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${bookId}/full.${fileExt}`

    const { data, error } = await supabase.storage
      .from('book-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    return { data: filePath, error }
  },

  /**
   * Get signed URL for book content
   */
  getBookContentUrl: async (contentPath: string) => {
    const { data, error } = await supabase.storage
      .from('book-content')
      .createSignedUrl(contentPath, 3600) // 1 hour expiry

    return { url: data?.signedUrl || null, error }
  },
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export const db = {
  /**
   * Get all books
   */
  getBooks: async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('is_active', true)
      .order('title')

    return { books: data || [], error }
  },

  /**
   * Get a single book by ID
   */
  getBook: async (bookId: string) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    return { book: data, error }
  },

  /**
   * Search books by title or author
   */
  searchBooks: async (searchTerm: string) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
      .eq('is_active', true)

    return { books: data || [], error }
  },

  /**
   * Filter books by genre
   */
  getBooksByGenre: async (genre: string) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('genre', genre)
      .eq('is_active', true)

    return { books: data || [], error }
  },

  /**
   * Get user profile
   */
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, student_stats(*)')
      .eq('id', userId)
      .single()

    return { user: data, error }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { user: data, error }
  },

  /**
   * Get student stats
   */
  getStudentStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('student_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { stats: data, error }
  },

  /**
   * Create a reading session
   */
  createReadingSession: async (userId: string, bookId: string) => {
    const { book } = await db.getBook(bookId)
    
    const { data, error } = await supabase
      .from('reading_sessions')
      .insert({
        user_id: userId,
        book_id: bookId,
        total_pages: book?.pages || 0,
        status: 'in-progress',
      })
      .select()
      .single()

    return { session: data, error }
  },

  /**
   * Update reading progress
   */
  updateReadingProgress: async (sessionId: string, page: number) => {
    const { data, error } = await supabase
      .from('reading_sessions')
      .update({
        last_page_read: page,
        progress_percentage: 0, // Calculate based on total pages
      })
      .eq('id', sessionId)
      .select()
      .single()

    return { session: data, error }
  },
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export const realtime = {
  /**
   * Subscribe to notifications for a user
   */
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },

  /**
   * Subscribe to activity log (for teachers monitoring students)
   */
  subscribeToActivityLog: (callback: (payload: any) => void) => {
    return supabase
      .channel('activity-log')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
        },
        callback
      )
      .subscribe()
  },

  /**
   * Subscribe to discussion posts for a book
   */
  subscribeToDiscussion: (bookId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`discussion-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_posts',
          filter: `book_id=eq.${bookId}`,
        },
        callback
      )
      .subscribe()
  },
}
