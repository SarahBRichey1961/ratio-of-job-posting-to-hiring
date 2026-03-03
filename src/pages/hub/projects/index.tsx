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
  difficulty_level: string
  category: string
  status: string
  created_at: string
  creator_id?: string
}

const ProjectsPage = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<HubProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showMyProjects, setShowMyProjects] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    difficulty: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const LIMIT = 12

  // Get user ID on mount to auto-select "My Projects" if logged in
  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
        setShowMyProjects(true) // Auto-select "My Projects" for logged-in users
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [filters, currentPage, showMyProjects])

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects with filters:', filters, 'showMyProjects:', showMyProjects)
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', LIMIT.toString())
      params.append('offset', (currentPage * LIMIT).toString())

      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.search) params.append('search', filters.search)

      const config: any = {}

      // If showing my projects, include auth token
      if (showMyProjects) {
        params.append('myProjects', 'true')
        const supabase = getSupabase()
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            config.headers = {
              Authorization: `Bearer ${session.access_token}`,
            }
          }
        }
      }

      console.log('Calling API: /api/hub/projects?' + params.toString())
      const response = await axios.get(`/api/hub/projects?${params}`, config)
      console.log('API Response:', response.data)
      console.log('Projects array:', response.data.data || [])
      console.log('Projects count:', (response.data.data || []).length)
      
      setProjects(response.data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setDeletingProjectId(null)
        return
      }

      const response = await axios.delete(`/api/hub/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.data.success) {
        setProjects(projects.filter((p) => p.id !== projectId))
        setDeleteConfirmProjectId(null)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Projects - Hub</title>
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
              <Link href="/hub/projects" className="text-indigo-600 font-semibold transition">
                Community Projects
              </Link>
              <Link href="/hub/discussions" className="text-gray-600 hover:text-indigo-600 font-semibold transition">
                Discussions
              </Link>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Community Projects</h1>
            <Link href="/hub/projects/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Start Project
            </Link>
          </div>
          {/* Toggle View */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowMyProjects(false)
                setCurrentPage(0)
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                !showMyProjects
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => {
                setShowMyProjects(true)
                setCurrentPage(0)
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                showMyProjects
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Projects
            </button>
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
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
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
              <option value="nlp">NLP</option>
              <option value="cv">Computer Vision</option>
              <option value="ml">Machine Learning</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No projects found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="relative group">
                  <Link href={`/hub/projects/${project.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 block h-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {project.difficulty_level}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {showMyProjects && userId === project.creator_id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteConfirmProjectId(project.id)
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                      title="Delete project"
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
              <span className="py-2 text-gray-600">
                Page {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={projects.length < LIMIT}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmProjectId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Project</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmProjectId(null)}
                  disabled={deletingProjectId === deleteConfirmProjectId}
                  className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(deleteConfirmProjectId)}
                  disabled={deletingProjectId === deleteConfirmProjectId}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {deletingProjectId === deleteConfirmProjectId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProjectsPage
