import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'viewer'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (
      !isLoading &&
      isAuthenticated &&
      requiredRole === 'admin' &&
      !isAdmin
    ) {
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, isAdmin, requiredRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
