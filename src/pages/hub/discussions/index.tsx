import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'

interface Discussion {
  id: string
  title: string
  type: string
  category: string
  status: string
  creator: { username: string; avatar_url: string }
  created_at: string
  comments?: { count: number }[]
}

const DiscussionsPage = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(0)
  const LIMIT = 20

  useEffect(() => {
    fetchDiscussions()
  }, [filters, currentPage])

  const fetchDiscussions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', LIMIT.toString())
      params.append('offset', (currentPage * LIMIT).toString())

      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await axios.get(`/api/hub/discussions?${params}`)
      setDiscussions(response.data.data || [])
    } catch (error) {
      console.error('Error fetching discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 text-blue-800'
      case 'issue':
        return 'bg-red-100 text-red-800'
      case 'idea':
        return 'bg-green-100 text-green-800'
      case 'solution':
        return 'bg-purple-100 text-purple-800'
      case 'resource':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-50 border-green-200'
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200'
      case 'resolved':
        return 'bg-blue-50 border-blue-200'
      case 'closed':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Discussions - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Community Discussions</h1>
            <Link href="/hub/discussions/new">
              <a className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Start Discussion
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search discussions..."
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={filters.type}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, type: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="question">Question</option>
              <option value="issue">Issue</option>
              <option value="idea">Idea</option>
              <option value="solution">Solution</option>
              <option value="resource">Resource</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, category: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="ai">AI/ML</option>
              <option value="jobs">Job Search</option>
              <option value="projects">Projects</option>
              <option value="learning">Learning</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Discussions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : discussions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No discussions found. Be the first to start one!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Link key={discussion.id} href={`/hub/discussions/${discussion.id}`}>
                  <a
                    className={`block p-6 rounded-lg shadow hover:shadow-lg transition border ${getStatusColor(discussion.status)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{discussion.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(discussion.type)}`}>
                        {discussion.type}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>By {discussion.creator.username}</span>
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                        <span>{discussion.comments?.[0]?.count || 0} replies</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {discussion.status}
                      </span>
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
                disabled={discussions.length < LIMIT}
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

export default DiscussionsPage
