import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

export default function NewCampaign() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email_subject: '',
    email_body_html: '',
    target_audience_segment: 'custom',
    list_source: 'imported',
    utm_campaign: '',
  })

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          router.push('/marketing/launcher')
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setUserId(session.user.id)
        } else {
          router.push('/hub/login?redirect=/marketing/launcher/new')
        }
      } catch (err) {
        console.error('Error getting user:', err)
        router.push('/hub/login?redirect=/marketing/launcher/new')
      }
    }
    getUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!userId) {
      setError('User ID not available. Please refresh the page.')
      return
    }

    if (!formData.name || !formData.email_subject || !formData.email_body_html) {
      setError('Name, email subject, and email body are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = getSupabase()
      if (!supabase) {
        setError('Connection error. Please try again.')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Authentication token not available. Please log in again.')
        return
      }

      const response = await axios.post('/api/marketing/campaigns', formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      router.push(`/marketing/launcher/${response.data.id}`)
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError((err as any).response?.data?.error || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Head>
        <title>Create New Campaign - Marketing Launcher</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/marketing/launcher')}
            className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-2">Design and configure your email campaign</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Campaign Info */}
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-gray-900">Campaign Information</legend>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Q1 Product Launch - Jobseekers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-gray-500 text-sm mt-1">Internal name to track this campaign</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional notes about this campaign's goals and audience"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </fieldset>

          {/* Email Content */}
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-gray-900">Email Content</legend>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject *</label>
              <input
                type="text"
                name="email_subject"
                value={formData.email_subject}
                onChange={handleInputChange}
                placeholder="e.g., Introducing Take The Reigns - Job Hiring Platform"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-gray-500 text-sm mt-1">Recipients will see this in their inbox</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Body (HTML) *</label>
              <textarea
                name="email_body_html"
                value={formData.email_body_html}
                onChange={handleInputChange}
                placeholder="Paste your HTML email template here. Use [RECIPIENT_NAME] for personalization."
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-gray-500 text-sm mt-1">
                Supports HTML. Use [RECIPIENT_NAME] to personalize messages. Include tracking pixel at the end.
              </p>
            </div>
          </fieldset>

          {/* Campaign Settings */}
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-gray-900">Campaign Settings</legend>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  name="target_audience_segment"
                  value={formData.target_audience_segment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="custom">Custom List</option>
                  <option value="unemployed">Unemployed / Job Seekers</option>
                  <option value="hired">Recently Hired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Source</label>
                <select
                  name="list_source"
                  value={formData.list_source}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="imported">Imported CSV</option>
                  <option value="internal">Internal Subscribers</option>
                  <option value="hunter">Hunter.io</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UTM Campaign Tag</label>
              <input
                type="text"
                name="utm_campaign"
                value={formData.utm_campaign}
                onChange={handleInputChange}
                placeholder="Auto-filled with campaign name if left blank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-sm mt-1">Used for Google Analytics tracking</p>
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {loading ? 'Creating...' : '✓ Create Campaign'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/marketing/launcher')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
