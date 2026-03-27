import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'

export default function NewCampaign() {
  const router = useRouter()
  const { session, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [csvRecipients, setCsvRecipients] = useState<{ email: string; name: string }[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email_subject: '',
    reply_to_email: '',
    email_body_html: '',
    target_audience_segment: 'custom',
    list_source: 'imported',
    utm_campaign: '',
  })

  useEffect(() => {
    console.log('📝 NewCampaign useEffect: session=', !!session, 'authLoading=', authLoading)
    
    if (!authLoading && !session?.user?.id) {
      console.log('🔴 No authenticated user found, redirecting to login')
      router.push('/hub/login?redirect=/marketing/launcher/new')
    }
  }, [session, authLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setError('Please select a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const parsed = lines
        .slice(1)
        .map(line => {
          const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
          const email = cols[0]?.toLowerCase()
          const name = cols[1] || email?.split('@')[0] || ''
          return { email, name }
        })
        .filter(r => r.email && r.email.includes('@'))
      if (parsed.length === 0) {
        setError('No valid email addresses found in CSV')
        return
      }
      setCsvRecipients(parsed)
      setCsvFileName(file.name)
      setError('')
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    console.log('📤 Form submit: session=', !!session, 'access_token=', !!session?.access_token)

    if (!session?.access_token) {
      console.error('❌ No access token available', { 
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
        accessTokenLength: session?.access_token?.length
      })
      setError('Authentication token not available. Please log in again.')
      return
    }

    if (!formData.name || !formData.email_subject || !formData.email_body_html) {
      setError('Name, email subject, and email body are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🚀 Creating campaign with token length:', session.access_token.length)
      const response = await axios.post('/api/marketing/campaigns', formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('✅ Campaign created:', response.data.id)

      // Upload recipients if a CSV was parsed
      if (csvRecipients.length > 0) {
        try {
          await axios.post(
            `/api/marketing/campaigns/${response.data.id}/recipients`,
            { recipients: csvRecipients },
            { headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
          )
          console.log('✅ Recipients uploaded:', csvRecipients.length)
        } catch (uploadErr) {
          console.warn('⚠️ Campaign created but recipient upload failed:', uploadErr)
          // Still redirect — user can re-upload on the detail page
        }
      }

      router.push(`/marketing/launcher/${response.data.id}`)
    } catch (err) {
      console.error('❌ Error creating campaign:', err)
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
        {authLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-semibold">🔄 Initializing authentication...</p>
            <p className="text-sm mt-1">Please wait while we verify your session.</p>
          </div>
        )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email Address</label>
              <input
                type="email"
                name="reply_to_email"
                value={formData.reply_to_email}
                onChange={handleInputChange}
                placeholder="e.g., hello@yourcompany.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-sm mt-1">When recipients hit Reply, their response goes here. Defaults to Info@take-the-reins.ai if left blank.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV Email Parameters</label>
              <p className="text-gray-600 text-sm mb-3">When uploading a CSV file, you can include these columns to personalize emails:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Parameter</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Required</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-mono text-purple-600">email</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Yes</span></td>
                      <td className="px-3 py-2 text-gray-600">Must be a valid email address</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-mono text-purple-600">name</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Optional</span></td>
                      <td className="px-3 py-2 text-gray-600">Full name - splits into first/last</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-mono text-purple-600">first_name</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Optional</span></td>
                      <td className="px-3 py-2 text-gray-600">First name only (auto-extracted from name)</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-mono text-purple-600">last_name</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Optional</span></td>
                      <td className="px-3 py-2 text-gray-600">Last name only (auto-extracted from name)</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-mono text-purple-600">target_role</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Optional</span></td>
                      <td className="px-3 py-2 text-gray-600">Job role/title of recipient</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-purple-600">target_industry</td>
                      <td className="px-3 py-2">String</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Optional</span></td>
                      <td className="px-3 py-2 text-gray-600">Industry of the recipient</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-600 text-sm mb-3"><strong>Example CSV:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">email,name,target_role</span></p>
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

          {/* CSV Upload */}
          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-gray-900">Upload Recipients (CSV)</legend>
            <p className="text-gray-600 text-sm">Upload your recipient list now, or you can do it after creating the campaign.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-sm font-semibold text-gray-700 mb-1">CSV Format:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{`email,name\njohn@example.com,John Doe\njane@example.com,Jane Smith`}</pre>
                <p className="text-xs text-gray-500 mt-1">Header row required. Name and other columns are optional.</p>
              </div>

              <div>
                <label className="block">
                  <span className="sr-only">Choose CSV file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                </label>
              </div>

              {csvFileName && csvRecipients.length > 0 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <span className="text-green-800 text-sm font-medium">✓ {csvRecipients.length} recipients ready — {csvFileName}</span>
                  <button
                    type="button"
                    onClick={() => { setCsvRecipients([]); setCsvFileName(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="text-green-600 hover:text-green-900 text-xs underline ml-4"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || authLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {loading ? (csvRecipients.length > 0 ? 'Creating & uploading recipients...' : 'Creating...') : authLoading ? 'Loading...' : '✓ Create Campaign'}
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
