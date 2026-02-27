import { createClient } from '@supabase/supabase-js'

// Simple in-memory storage adapter to avoid Navigator LockManager issues
class MemoryStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }
}

// Single global Supabase client instance - created only once
let supabaseClient: any = null

export const getSupabase = () => {
  if (supabaseClient) {
    return supabaseClient
  }

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
    // Simple minimal config to avoid lock manager issues
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Disable session persistence to avoid lock manager
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    console.debug('Supabase client initialized successfully')
    return supabaseClient
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
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
