import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface Sponsor {
  id: string
  user_id: string
  user_email: string
  is_sponsor: boolean
  sponsor_name: string | null
  logo_url: string | null
  sponsor_tier: string
  created_at: string
  updated_at: string
}

export default function AdminSponsorsPage() {
  const { session, isAuthenticated } = useAuth()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<string>('')
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    fetchSponsors()
  }, [isAuthenticated, session])

  const fetchSponsors = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = session?.access_token
      if (!token) {
        setError('No session token available')
        return
      }

      const response = await fetch('/api/admin/sponsors', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch sponsors')
        return
      }

      setAdminUser(data.admin_user)
      setSponsors(data.sponsors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sponsors')
    } finally {
      setIsLoading(false)
    }
  }

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Sponsors Management</h1>
              <p className="text-gray-400">View and manage all platform sponsors</p>
              <p className="text-sm text-gray-500 mt-2">Logged in as: <strong>{adminUser}</strong></p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/comparison"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading sponsors...</p>
          </div>
        )}

        {/* No Sponsors */}
        {!isLoading && sponsors.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No sponsors found in the system</p>
          </div>
        )}

        {/* Stats and Content */}
        {!isLoading && sponsors.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Sponsors</p>
                <p className="text-3xl font-bold">{sponsors.length}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Premium Tier</p>
                <p className="text-3xl font-bold text-purple-400">
                  {sponsors.filter(s => s.sponsor_tier === 'premium').length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Basic Tier</p>
                <p className="text-3xl font-bold text-blue-400">
                  {sponsors.filter(s => s.sponsor_tier === 'basic').length}
                </p>
              </div>
            </div>

            {/* Sponsors Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-300">Sponsor Name</th>
                    <th className="text-left py-3 px-4 text-gray-300">Email</th>
                    <th className="text-center py-3 px-4 text-gray-300">Tier</th>
                    <th className="text-center py-3 px-4 text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                    <th className="text-center py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map(sponsor => (
                    <tr
                      key={sponsor.id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedSponsor(selectedSponsor === sponsor.id ? null : sponsor.id)}
                          className="text-blue-400 hover:underline text-left font-medium"
                        >
                          {sponsor.sponsor_name || 'Unnamed Sponsor'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{sponsor.user_email}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sponsor.sponsor_tier === 'premium'
                              ? 'bg-purple-900/50 text-purple-300'
                              : 'bg-blue-900/50 text-blue-300'
                          }`}
                        >
                          {sponsor.sponsor_tier?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sponsor.is_sponsor
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-900/50 text-gray-300'
                          }`}
                        >
                          {sponsor.is_sponsor ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(sponsor.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sponsor.logo_url && (
                          <a
                            href={sponsor.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View Logo
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sponsor Details Section */}
            {selectedSponsor && (
              <div className="mt-8 bg-slate-800 rounded-lg p-6">
                {(() => {
                  const sponsor = sponsors.find(s => s.id === selectedSponsor)
                  if (!sponsor) return null
                  return (
                    <>
                      <h3 className="text-2xl font-bold mb-4">{sponsor.sponsor_name || 'Unnamed Sponsor'}</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Logo</h4>
                          {sponsor.logo_url ? (
                            <img
                              src={sponsor.logo_url}
                              alt={sponsor.sponsor_name}
                              className="w-full rounded-lg max-h-40 object-contain bg-slate-900 p-4"
                            />
                          ) : (
                            <div className="w-full h-40 rounded-lg bg-slate-900 flex items-center justify-center">
                              <p className="text-gray-400">No logo provided</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-4">Details</h4>
                          <div className="space-y-3">
                            <p className="text-sm">
                              <strong>Email:</strong> {sponsor.user_email}
                            </p>
                            <p className="text-sm">
                              <strong>Tier:</strong>{' '}
                              <span
                                className={
                                  sponsor.sponsor_tier === 'premium'
                                    ? 'text-purple-400'
                                    : 'text-blue-400'
                                }
                              >
                                {sponsor.sponsor_tier?.toUpperCase()}
                              </span>
                            </p>
                            <p className="text-sm">
                              <strong>Status:</strong>{' '}
                              <span className={sponsor.is_sponsor ? 'text-green-400' : 'text-gray-400'}>
                                {sponsor.is_sponsor ? 'Active Sponsor' : 'Inactive'}
                              </span>
                            </p>
                            <p className="text-sm">
                              <strong>Joined:</strong> {new Date(sponsor.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <strong>Last Updated:</strong> {new Date(sponsor.updated_at).toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <strong>User ID:</strong>{' '}
                              <span className="text-xs font-mono text-gray-400 break-all">{sponsor.user_id}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Note about payments */}
                      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <p className="text-yellow-300 text-sm">
                          <strong>Note:</strong> Credit card details are securely stored with our payment processor (Paddle) and are not displayed here for security reasons.
                          Contact the sponsor directly for payment inquiries.
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
