import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  email_subject: string
  status: string
  estimated_reach: number
  created_at: string
  sent_at?: string
}

export default function MarketingLauncher() {
  const { session, isLoading: authLoading } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    console.log('🚀 MarketingLauncher useEffect: session=', !!session, 'authLoading=', authLoading)
    
    // If we already have a session with access token, fetch immediately
    // Don't wait for authLoading - the presence of session means auth is complete
    if (session?.access_token) {
      console.log('✅ Session with access_token available, fetching campaigns immediately')
      fetchCampaigns(session.access_token)
      return
    }

    // If still loading auth and no session yet, wait
    if (authLoading) {
      console.log('⏳ Auth loading and no session yet, waiting...')
      return
    }

    // No session and auth finished loading
    console.error('❌ No session after auth complete')
    setError('Authentication required')
    setLoading(false)
  }, [session, authLoading])

  const fetchCampaigns = async (token: string) => {
      console.log('📨 Fetching campaigns with token...')
      console.log('🔐 Token length:', token.length)
      console.log('📝 API endpoint: /api/marketing/campaigns')
      
      setLoading(true)
      const response = await axios.get('/api/marketing/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      })
      
      const campaignsList = response.data.data || []
      console.log(`✅ Campaigns API response status: ${response.status}`)
      console.log(`✅ Campaigns fetched: ${campaignsList.length} campaigns`)
      console.log('📊 Campaign data:', campaignsList)
      
      setCampaigns(campaignsList)
      setError('')
    } catch (err) {
      const e = err as any
      console.error('❌ Error fetching campaigns:')
      console.error('   - Error type:', e?.code)
      console.error('   - Status:', e?.response?.status)
      console.error('   - Status text:', e?.response?.statusText)
      console.error('   - Response data:', e?.response?.data)
      console.error('   - Full error:', e)
      
      // Provide meaningful error messages
      if (e?.response?.status === 401) {
        setError('Authentication failed - please log in again')
      } else if (e?.response?.status === 403) {
        setError('You do not have permission to access campaigns')
      } else if (e?.response?.status === 404) {
        setError('Campaigns endpoint not found')
      } else if (e?.code === 'ECONNABORTED') {
        setError('Request timed out - please try again')
      } else {
        setError(`Failed to load campaigns: ${e?.message || 'Unknown error'}`)
      }
      
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, campaignId: string, campaignName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.access_token) return
    if (!confirm(`Delete "${campaignName}"? This cannot be undone.`)) return

    setDeletingId(campaignId)
    try {
      await axios.delete(`/api/marketing/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      setCampaigns(prev => prev.filter(c => c.id !== campaignId))
    } catch (err) {
      setError((err as any)?.response?.data?.error || 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800'
      case 'scheduled':
        return 'bg-blue-200 text-blue-800'
      case 'sent':
        return 'bg-green-200 text-green-800'
      case 'completed':
        return 'bg-green-600 text-white'
      case 'paused':
        return 'bg-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Head>
        <title>Marketing Launcher - Email Campaigns</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/hub"
                className="text-gray-600 hover:text-gray-900 transition text-sm font-medium"
              >
                ← Back to Hub
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">🚀 Marketing Launcher</h1>
                <p className="text-gray-600 mt-2">Launch projects to target audiences via email campaigns</p>
              </div>
            </div>
            <Link
              href="/marketing/launcher/new"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              + New Campaign
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-6">No campaigns yet. Create your first campaign to get started!</p>
            <Link
              href="/marketing/launcher/new"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <Link href={`/marketing/launcher/${campaign.id}`} className="block">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                      <p className="text-gray-600 mt-1 line-clamp-2">{campaign.email_subject}</p>
                      <div className="mt-4 flex gap-4 text-sm text-gray-500">
                        <span>📧 {campaign.estimated_reach} recipients</span>
                        <span>📅 {new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(campaign.status)}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                </Link>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={(e) => handleDelete(e, campaign.id, campaign.name)}
                    disabled={deletingId === campaign.id}
                    className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition"
                  >
                    {deletingId === campaign.id ? 'Deleting...' : '🗑 Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Overview */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Create Campaigns</h3>
            <p className="text-gray-600">
              Compose professional email campaigns with HTML templates. Define target audiences and tracking parameters.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📧 Send at Scale</h3>
            <p className="text-gray-600">
              Upload recipient lists or import from databases. Send campaigns to hundreds or thousands of people easily.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Track Results</h3>
            <p className="text-gray-600">
              Monitor open rates, click rates, and conversions. Track campaign ROI with integrated Google Analytics.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
