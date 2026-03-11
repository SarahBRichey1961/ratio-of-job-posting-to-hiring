import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'viewer'
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ user: User; session: Session }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing auth...')
    const client = getSupabase()
    if (!client) {
      console.warn('⚠️ Supabase client not available')
      setIsLoading(false)
      return
    }

    console.log('✅ Supabase client obtained, setting up auth listener...')

    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let subscription: any = null

    // Set a timeout for auth initialization (increased to 5 seconds)
    timeoutId = setTimeout(() => {
      console.warn('⏱️ Auth initialization timeout (5s) - proceeding without full session')
      if (isMounted) {
        setIsLoading(false)
      }
    }, 5000)

    // Check active sessions and subscribe to auth changes with error handling
    try {
      const { data } = client.auth.onAuthStateChange(
        async (_event, session) => {
          console.log(`🔐 Auth state changed: event=${_event}, hasSession=${!!session}`)
          if (!isMounted) return

          try {
            if (timeoutId) {
              clearTimeout(timeoutId)
              console.log('✅ Auth timeout cleared - onAuthStateChange fired')
            }

            // Update user and session state
            if (isMounted) {
              setUser(session?.user || null)
              setSession(session || null)
            }

            if (session?.user) {
              // Use the main client - Supabase handles auth automatically
              // No need to create a new client instance
              const dbClient = client

              // Fetch user profile
              const { data: profileData, error: fetchError } = await dbClient
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()

              if (!isMounted) return

              if (!profileData && fetchError && fetchError.code !== 'PGRST116') {
                // Table might not exist yet - use anon client
                console.log('Profile fetch error:', fetchError.code, '- table may not exist')
                // Set default profile and continue
                if (isMounted) {
                  setProfile({
                    id: session.user.id,
                    email: session.user.email || '',
                    role: 'viewer',
                    created_at: new Date().toISOString(),
                  })
                  setIsLoading(false)
                }
                return
              }

              if (!profileData) {
                console.log('Profile not found, creating default profile')
                // Try to create the profile now that user is authenticated
                const { data: createdProfile, error: createError } = await dbClient
                  .from('user_profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email || '',
                    role: 'viewer',
                  })
                  .select()
                  .single()

                if (!isMounted) return

                if (createError) {
                  console.error('Could not create profile:', createError.code, createError.message)
                  // Set a default profile anyway to allow user to continue
                  if (isMounted) {
                    setProfile({
                      id: session.user.id,
                      email: session.user.email || '',
                      role: 'viewer',
                      created_at: new Date().toISOString(),
                    })
                  }
                } else {
                  if (isMounted) {
                    setProfile(createdProfile as UserProfile)
                  }
                }
              } else {
                if (isMounted) {
                  setProfile(profileData as UserProfile)
                }
              }
            } else {
              if (isMounted) {
                setProfile(null)
              }
            }

            if (isMounted) {
              setIsLoading(false)
              console.log('✅ Auth isLoading set to false')
            }
          } catch (err) {
            console.error('❌ Error in auth state change handler:', err)
            if (isMounted) {
              setIsLoading(false)
              console.log('✅ Auth isLoading set to false (via error catch)')
            }
          }
        }
      )

      subscription = data.subscription

      return () => {
        isMounted = false
        if (timeoutId) clearTimeout(timeoutId)
        if (subscription) subscription.unsubscribe()
      }
    } catch (err: any) {
      // Handle lock timeout or other auth initialization errors
      if (err?.message?.includes('Navigator LockManager') || err?.message?.includes('timed out')) {
        console.warn('⚠️ Auth lock timeout - using fallback auth mode', err.message)
        clearTimeout(timeoutId)
        setIsLoading(false)
        console.log('✅ Auth isLoading set to false (lock timeout)')
      } else {
        console.error('❌ Failed to initialize auth:', err)
        clearTimeout(timeoutId)
        setIsLoading(false)
        console.log('✅ Auth isLoading set to false (init error)')
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

      console.log('User signed up:', signUpData.user.id)

      // Auto sign in after signup
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Auto sign-in after signup failed:', signInError)
        throw signInError
      }

      if (!signInData.session) {
        throw new Error('Session not created after signup')
      }

      console.log('User auto-signed in, profile creation will be handled by listener')
      // The onAuthStateChange listener will now fire and handle profile creation
      
      return {
        user: signInData.user,
        session: signInData.session,
      }
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

      if (error) {
        if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many')) {
          throw new Error('Tried too many times to log in, wait 15 minutes and try again')
        }
        throw error
      }
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
      setSession(null)
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
    session,
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
