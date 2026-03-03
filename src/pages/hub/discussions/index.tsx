import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

interface Discussion {
  id: string
  title: string
  type: string
  category: string
  status: string
  creator_id: string
  created_at: string
}

const DiscussionsPage = () => {
  const router = useRouter()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(0)
  const LIMIT = 20

  // Get user ID and token from Supabase
  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      }
      if (session?.access_token) {
        setToken(session.access_token)
      }
    }
    getUser()
  }, [])

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

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!token) {
      setDeleteError('Authentication token not available')
      return
    }
    
    setDeletingId(discussionId)
    setDeleteError('')
    
    try {
      console.log('Deleting discussion:', discussionId)
      const response = await axios.delete(`/api/hub/discussions/${discussionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response data:', response.data)

      if (response.status === 200 && response.data.success) {
        console.log('Discussion deleted successfully, refetching...')
        setDeleteConfirmId(null)
        // Refetch to ensure consistency
        await fetchDiscussions()
      } else {
        setDeleteError('Failed to delete discussion. Please try again.')
      }
    } catch (error: any) {
      console.error('Error deleting discussion:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete discussion'
      setDeleteError(errorMsg)
    } finally {
      setDeletingId(null)
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
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.push('/hub')}
              className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
            >
              <span>←</span> Back
            </button>
            <div className="flex gap-4">
              <Link href="/hub/projects" className="text-gray-600 hover:text-indigo-600 font-semibold transition">
                Community Projects
              </Link>
              <Link href="/hub/discussions" className="text-indigo-600 font-semibold transition">
                Discussions
              </Link>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Collaboration Discussion</h1>
            <Link href="/hub/discussions/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Start Discussion
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
                <div key={discussion.id} className="relative group">
                  <Link href={`/hub/discussions/${discussion.id}`} className={`block p-6 rounded-lg shadow hover:shadow-lg transition border ${getStatusColor(discussion.status)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{discussion.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(discussion.type)}`}>
                        {discussion.type}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {discussion.status}
                      </span>
                    </div>
                  </Link>
                  {userId === discussion.creator_id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteConfirmId(discussion.id)
                      }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                      title="Delete discussion"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
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

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Discussion</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this discussion? This action cannot be undone.</p>
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null)
                    setDeleteError('')
                  }}
                  disabled={deletingId === deleteConfirmId}
                  className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDiscussion(deleteConfirmId)}
                  disabled={deletingId === deleteConfirmId}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {deletingId === deleteConfirmId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DiscussionsPage
