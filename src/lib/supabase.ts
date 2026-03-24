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
          persistSession: true,
          storage: window.sessionStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
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
 * Decode JWT token to extract user info
 * JWT tokens have format: header.payload.signature
 * Payload is base64url encoded JSON
 */
function decodeJwt(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }
    
    // Decode the payload (second part)
    const payload = parts[1]
    // Add padding if needed
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decoded = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Create an authenticated Supabase client with a user's JWT token
 * Used by API routes to access Supabase with user context
 * Properly sets the session so that RLS policies work correctly
 */
export const getAuthenticatedSupabase = async (token: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return null
  }

  try {
    if (!token || token.length < 50) {
      console.error('Invalid token format:', { length: token?.length })
      return null
    }

    // Create client with Authorization header
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

    // Decode JWT to extract user info for validation
    const decoded = decodeJwt(token)
    if (!decoded || !decoded.sub) {
      console.error('Failed to decode JWT token')
      return null
    }

    console.log('✓ Authenticated client created with token for user:', decoded.sub)
    return authenticatedClient
  } catch (error) {
    console.error('Failed to create authenticated Supabase client:', error)
    return null
  }
}

/**
 * Extract user ID from JWT token
 * Useful for server-side API routes that need user_id without calling auth.getUser()
 */
export const getUserIdFromToken = (token: string): string | null => {
  const decoded = decodeJwt(token)
  return decoded?.sub || null
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
