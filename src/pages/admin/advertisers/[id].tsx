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
  subscription_end_date?: string
  advertiser_email?: string
  created_at: string
  updated_at: string
  ads?: any[]
  ad_count: number
}

export default function AdminAdvertiserDetailPage() {
  const router = useRouter()
  const { session, isAdmin } = useAuth()
  const { id } = router.query as { id: string }

  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    contact_email: '',
    payment_status: ''
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/admin/advertisers')
      return
    }

    if (!isAdmin) {
      router.push('/hub')
      return
    }

    if (id) {
      fetchAdvertiser()
    }
  }, [session, isAdmin, id])

  const fetchAdvertiser = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/admin/advertisers/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch advertiser')
      }

      const data = await response.json()
      setAdvertiser(data)
      setFormData({
        company_name: data.company_name || '',
        website: data.website || '',
        contact_email: data.contact_email || '',
        payment_status: data.payment_status || ''
      })
    } catch (err: any) {
      console.error('Error fetching advertiser:', err)
      setError(err.message || 'Failed to load advertiser')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/advertisers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save advertiser')
      }

      setSuccess('Advertiser updated successfully')
      setEditMode(false)
      fetchAdvertiser()
    } catch (err: any) {
      console.error('Error saving advertiser:', err)
      setError(err.message || 'Failed to save advertiser')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading advertiser details...</div>
      </div>
    )
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/admin/advertisers">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4">
              ← Back to Advertisers
            </button>
          </Link>
          <div className="text-gray-600">Advertiser not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Admin - {advertiser.company_name || 'Advertiser'}</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/admin/advertisers">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4">
            ← Back to Advertisers
          </button>
        </Link>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Account Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{advertiser.company_name || 'Unnamed Advertiser'}</h1>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                editMode
                  ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="p-6">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Advertiser Email</p>
                  <p className="text-base font-medium text-gray-900">{advertiser.advertiser_email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <p className="text-base font-medium text-gray-900">
                    {advertiser.website ? (
                      <a href={advertiser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {advertiser.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Contact Email</p>
                  <p className="text-base font-medium text-gray-900">{advertiser.contact_email || '—'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      advertiser.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      advertiser.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {advertiser.payment_status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Subscription Type</p>
                  <p className="text-base font-medium text-gray-900">{advertiser.subscription_type || '—'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(advertiser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advertisements Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Advertisements ({advertiser.ad_count})</h2>
          </div>

          <div className="p-6">
            {!advertiser.ads || advertiser.ads.length === 0 ? (
              <p className="text-gray-500">No advertisements created yet</p>
            ) : (
              <div className="space-y-4">
                {advertiser.ads.map(ad => (
                  <div key={ad.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{ad.title}</h3>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium">{ad.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impressions</p>
                        <p className="font-medium">{ad.impressions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clicks</p>
                        <p className="font-medium">{ad.clicks}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
