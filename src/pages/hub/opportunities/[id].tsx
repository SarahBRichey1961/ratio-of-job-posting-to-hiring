import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

interface HubOpportunity {
  id: string
  title: string
  description: string
  company_name: string
  opportunity_type: string
  skills_required: string[]
  posted_by: string
  is_ai_focused: boolean
  status: string
  created_at: string
  expires_at: string
}

interface Poster {
  username: string
  avatar_url: string | null
}

const OpportunityDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [opportunity, setOpportunity] = useState<HubOpportunity | null>(null)
  const [poster, setPoster] = useState<Poster | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [applying, setApplying] = useState(false)

  // Get user ID from Supabase on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      }
    }
    getUser()
  }, [])

  // Fetch opportunity details
  useEffect(() => {
    if (!id) return

    const fetchOpportunity = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/hub/opportunities/${id}`)
        setOpportunity(response.data)

        // Fetch poster info from hub_members
        if (response.data.posted_by) {
          const posterResponse = await axios.get(`/api/hub/members?creator_id=${response.data.posted_by}`)
          if (posterResponse.data.data && posterResponse.data.data.length > 0) {
            setPoster(posterResponse.data.data[0])
          }
        }
      } catch (err) {
        setError((err as any).response?.data?.error || (err as any).message || 'Failed to load opportunity')
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunity()
  }, [id])

  const handleApply = async () => {
    if (!userId) {
      router.push('/hub/login')
      return
    }

    setApplying(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Authentication token not available. Please log in again.')
        return
      }

      // Apply to opportunity
      await axios.post('/api/hub/opportunities/apply', {
        opportunity_id: opportunity?.id,
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      setHasApplied(true)
      alert('Application submitted successfully!')
    } catch (err) {
      alert((err as any).response?.data?.error || 'Failed to apply to opportunity')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading opportunity...</p>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Opportunity Not Found - Hub</title>
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Opportunity Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The opportunity you are looking for does not exist.'}</p>
            <Link href="/hub/opportunities" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Back to Opportunities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = opportunity.expires_at && new Date(opportunity.expires_at) < new Date()
  const isPoster = userId === opportunity.posted_by

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{opportunity.title} - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/hub/opportunities" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
                ← Back to Opportunities
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{opportunity.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{opportunity.company_name}</p>
              <div className="mt-2 text-sm text-gray-600">
                Posted {new Date(opportunity.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {opportunity.opportunity_type}
              </span>
              {isExpired && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Expired
                </span>
              )}
              {opportunity.is_ai_focused && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  AI Focused
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Opportunity Description */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About This Opportunity</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{opportunity.description}</p>

          {opportunity.skills_required && opportunity.skills_required.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {opportunity.skills_required.map((skill, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Application CTA */}
        <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to Apply?</h2>
          <p className="text-gray-700 mb-6">
            {isPoster
              ? 'You posted this opportunity. View applications in your dashboard.'
              : isExpired
              ? 'This opportunity has expired.'
              : 'Click below to submit your application.'}
          </p>
          {!isPoster && !isExpired && (
            <div className="space-y-3">
              {userId && !hasApplied && (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              )}
              {hasApplied && (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
                  ✓ You have already applied to this opportunity
                </div>
              )}
              {!userId && (
                <Link href="/hub/login" className="w-full inline-block text-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
                  Sign In to Apply
                </Link>
              )}
            </div>
          )}
        </div>

        {opportunity.expires_at && !isExpired && (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">
            Expires on {new Date(opportunity.expires_at).toLocaleDateString()}
          </div>
        )}
      </main>
    </div>
  )
}

export default OpportunityDetail
