import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          setError('Connection error')
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setUserId(session.user.id)
          fetchCampaigns(session.access_token)
        }
      } catch (err) {
        console.error('Error getting user:', err)
        setError('Failed to authenticate')
      }
    }
    getUser()
  }, [])

  const fetchCampaigns = async (token: string) => {
    try {
      setLoading(true)
      const response = await axios.get('/api/marketing/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCampaigns(response.data.data || [])
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
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
              <Link key={campaign.id} href={`/marketing/launcher/${campaign.id}`}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer p-6">
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
                </div>
              </Link>
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
