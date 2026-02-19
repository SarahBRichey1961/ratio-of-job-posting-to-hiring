import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

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
    label: 'Home',
    href: '/dashboard',
    icon: '📊',
    description: 'Overview & key metrics',
  },
  {
    label: 'Comparison',
    href: '/dashboard/comparison',
    icon: '⚖️',
    description: 'Compare job boards',
  },
  {
    label: 'Board Profile',
    href: '/dashboard/profile',
    icon: '📋',
    description: 'Detailed board analysis',
  },
  {
    label: 'Insights',
    href: '/dashboard/insights',
    icon: '💡',
    description: 'Trends & market analysis',
  },
  {
    label: 'Surveys',
    href: '/dashboard/surveys',
    icon: '📝',
    description: 'Submit feedback & surveys',
  },
  {
    label: 'QA Status',
    href: '/dashboard/qa',
    icon: '✅',
    description: 'System health check',
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { signOut, profile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false) // Mobile-first: start closed
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  React.useEffect(() => {
    // Open sidebar on larger screens
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-900 flex-col md:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative md:flex z-40 flex-col h-screen ${
          sidebarOpen ? 'w-64' : 'w-0'
        } md:w-64 bg-gray-800 transition-all duration-300 overflow-y-auto border-r border-gray-700`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-2xl">📊</div>
              {sidebarOpen && <h1 className="text-xl font-bold text-white">JobScore</h1>}
            </div>
          </Link>
        </div>

        {/* Toggle Button */}
        <div className="p-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && (
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs opacity-75">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          {sidebarOpen && (
            <div className="text-xs text-gray-500">
              <p className="font-semibold mb-1">JobScore MVP</p>
              <p>Week 3 - Frontend Build</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header 
          className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4"
          role="banner"
        >
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white truncate flex-1">
            {navItems.find((item) => item.href === router.pathname)?.label || 'Dashboard'}
          </h2>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:block text-xs sm:text-sm text-gray-400 whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {profile?.email?.charAt(0).toUpperCase() || '👤'}
                </div>
                <div className="text-left hidden sm:block min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{profile?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-400">{profile?.role === 'admin' ? 'Admin' : 'Viewer'}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="p-3 border-b border-gray-600">
                    <p className="text-sm font-medium text-white truncate">{profile?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{profile?.role === 'admin' ? 'Administrator' : 'Viewer'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-600 transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-full max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
