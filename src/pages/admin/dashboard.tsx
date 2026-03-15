import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function AdminDashboard() {
  const { session, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p>You must be logged in to access the admin panel.</p>
            <Link href="/login" className="text-blue-400 hover:underline mt-4 inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 mb-8">Logged in as: <strong>{session?.user?.email}</strong></p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Advertisement Management */}
          <Link href="/admin/advertisements">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg p-6 cursor-pointer transition">
              <h2 className="text-2xl font-bold mb-2">📢 Advertisement Management</h2>
              <p className="text-gray-400 mb-4">View all advertisements and manage content.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ View all ads from all advertisers</li>
                <li>✓ Deactivate offensive content</li>
                <li>✓ Delete inappropriate ads</li>
                <li>✓ Monitor impressions and clicks</li>
              </ul>
            </div>
          </Link>

          {/* Placeholder for future features */}
          <div className="bg-slate-800 rounded-lg p-6 opacity-50">
            <h2 className="text-2xl font-bold mb-2">👥 User Management</h2>
            <p className="text-gray-400 mb-4">Coming soon...</p>
            <ul className="text-sm text-gray-400 space-y-1">
                <li>• Manage user accounts</li>
                <li>• Review account status</li>
                <li>• Handle disputes</li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
