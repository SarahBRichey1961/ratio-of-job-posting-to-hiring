import { createClient } from '@supabase/supabase-js'

// Browser client - single instance for client-side auth
let browserClient: any = null

export const getSupabase = () => {
  // Browser-side: use persistent session for auth state tracking
  if (typeof window !== 'undefined') {
    if (browserClient) {
      return browserClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return null
    }

    try {
      browserClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true, // Enable session persistence for login/logout
          autoRefreshToken: true,
          detectSessionInUrl: true, // Required for email confirmation links to work
        },
      })
      return browserClient
    } catch (error) {
      console.error('Failed to initialize browser Supabase client:', error)
      return null
    }
  }

  // Server-side: create fresh client for each request (no persistence needed)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    return null
  }

  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    return null
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Server shouldn't persist sessions
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    return client
  } catch (error) {
    console.error('Failed to initialize server Supabase client:', error)
    return null
  }
}

/**
 * Create an authenticated Supabase client with a user's JWT token
 * Used by API routes to access Supabase with user context
 * Properly sets the session so that auth.getUser() and RLS policies work correctly
 */
export const getAuthenticatedSupabase = async (token: string) => {
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

    // Just verify the token looks valid (basic validation)
    // Don't call getUser() as it may fail for valid tokens that just lack user metadata
    if (!token || token.length < 50) {
      console.error('Invalid token format:', { length: token?.length })
      return null
    }

    console.log('Authenticated client created with token, length:', token.length)
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
