import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

interface HubDiscussion {
  id: string
  title: string
  description: string
  type: string
  category: string
  status: string
  creator_id: string
  tags: string[]
  ai_related: boolean
  created_at: string
  updated_at: string
  views: number
  upvotes: number
}

interface Creator {
  username: string
  avatar_url: string | null
}

interface HubDiscussionComment {
  id: string
  discussion_id: string
  author_id: string
  author?: {
    username: string
    avatar_url: string | null
  }
  content: string
  is_solution: boolean
  upvotes: number
  created_at: string
  updated_at: string
}

const DiscussionDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [discussion, setDiscussion] = useState<HubDiscussion | null>(null)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Edit Discussion State
  const [editingDiscussion, setEditingDiscussion] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<HubDiscussion>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Comments State
  const [comments, setComments] = useState<HubDiscussionComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState('')

  // Get user ID from Supabase on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          setUserId(session.user.id)
          // Get access token for API calls
          if (session?.access_token) {
            setToken(session.access_token)
          }
        }
      } catch (err) {
        console.error('Error getting user:', err)
      }
    }
    getUser()
  }, [])

  // Fetch discussion details
  useEffect(() => {
    if (!id) return

    const fetchDiscussion = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/hub/discussions/${id}`)
        setDiscussion(response.data)
        setEditFormData(response.data)

        // Fetch creator info from hub_members
        if (response.data.creator_id) {
          const creatorResponse = await axios.get(`/api/hub/members?creator_id=${response.data.creator_id}`)
          if (creatorResponse.data.data && creatorResponse.data.data.length > 0) {
            setCreator(creatorResponse.data.data[0])
          }
        }
      } catch (err) {
        setError((err as any).response?.data?.error || (err as any).message || 'Failed to load discussion')
      } finally {
        setLoading(false)
      }
    }

    fetchDiscussion()
  }, [id])

  // Fetch comments
  useEffect(() => {
    if (!id) return

    const fetchComments = async () => {
      try {
        setLoadingComments(true)
        const response = await axios.get(`/api/hub/discussions/${id}/comments`)
        setComments(response.data.data || [])
      } catch (err) {
        console.error('Error fetching comments:', err)
      } finally {
        setLoadingComments(false)
      }
    }

    fetchComments()
  }, [id])

  // Event Handlers
  const handleEditClick = () => {
    setEditingDiscussion(true)
    setEditFormData(discussion || {})
    setEditError('')
  }

  const handleEditCancel = () => {
    setEditingDiscussion(false)
    setEditFormData(discussion || {})
    setEditError('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!discussion || !token) return

    // Validate required fields
    if (!editFormData.title || editFormData.title.trim() === '') {
      setEditError('Title is required')
      return
    }

    if (!editFormData.description || editFormData.description.trim() === '') {
      setEditError('Description is required')
      return
    }

    setSavingEdit(true)
    setEditError('')

    try {
      const response = await axios.put(
        `/api/hub/discussions/${id}`,
        {
          title: editFormData.title,
          description: editFormData.description,
          type: editFormData.type,
          category: editFormData.category,
          tags: editFormData.tags,
          status: editFormData.status,
          ai_related: editFormData.ai_related
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setDiscussion(response.data)
      setEditingDiscussion(false)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update discussion'
      setEditError(errorMessage)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleReplyClick = () => {
    if (!userId) {
      router.push('/hub/login')
      return
    }
    setShowReplyForm(true)
    setReplyError('')
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!discussion || !token) return

    const trimmed = replyContent.trim()

    if (trimmed === '') {
      setReplyError('Comment cannot be empty')
      return
    }

    if (trimmed.length > 10000) {
      setReplyError('Comment must be 10000 characters or less')
      return
    }

    setSubmittingReply(true)
    setReplyError('')

    try {
      const response = await axios.post(
        `/api/hub/discussions/${id}/comments`,
        { content: trimmed },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // Add new comment to the list (prepend)
      if (response.data.data && response.data.data.length > 0) {
        setComments([response.data.data[0], ...comments])
      }

      setReplyContent('')
      setShowReplyForm(false)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to post comment'
      setReplyError(errorMessage)
    } finally {
      setSubmittingReply(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading discussion...</p>
        </div>
      </div>
    )
  }

  if (error || !discussion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Discussion Not Found - Hub</title>
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Discussion Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The discussion you are looking for does not exist.'}</p>
            <Link href="/hub/discussions" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Back to Discussions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = userId === discussion.creator_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{discussion.title} - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/hub/discussions" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
                ← Back to Discussions
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{discussion.title}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span>By {creator?.username || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {discussion.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                discussion.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {discussion.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Discussion Content */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-700 text-lg leading-relaxed">{discussion.description}</p>
          </div>

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {discussion.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Discussion Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{discussion.views || 0}</div>
              <p className="text-gray-600 text-sm mt-1">Views</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{discussion.upvotes || 0}</div>
              <p className="text-gray-600 text-sm mt-1">Upvotes</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3">
              {isCreator && (
                <button 
                  onClick={handleEditClick}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
                  Edit
                </button>
              )}
              {userId && (
                <button 
                  onClick={handleReplyClick}
                  className="w-full border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 font-medium text-sm">
                  Reply
                </button>
              )}
              {!userId && (
                <Link href="/hub/login" className="w-full inline-block text-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
                  Sign In to Reply
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Post a Reply</h3>
              <form onSubmit={handleReplySubmit}>
                <div className="mb-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2">{replyContent.length}/10000</p>
                </div>
                {replyError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {replyError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium text-sm"
                  >
                    {submittingReply ? 'Posting...' : 'Post Comment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                      setReplyError('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showReplyForm && userId && (
            <button
              onClick={handleReplyClick}
              className="mb-8 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium text-sm"
            >
              Write a Reply
            </button>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No comments yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-indigo-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {comment.author?.username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(comment.created_at).toLocaleDateString()} at{' '}
                        {new Date(comment.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {comment.is_solution && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Solution
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      👍 {comment.upvotes || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingDiscussion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Discussion</h2>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8">
                {editError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {editError}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Discussion title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      rows={6}
                      placeholder="Detailed description of your discussion"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Type
                    </label>
                    <select
                      value={editFormData.type || 'question'}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="question">Question</option>
                      <option value="issue">Issue</option>
                      <option value="idea">Idea</option>
                      <option value="solution">Solution</option>
                      <option value="resource">Resource</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., AI, ML, Deep Learning"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Status
                    </label>
                    <select
                      value={editFormData.status || 'open'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={(editFormData.tags || []).join(', ')}
                      onChange={(e) => setEditFormData({ 
                        ...editFormData, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="AI, Machine Learning, Neural Networks"
                    />
                  </div>

                  {/* AI Related */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.ai_related || false}
                        onChange={(e) => setEditFormData({ ...editFormData, ai_related: e.target.checked })}
                        className="rounded border border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">AI Related</span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DiscussionDetail
