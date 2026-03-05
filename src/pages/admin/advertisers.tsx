import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

interface Advertiser {
  id: string
  user_id: string
  company_name: string
  website?: string
  contact_email?: string
  payment_status: string
  subscription_type?: string
  created_at: string
  ad_count: number
}

export default function AdminAdvertisersPage() {
  const router = useRouter()
  const { session, isAdmin } = useAuth()
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/advertisers')
      return
    }

    if (!isAdmin) {
      router.push('/hub')
      return
    }

    fetchAdvertisers()
  }, [session, isAdmin])

  const fetchAdvertisers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/advertisers', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch advertisers')
      }

      const data = await response.json()
      setAdvertisers(data)
    } catch (err: any) {
      console.error('Error fetching advertisers:', err)
      setError(err.message || 'Failed to load advertisers')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin - Advertiser Management</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/hub">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4">
              ← Back to Hub
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Advertiser Management</h1>
          <p className="text-gray-600 mt-2">View and manage all advertiser accounts</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500">Loading advertisers...</div>
          </div>
        )}

        {/* Advertisers Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {advertisers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No advertisers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Company</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Contact Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Website</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ads</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advertisers.map((advertiser, idx) => (
                      <tr key={advertiser.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {advertiser.company_name || 'Unnamed'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {advertiser.contact_email || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {advertiser.website ? (
                            <a href={advertiser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {advertiser.website}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(advertiser.payment_status)}`}>
                            {advertiser.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {advertiser.ad_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(advertiser.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/admin/advertisers/${advertiser.id}`}>
                            <button className="text-blue-600 hover:text-blue-700 font-medium">
                              View/Edit
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Stats */}
            {!loading && advertisers.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
                <p>Total Advertisers: {advertisers.length} | Paid: {advertisers.filter(a => a.payment_status === 'paid').length}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
