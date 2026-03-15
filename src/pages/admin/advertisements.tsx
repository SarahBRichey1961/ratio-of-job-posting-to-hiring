import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'

interface Ad {
  id: string
  title: string
  description: string
  banner_image_url: string
  is_active: boolean
  impressions: number
  clicks: number
  created_at: string
  updated_at: string
  advertiser_id: string
  advertiser_accounts?: {
    company_name: string
    user_id: string
  }
  expires_at: string | null
}

export default function AdminAdvertisementsPage() {
  const { session, isAuthenticated } = useAuth()
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedAd, setSelectedAd] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    fetchAllAds()
  }, [isAuthenticated, session])

  const fetchAllAds = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = session?.access_token
      if (!token) {
        setError('No session token available')
        return
      }

      const response = await fetch('/api/admin/advertisements', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch ads')
        return
      }

      setAdminUser(data.admin_user)
      setAds(data.ads || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (adId: string, currentStatus: boolean) => {
    try {
      setActionInProgress(adId)

      const token = session?.access_token
      if (!token) {
        setError('No session token available')
        return
      }

      const response = await fetch('/api/admin/advertisements', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: adId,
          action: currentStatus ? 'deactivate' : 'activate',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update ad')
        return
      }

      // Refresh ads
      fetchAllAds()
      alert(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeleteAd = async (adId: string, adTitle: string) => {
    if (!confirm(`Are you sure you want to DELETE the ad "${adTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setActionInProgress(adId)

      const token = session?.access_token
      if (!token) {
        setError('No session token available')
        return
      }

      const response = await fetch('/api/admin/advertisements', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: adId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete ad')
        return
      }

      // Remove from UI and refresh
      setAds(ads.filter(a => a.id !== adId))
      alert(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ad')
    } finally {
      setActionInProgress(null)
    }
  }

  const filteredAds = ads.filter(ad => {
    if (filterStatus === 'active') return ad.is_active
    if (filterStatus === 'inactive') return !ad.is_active
    return true
  })

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
              <h1 className="text-4xl font-bold mb-2">Ad Management</h1>
              <p className="text-gray-400">Admin Panel - Manage all advertisements</p>
              <p className="text-sm text-gray-500 mt-2">Logged in as: <strong>{adminUser}</strong></p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Back to Admin
            </Link>
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
            <p className="text-gray-400">Loading advertisements...</p>
          </div>
        )}

        {/* No Ads */}
        {!isLoading && ads.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No advertisements found in the system</p>
          </div>
        )}

        {/* Filter and Stats */}
        {!isLoading && ads.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Ads</p>
                <p className="text-3xl font-bold">{ads.length}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-400">{ads.filter(a => a.is_active).length}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Inactive</p>
                <p className="text-3xl font-bold text-yellow-400">{ads.filter(a => !a.is_active).length}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Impressions</p>
                <p className="text-3xl font-bold">{ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                All ({ads.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Active ({ads.filter(a => a.is_active).length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterStatus === 'inactive'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Inactive ({ads.filter(a => !a.is_active).length})
              </button>
            </div>

            {/* Ads Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-300">Ad Title</th>
                    <th className="text-left py-3 px-4 text-gray-300">Advertiser</th>
                    <th className="text-center py-3 px-4 text-gray-300">Status</th>
                    <th className="text-center py-3 px-4 text-gray-300">Impressions</th>
                    <th className="text-center py-3 px-4 text-gray-300">Clicks</th>
                    <th className="text-left py-3 px-4 text-gray-300">Created</th>
                    <th className="text-center py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map(ad => (
                    <tr
                      key={ad.id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedAd(selectedAd === ad.id ? null : ad.id)}
                          className="text-blue-400 hover:underline text-left"
                        >
                          {ad.title.substring(0, 50)}
                          {ad.title.length > 50 ? '...' : ''}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {ad.advertiser_accounts?.company_name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ad.is_active
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-yellow-900/50 text-yellow-300'
                          }`}
                        >
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{ad.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center text-sm">{ad.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(ad.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(ad.id, ad.is_active)}
                            disabled={actionInProgress === ad.id}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              ad.is_active
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-green-600 hover:bg-green-700'
                            } disabled:opacity-50`}
                          >
                            {ad.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id, ad.title)}
                            disabled={actionInProgress === ad.id}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ad Details Section */}
            {selectedAd && (
              <div className="mt-8 bg-slate-800 rounded-lg p-6">
                {(() => {
                  const ad = ads.find(a => a.id === selectedAd)
                  if (!ad) return null
                  return (
                    <>
                      <h3 className="text-2xl font-bold mb-4">{ad.title}</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Preview</h4>
                          <img
                            src={ad.banner_image_url}
                            alt={ad.title}
                            className="w-full rounded-lg max-h-40 object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Details</h4>
                          <p className="text-sm mb-2">
                            <strong>Description:</strong> {ad.description}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Advertiser:</strong> {ad.advertiser_accounts?.company_name}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Status:</strong>{' '}
                            <span className={ad.is_active ? 'text-green-400' : 'text-yellow-400'}>
                              {ad.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Created:</strong> {new Date(ad.created_at).toLocaleString()}
                          </p>
                          {ad.expires_at && (
                            <p className="text-sm mb-2">
                              <strong>Expires:</strong> {new Date(ad.expires_at).toLocaleString()}
                            </p>
                          )}
                        </div>
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
