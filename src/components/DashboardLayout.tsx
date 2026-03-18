import React, { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { useAdminCheck } from '@/hooks/useAdminCheck'

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: string
  description: string
}

const navItems: NavItem[] = [
  {
    label: 'Comparison',
    href: '/dashboard/comparison',
    icon: '⚖️',
    description: 'Compare job boards',
  },
  {
    label: 'Recently Posted',
    href: '/dashboard/recently-posted-jobs',
    icon: '🔥',
    description: 'Last 72 hours',
  },
  {
    label: 'Insights',
    href: '/dashboard/insights',
    icon: '💡',
    description: 'Trends & market analysis',
  },
  {
    label: 'Take The Reins',
    href: '/hub',
    icon: '🚀',
    description: 'Learn, build & collaborate',
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { session, isAuthenticated } = useAuth()
  const { isAdmin, isLoading: isAuthLoading } = useAdminCheck()
  const [mounted, setMounted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isLoadingManageAds, setIsLoadingManageAds] = useState(false)

  // Prevent hydration mismatch - only render auth-dependent UI after mount
  // Banner shows if user is NOT authenticated at mount time and stays visible
  useEffect(() => {
    setMounted(true)
    // Only show banner if currently not authenticated. Lock this decision at mount.
    setShowBanner(!isAuthenticated)
  }, [])

  const handleManageAds = async () => {
    setIsLoadingManageAds(true)
    
    try {
      // If not authenticated, redirect to signin
      if (!session?.user) {
        await router.push('/auth/login?redirect=/advertiser/dashboard')
        return
      }

      // If authenticated, check advertiser status
      const checkResponse = await fetch('/api/monetization/check-advertiser', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (checkResponse.ok) {
        const advertiserData = await checkResponse.json()
        if (advertiserData.hasPaidAccount) {
          // Has paid ad account - go to manage ads
          await router.push('/advertiser/dashboard')
        } else {
          // No paid account - redirect to advertiser area/signup
          await router.push('/auth/signup?type=advertiser')
        }
      } else {
        // Error checking status - go to advertiser area
        await router.push('/advertiser/dashboard')
      }
    } catch (err) {
      console.error('Error handling manage ads:', err)
      await router.push('/advertiser/dashboard')
    } finally {
      setIsLoadingManageAds(false)
    }
  }

  const manageAdsItem = {
    label: 'Manage Ads',
    icon: '📢',
    description: 'Create & manage ads',
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Desktop only (hidden md:flex means invisible on mobile, visible on md+) */}
      <aside className="w-64 hidden md:flex flex-col h-screen bg-gray-800 overflow-y-auto border-r border-gray-700">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80">
              <div className="text-2xl">📊</div>
              <h1 className="text-xl font-bold text-white whitespace-nowrap">Job Board Score</h1>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Admin Dashboard - Only show to admin users (sarah@websepic.com) */}
          {mounted && isAdmin && !isAuthLoading && (
            <Link href="/admin/dashboard">
              <div
                className={`p-3 rounded-lg transition-colors cursor-pointer border-l-4 ${
                  router.pathname.startsWith('/admin')
                    ? 'bg-red-900 border-red-600 text-red-100 shadow-lg'
                    : 'text-red-300 hover:bg-red-900/30 hover:text-red-200 border-red-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">🔐</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Admin Panel</p>
                    <p className="text-xs text-red-400">Manage platform</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Manage Ads - Special handling for auth/payment checks */}
          <div
            onClick={handleManageAds}
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              isLoadingManageAds
                ? 'bg-gray-600 text-gray-400 opacity-50 cursor-not-allowed'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{manageAdsItem.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{manageAdsItem.label}</p>
                <p className="text-xs text-gray-400">{manageAdsItem.description}</p>
              </div>
              {isLoadingManageAds && <span className="text-xs ml-auto animate-pulse">...</span>}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0 space-y-3">
          <Link href="/auth/signup">
            <div className="p-3 rounded-lg transition-colors cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white text-center font-semibold">
              + Sign Up for Advertising
            </div>
          </Link>

          {/* Legal Links */}
          <div className="space-y-1 pt-2 border-t border-gray-700">
            <Link href="/dashboard/terms-and-conditions">
              <div className="p-2 rounded transition-colors cursor-pointer text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                Terms & Conditions
              </div>
            </Link>
            <Link href="/dashboard/privacy-policy">
              <div className="p-2 rounded transition-colors cursor-pointer text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                Privacy Policy
              </div>
            </Link>
            <Link href="/dashboard/refund-policy">
              <div className="p-2 rounded transition-colors cursor-pointer text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                Refund Policy
              </div>
            </Link>
          </div>

          <div className="text-xs text-gray-400 p-3">
            <p className="font-semibold">Job Board Analytics</p>
            <p className="text-gray-500 mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Shows auth buttons when not logged in */}
        {mounted && showBanner && (
          <header className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-white font-semibold">Ready to get started?</h2>
                <p className="text-blue-100 text-sm">Sign in to save your preferences and create campaigns</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`}>
                  <button className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                    Login
                  </button>
                </Link>
                <Link href={`/auth/signup?redirect=${encodeURIComponent(router.asPath)}`}>
                  <button className="px-4 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors border border-blue-600">
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </header>
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
