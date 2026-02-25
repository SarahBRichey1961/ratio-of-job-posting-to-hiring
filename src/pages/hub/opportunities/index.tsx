import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'

interface Opportunity {
  id: string
  title: string
  description: string
  company_name: string
  opportunity_type: string
  skills_required: string[]
  is_ai_focused: boolean
  created_at: string
  expires_at: string
}

const OpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    opportunity_type: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(0)
  const LIMIT = 12

  useEffect(() => {
    fetchOpportunities()
  }, [filters, currentPage])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', LIMIT.toString())
      params.append('offset', (currentPage * LIMIT).toString())

      if (filters.opportunity_type) params.append('opportunity_type', filters.opportunity_type)
      if (filters.search) params.append('search', filters.search)

      const response = await axios.get(`/api/hub/opportunities?${params}`)
      setOpportunities(response.data.data || [])
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job':
        return 'bg-green-100 text-green-800'
      case 'freelance':
        return 'bg-blue-100 text-blue-800'
      case 'internship':
        return 'bg-purple-100 text-purple-800'
      case 'collaboration':
        return 'bg-orange-100 text-orange-800'
      case 'mentorship':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Opportunities - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
              <p className="text-gray-600 mt-2">
                Find jobs, freelance projects, internships, and mentorship opportunities
              </p>
            </div>
            <Link href="/hub/opportunities/new">
              <a className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Post Opportunity
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={filters.opportunity_type}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, opportunity_type: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="job">Full-time Job</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
              <option value="collaboration">Collaboration</option>
              <option value="mentorship">Mentorship</option>
            </select>
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              No opportunities found. Try adjusting your filters or check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <Link key={opp.id} href={`/hub/opportunities/${opp.id}`}>
                  <a className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 block">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{opp.title}</h3>
                        <p className="text-gray-600">{opp.company_name}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(opp.opportunity_type)}`}>
                        {opp.opportunity_type}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{opp.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {opp.skills_required.slice(0, 3).map((skill) => (
                        <span key={skill} className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                      {opp.skills_required.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                          +{opp.skills_required.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      Posted {new Date(opp.created_at).toLocaleDateString()}
                      {opp.expires_at && (
                        <span> • Expires {new Date(opp.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="py-2 text-gray-600">Page {currentPage + 1}</span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={opportunities.length < LIMIT}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default OpportunitiesPage
