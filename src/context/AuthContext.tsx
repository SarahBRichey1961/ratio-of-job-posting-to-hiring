import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'viewer'
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Lazy initialization of Supabase client - only created when needed, not at module load
let supabaseClient: any = null

export const getSupabase = () => {
  if (!supabaseClient && supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

// For backward compatibility with imports
export const supabase = { getSupabase }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const client = getSupabase()
    if (!client) {
      setIsLoading(false)
      return
    }

    // Check active sessions and subscribe to auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null)

        if (session?.user) {
          // Fetch user profile
          const { data, error } = await client
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
            // Create default profile if it doesn't exist
            await client
              .from('user_profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: 'viewer',
              })
            setProfile({
              id: session.user.id,
              email: session.user.email || '',
              role: 'viewer',
              created_at: new Date().toISOString(),
            })
          } else {
            setProfile(data as UserProfile)
          }
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) throw new Error('Supabase not initialized')
      
      const { data, error } = await client.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      // Create user profile
      if (data.user) {
        await client
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'viewer',
          })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) throw new Error('Supabase not initialized')
      
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) throw new Error('Supabase not initialized')
      
      const { error } = await client.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
