import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Card, Section } from '@/components/DashboardUI'

export default function AuthPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  return (
    <DashboardLayout>
      <PageHeader title="Authentication" description="Sign in to your JobScore account" />

      <div className="max-w-md mx-auto">
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Handle auth
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>

          <p className="text-center text-gray-400 text-sm mt-4">
            Demo credentials available - contact support
          </p>
        </Card>
      </div>
    </DashboardLayout>
  )
}
