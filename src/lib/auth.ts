import { getSupabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
}

export const authHelper = {
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not initialized')

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const supabase = getSupabase()
    if (!supabase) return null

    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  },

  // Get user session
  async getSession() {
    const supabase = getSupabase()
    if (!supabase) return null

    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // On auth state change listener
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = getSupabase()
    if (!supabase) return () => {}

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email || '',
            }
          : null
      )
    })

    return () => {
      subscription?.unsubscribe()
    }
  },
}
