import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy initialization - only create client when needed and env vars are available
let supabaseClient: any = null

export const getSupabase = () => {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
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
