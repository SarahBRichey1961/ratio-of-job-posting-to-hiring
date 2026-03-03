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

export default function AdvertiserDashboard() {
  const { session, user } = useAuth()
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    banner_image_url: '',
    banner_height: 80,
    click_url: '',
    alt_text: ''
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      router.push('/auth/login?redirect=/advertiser/dashboard')
    }
  }, [session, router])

  // Fetch ads
  useEffect(() => {
    if (session) {
      fetchAds()
    }
  }, [session])

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

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/monetization/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create ad')
      }

      const newAd = await response.json()
      setAds([newAd, ...ads])
      setFormData({
        title: '',
        description: '',
        banner_image_url: '',
        banner_height: 80,
        click_url: '',
        alt_text: ''
      })
      setShowForm(false)
    } catch (err) {
      setError((err as Error).message)
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

  if (loading) {
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
          <button
            onClick={() => router.push('/hub')}
            className="text-slate-300 hover:text-white transition text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Advertiser Dashboard</h1>
          <div className="w-12"></div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Your Advertisements</h2>
            <p className="text-slate-400 mt-1">
              You have {ads.length} active ad{ads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
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
                <label className="block text-white font-semibold mb-2">Banner Image URL</label>
                <input
                  type="url"
                  required
                  value={formData.banner_image_url}
                  onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-slate-400 text-xs mt-1">Recommended: 1200x80px or similar aspect ratio</p>
              </div>

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
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Create Advertisement
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
      </div>
    </div>
  )
}
