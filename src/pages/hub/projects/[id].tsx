import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

interface HubProject {
  id: string
  title: string
  description: string
  problem_statement: string
  difficulty_level: string
  category: string
  status: string
  creator_id: string
  learning_goals: string[]
  technologies_used: string[]
  created_at: string
  updated_at: string
  start_date: string
  target_completion_date: string
  repository_url: string
  members?: any[]
}

const STATUS_OPTIONS = ['Proposed', 'Assigned', 'Committed', 'Completed', 'Deployed in Production']

const getStatusColor = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'Proposed': 'bg-yellow-100 text-yellow-800',
    'Assigned': 'bg-blue-100 text-blue-800',
    'Committed': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-800',
    'Deployed in Production': 'bg-indigo-100 text-indigo-800'
  }
  return statusMap[status] || 'bg-gray-100 text-gray-800'
}

const ProjectDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState<HubProject | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Get user ID from Supabase on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || null)
      }
    }
    getUser()
  }, [])

  // Fetch project details
  useEffect(() => {
    if (!id) return

    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/hub/projects/${id}`)
        setProject(response.data)
        // Check if user is a member
        if (userId && response.data.members) {
          const isMemberOfProject = response.data.members.some((m: any) => m.member_id === userId)
          setIsMember(isMemberOfProject)
        }
      } catch (err) {
        setError((err as any).response?.data?.error || (err as any).message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id, userId])

  const handleDelete = async () => {
    if (!id) return
    
    setDeleting(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Authentication token not available. Please log in again.')
        setDeleting(false)
        return
      }

      const response = await axios.delete(`/api/hub/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.data.success) {
        router.push('/hub/projects')
      }
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to delete project')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Project Not Found - Hub</title>
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The project you are looking for does not exist.'}</p>
            <Link href="/hub/projects" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = userId === project.creator_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{project.title} - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/hub/projects" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block">
                ← Back to Projects
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span>By {userId === project.creator_id ? userEmail : 'Creator'}</span>
                <span>•</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {project.difficulty_level}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Project Description */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-6">{project.description}</p>

          {project.problem_statement && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Statement</h3>
              <p className="text-gray-700 mb-6">{project.problem_statement}</p>
            </>
          )}

          {project.learning_goals && project.learning_goals.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Goals</h3>
              <ul className="list-disc list-inside space-y-1 mb-6 text-gray-700">
                {project.learning_goals.map((goal, idx) => (
                  <li key={idx}>{goal}</li>
                ))}
              </ul>
            </>
          )}

          {project.technologies_used && project.technologies_used.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Technologies</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.technologies_used.map((tech, idx) => (
                  <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <dl className="space-y-4">
              {project.category && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Category</dt>
                    <dd className="text-gray-900">{project.category}</dd>
                  </div>
                </>
              )}
              {project.start_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Start Date</dt>
                  <dd className="text-gray-900">{new Date(project.start_date).toLocaleDateString()}</dd>
                </div>
              )}
              {project.target_completion_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Target Completion</dt>
                  <dd className="text-gray-900">{new Date(project.target_completion_date).toLocaleDateString()}</dd>
                </div>
              )}
              {project.repository_url && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Repository</dt>
                  <dd>
                    <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                      View on GitHub
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {isCreator && (
                <button
                  onClick={() => router.push(`/hub/projects/edit?id=${id}`)}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Edit Project
                </button>
              )}
              {isCreator && (
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete Project
                </button>
              )}
              {!isCreator && userId && (
                <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                  {isMember ? 'Leave Project' : 'Join Project'}
                </button>
              )}
              {!userId && (
                <Link href="/hub/login" className="w-full inline-block text-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                  Login to Join
                </Link>
              )}
              <Link href="/hub/discussions" className="w-full inline-block text-center border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 font-medium">
                View Discussions
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail
