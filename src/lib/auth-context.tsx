import React, { createContext, useContext, useEffect, useState } from 'react'
import { authHelper, AuthUser } from './auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current user on mount
    authHelper.getCurrentUser().then((currentUser) => {
      setUser(
        currentUser
          ? {
              id: currentUser.id,
              email: currentUser.email || '',
            }
          : null
      )
      setLoading(false)
    })

    // Listen for auth state changes
    const unsubscribe = authHelper.onAuthStateChange((updatedUser) => {
      setUser(updatedUser)
    })

    return () => unsubscribe()
  }, [])

  const signup = async (email: string, password: string) => {
    await authHelper.signUp(email, password)
  }

  const signin = async (email: string, password: string) => {
    const { user: newUser } = await authHelper.signIn(email, password)
    if (newUser) {
      setUser({
        id: newUser.id,
        email: newUser.email || '',
      })
    }
  }

  const signout = async () => {
    await authHelper.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp: signup,
        signIn: signin,
        signOut: signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
