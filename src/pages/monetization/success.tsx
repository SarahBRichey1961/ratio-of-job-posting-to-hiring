import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

export default function SuccessPage() {
  const router = useRouter()
  const { session, isAuthenticated, user } = useAuth()
  const [userType, setUserType] = useState<'sponsor' | 'advertiser' | null>(null)
  const [showPage, setShowPage] = useState(true)

  useEffect(() => {
    // Get user type from query string
    if (!router.isReady) return

    const type = router.query.userType as 'sponsor' | 'advertiser' | undefined
    
    if (type && ['sponsor', 'advertiser'].includes(type)) {
      setUserType(type as 'sponsor' | 'advertiser')
    }

    // Small delay to ensure auth context is ready
    const timer = setTimeout(() => {
      if (type === 'advertiser') {
        // If already authenticated, go directly to advertiser dashboard
        if (session && isAuthenticated) {
          router.push('/advertiser/dashboard')
          return
        }
        // Otherwise show success page and let user click to continue
      } else if (type === 'sponsor') {
        if (session && isAuthenticated) {
          router.push('/sponsor/dashboard')
          return
        }
      }
      
      // Show success page
      setShowPage(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [router.isReady, router.query, session, isAuthenticated])

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

  const handleContinue = () => {
    const dashLink = getDashboardLink()
    if (session && isAuthenticated) {
      // Already logged in, go straight to dashboard
      router.push(dashLink)
    } else {
      // Need to login first, then go to dashboard
      router.push(`/auth/login?redirect=${dashLink}`)
    }
  }

  if (!showPage) {
    return null
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
                  <span className="font-semibold">Next:</span> Upload your advertisement banner
                </p>
              )}
              {userType === 'sponsor' && (
                <p className="text-slate-300 text-sm mt-2">
                  <span className="font-semibold">Available:</span> Sponsor benefits activated
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Go to {userType === 'sponsor' ? 'Sponsor' : 'Advertiser'} Dashboard
            </button>

            <Link
              href="/hub"
              className="w-full inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              Back to Hub
            </Link>
          </div>

          <p className="text-slate-500 text-xs mt-6">
            Redirecting to dashboard in a moment...
          </p>
        </div>
      </div>
    </div>
  )
}
