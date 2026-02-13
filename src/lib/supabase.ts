import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'BetterLibraries',
    },
  },
})

// Export database types for TypeScript (will be auto-generated later)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'student' | 'teacher' | 'admin'
          school: string | null
          current_lexile_level: number
          profile_avatar_path: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          cover_image_path: string | null
          description: string | null
          full_description: string | null
          lexile_level: number
          genre: string
          pages: number
          estimated_time_minutes: number | null
          content: string | null
          full_content_path: string | null
          isbn: string | null
          publisher: string | null
          publication_year: number | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['books']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['books']['Insert']>
      }
      // Add more table types as needed
    }
  }
}
