import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy initialization - only create client when needed and env vars are available
let supabaseClient: any = null

export const getSupabase = () => {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// For backward compatibility with existing code
export const supabase = {
  get auth() {
    return getSupabase()?.auth
  },
  from(table: string) {
    return getSupabase()?.from(table)
  },
}
