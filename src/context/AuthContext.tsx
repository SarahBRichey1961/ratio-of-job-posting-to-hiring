import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

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

    // Set a timeout for auth initialization
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout - proceeding without session')
      setIsLoading(false)
    }, 3000)

    // Check active sessions and subscribe to auth changes with error handling
    try {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (_event, session) => {
          try {
            clearTimeout(timeoutId)
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
          } catch (err) {
            console.error('Error in auth state change handler:', err)
            setIsLoading(false)
          }
        }
      )

      return () => {
        clearTimeout(timeoutId)
        subscription?.unsubscribe()
      }
    } catch (err: any) {
      // Handle lock timeout or other auth initialization errors
      if (err?.message?.includes('Navigator LockManager') || err?.message?.includes('timed out')) {
        console.warn('Auth lock timeout - using fallback auth mode', err.message)
        clearTimeout(timeoutId)
        setIsLoading(false)
      } else {
        console.error('Failed to initialize auth:', err)
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) {
        console.error('Supabase client not initialized. Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
        throw new Error('Authentication service is not available. Please try again or contact support.')
      }
      
      // Sign up the user
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (!signUpData.user) {
        throw new Error('User creation failed')
      }

      // Create user profile
      await client
        .from('user_profiles')
        .insert({
          id: signUpData.user.id,
          email: signUpData.user.email,
          role: 'viewer',
        })
        .single()

      // Automatically sign them in with the same credentials
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Auto sign-in after signup failed:', signInError)
        // Even if auto sign-in fails, the account is created
        // They can sign in manually
        throw signInError
      }

      // The onAuthStateChange listener will automatically update the context
      setUser(signInData.user || null)
      
    } catch (error: any) {
      console.error('Sign-up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) {
        console.error('Supabase client not initialized. Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
        throw new Error('Authentication service is not available. Please try again or contact support.')
      }
      
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Sign-in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const client = getSupabase()
      if (!client) {
        console.error('Supabase client not initialized. Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
        throw new Error('Authentication service is not available. Please try again or contact support.')
      }
      
      const { error } = await client.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (error: any) {
      console.error('Sign-out error:', error)
      throw error
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
