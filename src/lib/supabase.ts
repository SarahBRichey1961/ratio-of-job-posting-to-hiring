import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    try {
      // Create client with custom storage to avoid Navigator LockManager issues
      // Use localStorage in browser, fallback to memory storage
      let storage: any = undefined

      if (typeof window !== 'undefined') {
        try {
          // Test if localStorage is available and writable
          const testKey = '__test__'
          window.localStorage.setItem(testKey, testKey)
          window.localStorage.removeItem(testKey)
          // localStorage is available, let Supabase use it
          storage = undefined
        } catch (e) {
          // localStorage not available, use memory storage
          console.warn('localStorage not available, using memory storage:', e)
          storage = new MemoryStorage()
        }
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: typeof window !== 'undefined', // Only persist in browser
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: storage, // Use custom storage if needed
        },
      })
    } catch (error) {
      console.error('Failed to initialize Supabase:', error)
      return null
    }
  }
  return supabaseClient || null
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
