/**
 * Hook to check if current user is an admin
 * Only sarah@websepic.com should have admin access
 */

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export function useAdminCheck() {
  const { session, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Only check admin status when auth is done loading
    if (!authLoading) {
      const adminEmail = 'sarah@websepic.com'
      const isUserAdmin = isAuthenticated && session?.user?.email === adminEmail
      setIsAdmin(isUserAdmin)
    } else {
      setIsAdmin(false)
    }
  }, [session, isAuthenticated, authLoading])

  return { isAdmin, isLoading: authLoading, userEmail: session?.user?.email }
}

/**
 * Wrapper component for admin-only pages
 * Displays access denied if user is not admin
 */
export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminCheck()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2 text-red-400">❌ Access Denied</h1>
            <p className="mb-4">You don't have permission to access the admin panel.</p>
            <p className="text-sm text-gray-400">If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
