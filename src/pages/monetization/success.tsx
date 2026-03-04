import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

export default function SuccessPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [userType, setUserType] = useState<'sponsor' | 'advertiser' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user type from query string first
    if (router.isReady) {
      const type = router.query.userType as 'sponsor' | 'advertiser' | undefined
      if (type && ['sponsor', 'advertiser'].includes(type)) {
        setUserType(type)
      }
      setIsLoading(false)
    }
  }, [router.isReady, router.query])

  const getDashboardLink = () => {
    switch (userType) {
      case 'sponsor':
        return '/sponsor/dashboard'
      case 'advertiser':
        return '/advertiser/dashboard'
      default:
        return '/hub'
    }
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Head>
        <title>Payment Successful - Take The Reins</title>
      </Head>

      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-600/20 border border-green-600/50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl text-green-400">✓</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-400 mb-6">
            Thank you for your payment. Your account is now active.
          </p>

          {userType && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold">Account Type:</span>{' '}
                <span className="text-indigo-400 capitalize">{userType}</span>
              </p>
              {userType === 'advertiser' && (
                <p className="text-slate-300 text-sm mt-2">
                  <span className="font-semibold">Available:</span> Create up to 5 ads
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Go to {userType === 'sponsor' ? 'Sponsor' : 'Advertiser'} Dashboard
                </Link>

                <Link
                  href="/hub"
                  className="w-full inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Back to Hub
                </Link>

                <p className="text-slate-500 text-sm mt-6">
                  A confirmation email has been sent to {user?.email}
                </p>
              </>
            ) : (
              <>
                <Link
                  href={getDashboardLink()}
                  className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Go to {userType === 'sponsor' ? 'Sponsor' : 'Advertiser'} Dashboard
                </Link>

                <Link
                  href="/hub"
                  className="w-full inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Back to Hub
                </Link>

                <p className="text-slate-400 text-sm mt-6">
                  Check your email for a confirmation and login link
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
