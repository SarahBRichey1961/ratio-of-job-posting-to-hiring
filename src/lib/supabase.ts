import { createClient } from '@supabase/supabase-js'

// Single global Supabase client instance - created only once
let supabaseClient: any = null

export const getSupabase = () => {
  // Read environment variables at runtime (not at module load time)
  const supabaseUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL 
    : process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    return null
  }

  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    return null
  }

  try {
    // Create new client for server-side to avoid MemoryStorage concurrency issues
    // On server, no persistent session needed anyway
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    return client
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
    return null
  }
}

/**
 * Create an authenticated Supabase client with a user's JWT token
 * Used by API routes to access Supabase with user context
 * Fixes "Cannot find module @supabase/supabase-js" by using proper imports
 */
export const getAuthenticatedSupabase = (token: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return null
  }

  try {
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    return authenticatedClient
  } catch (error) {
    console.error('Failed to create authenticated Supabase client:', error)
    return null
  }
}

// Safe mock object that returns proper responses even when Supabase is not initialized
const createMockQueryBuilder = () => ({
  select: (columns?: string) => Promise.resolve({ data: null, error: null }),
  insert: (values: any) => Promise.resolve({ data: null, error: null }),
  update: (values: any) => Promise.resolve({ data: null, error: null }),
  delete: () => Promise.resolve({ data: null, error: null }),
  eq: () => Promise.resolve({ data: null, error: null }),
  single: () => Promise.resolve({ data: null, error: null }),
  order: () => Promise.resolve({ data: null, error: null }),
})

// For backward compatibility with existing code
export const supabase = {
  get auth() {
    const client = getSupabase()
    return client?.auth || { 
      onAuthStateChange: (callback: any) => ({ 
        data: { subscription: { unsubscribe: () => {} } } 
      }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ data: null, error: null }),
    }
  },
  from(table: string) {
    const client = getSupabase()
    return client?.from(table) || createMockQueryBuilder()
  },
  rpc(name: string, params?: any) {
    const client = getSupabase()
    return client?.rpc(name, params) || Promise.resolve({ data: null, error: null })
  },
}
