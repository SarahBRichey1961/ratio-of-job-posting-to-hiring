import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'
import RecipientUploader from '@/components/RecipientUploader'

interface Campaign {
  id: string
  name: string
  description?: string
  email_subject: string
  email_body_html: string
  status: 'draft' | 'scheduled' | 'sent' | 'completed' | 'paused'
  target_audience_segment: string
  list_source: string
  utm_campaign: string
  created_at: string
  scheduled_for?: string
  sent_at?: string
}

interface Analytics {
  total_recipients: number
  sent: number
  bounced: number
  opened: number
  clicked: number
  converted: number
  open_rate: number
  click_through_rate: number
  conversion_rate: number
}

export default function CampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sending, setSending] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    email_subject: '',
    email_body_html: '',
    target_audience_segment: '',
    list_source: '',
    utm_campaign: '',
  })

  useEffect(() => {
    if (!id) return

    const fetchCampaign = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase?.auth.getSession() || {}

        if (!session?.access_token) {
          router.push('/hub/login?redirect=/marketing/launcher')
          return
        }

        setAccessToken(session.access_token)

        const response = await axios.get(`/api/marketing/campaigns/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        setCampaign(response.data)
        setEditData({
          name: response.data.name,
          description: response.data.description || '',
          email_subject: response.data.email_subject,
          email_body_html: response.data.email_body_html,
          target_audience_segment: response.data.target_audience_segment,
          list_source: response.data.list_source,
          utm_campaign: response.data.utm_campaign,
        })

        // Fetch analytics
        try {
          const analyticsResponse = await axios.get(`/api/marketing/campaigns/${id}/analytics`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          setAnalytics(analyticsResponse.data)
        } catch (err) {
          console.log('Analytics not yet available')
        }
      } catch (err) {
        console.error('Error fetching campaign:', err)
        setError((err as any).response?.data?.error || 'Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [id, router])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (!id) return

    setSaving(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase?.auth.getSession() || {}

      if (!session?.access_token) {
        setError('Session expired. Please log in again.')
        return
      }

      const response = await axios.put(`/api/marketing/campaigns/${id}`, editData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      setCampaign(response.data)
      setEditMode(false)
    } catch (err) {
      console.error('Error saving campaign:', err)
      setError((err as any).response?.data?.error || 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setDeleting(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase?.auth.getSession() || {}

      if (!session?.access_token) {
        setError('Session expired. Please log in again.')
        return
      }

      await axios.delete(`/api/marketing/campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      router.push('/marketing/launcher')
    } catch (err) {
      console.error('Error deleting campaign:', err)
      setError((err as any).response?.data?.error || 'Failed to delete campaign')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!id) return

    setSending(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase?.auth.getSession() || {}

      if (!session?.access_token) {
        setError('Session expired. Please log in again.')
        return
      }

      const response = await axios.post(
        `/api/marketing/campaigns/${id}/send`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Update campaign status to 'sent'
      setCampaign((prev) =>
        prev
          ? {
              ...prev,
              status: 'sent' as const,
              sent_at: new Date().toISOString(),
            }
          : null
      )

      // Show success message
      setError('')
      alert(
        `Campaign sent successfully!\n\n📧 Emails sent: ${response.data.sent}\n❌ Failed: ${response.data.failed}`
      )
    } catch (err) {
      console.error('Error sending campaign:', err)
      const errorMessage =
        (err as any).response?.data?.error ||
        (err as any).response?.data?.message ||
        'Failed to send campaign'
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sent: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-700">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button
              onClick={() => router.push('/marketing/launcher')}
              className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 mb-4"
            >
              ← Back
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Campaign not found'}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Head>
        <title>{campaign.name} - Marketing Launcher</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/marketing/launcher')}
            className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 mb-4"
          >
            ← Back to Campaigns
          </button>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-purple-500 w-full"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${statusColors[campaign.status]}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>

            {!editMode && campaign.status === 'draft' && (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Edit
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-2">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {editMode ? (
          // Edit Mode
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
            className="bg-white rounded-lg shadow-lg p-8 space-y-6"
          >
            <fieldset className="space-y-4">
              <legend className="text-xl font-bold text-gray-900">Campaign Details</legend>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editData.description || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  name="email_subject"
                  value={editData.email_subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML)</label>
                <textarea
                  name="email_body_html"
                  value={editData.email_body_html}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    name="target_audience_segment"
                    value={editData.target_audience_segment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="custom">Custom List</option>
                    <option value="unemployed">Unemployed / Job Seekers</option>
                    <option value="hired">Recently Hired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Source</label>
                  <select
                    name="list_source"
                    value={editData.list_source}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="imported">Imported CSV</option>
                    <option value="internal">Internal Subscribers</option>
                    <option value="hunter">Hunter.io</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Campaign Tag</label>
                <input
                  type="text"
                  name="utm_campaign"
                  value={editData.utm_campaign}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </fieldset>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false)
                  if (campaign) {
                    setEditData({
                      name: campaign.name,
                      description: campaign.description || '',
                      email_subject: campaign.email_subject,
                      email_body_html: campaign.email_body_html,
                      target_audience_segment: campaign.target_audience_segment,
                      list_source: campaign.list_source,
                      utm_campaign: campaign.utm_campaign,
                    })
                  }
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="space-y-8">
            {/* Campaign Summary */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Summary</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Description</p>
                  <p className="text-gray-900 mt-1">{campaign.description || '(No description)'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email Subject</p>
                  <p className="text-gray-900 mt-1">{campaign.email_subject}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Target Audience</p>
                  <p className="text-gray-900 mt-1 capitalize">{campaign.target_audience_segment}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">List Source</p>
                  <p className="text-gray-900 mt-1 capitalize">{campaign.list_source}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">UTM Campaign</p>
                  <p className="text-gray-900 mt-1 font-mono text-sm">{campaign.utm_campaign || 'Auto-assigned'}</p>
                </div>

                {campaign.scheduled_for && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Scheduled For</p>
                    <p className="text-gray-900 mt-1">{new Date(campaign.scheduled_for).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Preview</h2>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: campaign.email_body_html }}
                />
              </div>
            </div>

            {/* Recipients Management */}
            {campaign.status === 'draft' && (
              <RecipientUploader
                campaignId={campaign.id}
                accessToken={accessToken}
                onSuccess={() => {
                  // Refresh analytics
                  window.location.reload()
                }}
              />
            )}

            {/* Analytics */}
            {analytics && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Analytics</h2>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                    <p className="text-blue-600 text-sm font-semibold">Total Sent</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{analytics.sent}</p>
                    <p className="text-blue-700 text-xs mt-1">of {analytics.total_recipients} recipients</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                    <p className="text-purple-600 text-sm font-semibold">Opened</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">{analytics.opened}</p>
                    <p className="text-purple-700 text-xs mt-1">{analytics.open_rate.toFixed(1)}% open rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                    <p className="text-green-600 text-sm font-semibold">Clicked</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">{analytics.clicked}</p>
                    <p className="text-green-700 text-xs mt-1">{analytics.click_through_rate.toFixed(1)}% CTR</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Bounced</span>
                    <span className="text-2xl font-bold text-gray-900">{analytics.bounced}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Converted</span>
                    <span className="text-2xl font-bold text-gray-900">{analytics.converted}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {campaign.status === 'draft' && (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      ✎ Edit Campaign
                    </button>
                    <button
                      onClick={handleSendCampaign}
                      disabled={sending || !analytics || analytics.total_recipients === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      {sending ? '⏳ Sending...' : '✓ Send Campaign'}
                    </button>
                  </>
                )}

                {campaign.status === 'sent' && (
                  <button
                    onClick={() => {
                      // TODO: View recipients
                      alert('View recipients - coming soon')
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    👥 View Recipients
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  {deleting ? '🗑️ Deleting...' : '🗑️ Delete Campaign'}
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Delete Campaign?</h3>
                  <p className="text-gray-700 mb-6">
                    This will permanently delete "{campaign.name}" and all associated data.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold transition"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
