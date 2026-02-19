import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

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
    label: 'QA Status',
    href: '/dashboard/qa',
    icon: '✅',
    description: 'System health check',
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 transition-all duration-300 overflow-y-auto border-r border-gray-700`}
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
        <header className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {navItems.find((item) => item.href === router.pathname)?.label || 'Dashboard'}
          </h2>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              👤
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 bg-gray-900 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
