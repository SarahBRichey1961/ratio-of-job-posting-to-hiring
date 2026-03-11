import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface Ad {
  id: string
  title: string
  description: string
  banner_image_url: string
  banner_height: number
  click_url: string
  alt_text: string
  is_active: boolean
  impressions: number
  clicks: number
  created_at: string
}

interface AdvertiserAccount {
  id: string
  company_name: string
  website?: string
  contact_email?: string
  payment_status: string
  subscription_type?: string
  subscription_end_date?: string
}

export default function AdvertiserDashboard() {
  const { session, user } = useAuth()
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [account, setAccount] = useState<AdvertiserAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [previewAdIndex, setPreviewAdIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    banner_image_url: '',
    banner_height: 80,
    click_url: '',
    alt_text: ''
  })

  // Track client-side hydration to prevent flashing
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not logged in or create advertiser account if needed
  useEffect(() => {
    if (!mounted) return

    if (!session) {
      router.push('/auth/login?redirect=/advertiser/dashboard')
      return
    }

    // Ensure advertiser account exists
    const ensureAdvertiserAccount = async () => {
      try {
        const response = await fetch('/api/monetization/advertiser', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error('Failed to ensure advertiser account:', response.status)
        }
      } catch (err) {
        console.error('Error ensuring advertiser account:', err)
      }
    }

    ensureAdvertiserAccount()
  }, [session, router])

  // Fetch ads and account details
  useEffect(() => {
    if (session) {
      fetchAds()
      fetchAccountDetails()
    }
  }, [session])

  const fetchAccountDetails = async () => {
    try {
      const response = await fetch('/api/monetization/advertiser', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account details')
      }

      const data = await response.json()
      setAccount(data)
    } catch (err) {
      console.error('Error fetching account details:', err)
    }
  }

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monetization/ads', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ads')
      }

      const data = await response.json()
      setAds(data || [])
    } catch (err) {
      console.error('Error fetching ads:', err)
      setError('Failed to load your ads')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, banner_image_url: base64String })
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    // Validate form data
    if (!formData.title || !formData.banner_image_url || !formData.click_url) {
      setError('Please fill in all required fields: Title, Banner Image, and Click URL')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/monetization/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.message || `Failed to create ad (Status: ${response.status})`
        setError(errorMsg)
        setSubmitting(false)
        return
      }

      // Success - ad was created
      const newAd = responseData
      setAds([newAd, ...ads])
      setFormData({
        title: '',
        description: '',
        banner_image_url: '',
        banner_height: 80,
        click_url: '',
        alt_text: ''
      })
      setImagePreview('')
      setShowForm(false)
      setSuccess(`✓ Advertisement "${newAd.title}" created successfully! It will start rotating on your selected pages.`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      const errorMsg = (err as Error).message || 'An unexpected error occurred while creating your advertisement'
      setError(`Error: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return

    try {
      const response = await fetch(`/api/monetization/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete ad')
      }

      setAds(ads.filter(ad => ad.id !== adId))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!mounted || !session || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Advertiser Dashboard - Take The Reins</title>
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hub')}
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              ← Back to Hub
            </button>
          </div>
          <h1 className="text-xl font-bold text-white">Advertiser Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/auth/signup')}
              className="text-slate-300 hover:text-white transition text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-700"
            >
              + Invite New Advertiser
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-600/20 border border-green-600/50 text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Account Status Card */}
        {account && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Company Name</p>
                <p className="text-white font-medium">{account.company_name || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Payment Status</p>
                <p className={`font-medium ${
                  account.payment_status === 'paid' ? 'text-green-400' : 
                  account.payment_status === 'pending' ? 'text-yellow-400' : 
                  'text-gray-400'
                }`}>
                  {account.payment_status}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Subscription Type</p>
                <p className="text-white font-medium">{account.subscription_type || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Ads</p>
                <p className="text-white font-medium">{ads.filter(a => a.is_active).length}/{ads.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Your Advertisements</h2>
            <p className="text-slate-400 mt-1">
              {ads.length} of 50 active ads
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setImagePreview('')
                setFormData({
                  title: '',
                  description: '',
                  banner_image_url: '',
                  banner_height: 80,
                  click_url: '',
                  alt_text: ''
                })
              }
            }}
            disabled={ads.length >= 50}
            className={`font-semibold py-2 px-6 rounded-lg transition ${
              ads.length >= 50
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {showForm ? 'Cancel' : '+ Create New Ad'}
          </button>
        </div>

        {/* Ad Creation Form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Create Advertisement</h3>
            <form onSubmit={handleCreateAd} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Ad Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Your ad title"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Click URL</label>
                  <input
                    type="url"
                    required
                    value={formData.click_url}
                    onChange={(e) => setFormData({ ...formData, click_url: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Banner Image (JPEG/PNG)</label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                <p className="text-slate-400 text-xs mt-1">Recommended: 1200x80px • Max 5MB</p>
              </div>

              {imagePreview && (
                <div>
                  <label className="block text-white font-semibold mb-2">Image Preview</label>
                  <div className="rounded-lg overflow-hidden border border-slate-600 bg-slate-900" style={{ maxHeight: '200px' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Banner Height (px)</label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={formData.banner_height}
                    onChange={(e) => setFormData({ ...formData, banner_height: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Alt Text</label>
                  <input
                    type="text"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Alt text for accessibility"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  rows={3}
                  placeholder="Optional: Internal notes about this ad"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formData.title || !formData.banner_image_url || !formData.click_url}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition ${
                  submitting || !formData.title || !formData.banner_image_url || !formData.click_url
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {submitting ? 'Creating Advertisement...' : 'Create Advertisement'}
              </button>
            </form>
          </div>
        )}

        {/* Ads List */}
        {ads.length === 0 && !showForm ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400 text-lg mb-4">No advertisements yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Create Your First Ad
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Ad Preview */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-white mb-2">{ad.title}</h4>
                    {ad.banner_image_url && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-slate-600" style={{ height: `${ad.banner_height}px` }}>
                        <img
                          src={ad.banner_image_url}
                          alt={ad.alt_text}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-slate-400 text-sm">
                      <strong>URL:</strong>{' '}
                      <a href={ad.click_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                        {ad.click_url}
                      </a>
                    </p>
                  </div>

                  {/* Stats and Actions */}
                  <div className="md:w-64 flex flex-col gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide">Impressions</p>
                        <p className="text-2xl font-bold text-white">{ad.impressions}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide">Clicks</p>
                        <p className="text-2xl font-bold text-white">{ad.clicks}</p>
                      </div>
                      {ad.impressions > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wide">CTR</p>
                          <p className="text-lg font-semibold text-indigo-400">
                            {((ad.clicks / ad.impressions) * 100).toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold py-2 px-4 rounded-lg transition border border-red-600/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Ad Preview */}
        {ads.length > 0 && (
          <div className="mt-12 border-t border-slate-700 pt-8">
            <h3 className="text-2xl font-bold text-white mb-6">Live Preview (How Your Ads Appear)</h3>
            <p className="text-slate-400 mb-4">Ads rotate every 2 minutes. Click to view full size.</p>
            
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-400">
                  Showing ad {previewAdIndex + 1} of {ads.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewAdIndex((prev) => (prev - 1 + ads.length) % ads.length)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setPreviewAdIndex((prev) => (prev + 1) % ads.length)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {ads[previewAdIndex] && (
                <div className="rounded-lg overflow-hidden border border-slate-600 cursor-pointer hover:border-slate-500 transition group bg-slate-900">
                  <a
                    href={ads[previewAdIndex].click_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <div style={{ height: `${ads[previewAdIndex].banner_height}px`, overflow: 'hidden' }}>
                      <img
                        src={ads[previewAdIndex].banner_image_url}
                        alt={ads[previewAdIndex].alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  </a>
                  <div className="p-3 bg-slate-800">
                    <p className="text-white font-semibold text-sm">{ads[previewAdIndex].title}</p>
                    <p className="text-slate-400 text-xs mt-1">Impressions: {ads[previewAdIndex].impressions} | Clicks: {ads[previewAdIndex].clicks}</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4 text-center">
                Preview shows how ads will cycle through on the Hub, Search, and Comparison pages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
