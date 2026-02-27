import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

interface HubProject {
  id: string
  title: string
  description: string
  problem_statement: string
  category: string
  difficulty_level: string
  learning_goals: string[]
  technologies_used: string[]
  start_date: string
  target_completion_date: string
  repository_url: string
  creator_id: string
}

const EditProject = () => {
  const router = useRouter()
  const { id } = router.query  // This will get id from ?id=... query param
  const [project, setProject] = useState<HubProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    category: 'general',
    difficulty_level: 'beginner',
    learning_goals: [] as string[],
    technologies_used: [] as string[],
    start_date: '',
    target_completion_date: '',
    repository_url: '',
  })

  const [newGoal, setNewGoal] = useState('')
  const [newTech, setNewTech] = useState('')

  // Get user ID from Supabase on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      } else {
        router.push('/hub/login')
      }
    }
    getUser()
  }, [router])

  // Fetch project details
  useEffect(() => {
    console.log('=== Edit useEffect: Fetch Project ===')
    console.log('id:', id)
    console.log('userId:', userId)
    console.log('typeof id:', typeof id)
    
    if (!id || typeof id !== 'string') {
      console.log('Skipping - id not ready')
      return
    }

    if (!userId) {
      console.log('Skipping - userId not ready')
      return
    }

    const fetchProject = async () => {
      try {
        console.log(`Fetching project ${id}...`)
        setLoading(true)
        const response = await axios.get(`/api/hub/projects/${id}`)
        console.log('Project fetched successfully:', response.data)
        
        setProject(response.data)
        setFormData({
          title: response.data.title,
          description: response.data.description,
          problem_statement: response.data.problem_statement || '',
          category: response.data.category || 'general',
          difficulty_level: response.data.difficulty_level || 'beginner',
          learning_goals: response.data.learning_goals || [],
          technologies_used: response.data.technologies_used || [],
          start_date: response.data.start_date || '',
          target_completion_date: response.data.target_completion_date || '',
          repository_url: response.data.repository_url || '',
        })

        console.log('formData set successfully')

        // Check if user is the creator
        if (response.data.creator_id !== userId) {
          console.warn('User is not the creator')
          setError('You do not have permission to edit this project')
        } else {
          console.log('User is the creator - OK to edit')
        }
      } catch (err) {
        console.error('Error fetching project:', err)
        setError((err as any).message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id, userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addLearningGoal = () => {
    if (newGoal.trim()) {
      setFormData((prev) => ({
        ...prev,
        learning_goals: [...prev.learning_goals, newGoal.trim()],
      }))
      setNewGoal('')
    }
  }

  const removeLearningGoal = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      learning_goals: prev.learning_goals.filter((_, i) => i !== index),
    }))
  }

  const addTechnology = () => {
    if (newTech.trim()) {
      setFormData((prev) => ({
        ...prev,
        technologies_used: [...prev.technologies_used, newTech.trim()],
      }))
      setNewTech('')
    }
  }

  const removeTechnology = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technologies_used: prev.technologies_used.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!id || !userId) {
      setError('Missing required information')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Authentication token not available. Please log in again.')
        return
      }

      // Call the update endpoint
      const response = await axios.put(`/api/hub/projects/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      // Redirect to project view on success
      router.push(`/hub/projects/${id}`)
    } catch (err) {
      setError((err as any).response?.data?.error || (err as any).message || 'Failed to save project')
    } finally {
      setSaving(false)
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

  if (error && error.includes('permission')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Access Denied - Hub</title>
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a href="/hub/projects" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Back to Projects
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Edit Project - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">Update your project details</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-gray-900">Project Basics</legend>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., AI-Powered Resume Parser"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe your project, what it does, and why it matters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Statement
              </label>
              <textarea
                name="problem_statement"
                value={formData.problem_statement}
                onChange={handleInputChange}
                rows={3}
                placeholder="What problem does this project solve?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="ml">Machine Learning</option>
                  <option value="nlp">Natural Language Processing</option>
                  <option value="cv">Computer Vision</option>
                  <option value="robotics">Robotics</option>
                  <option value="data">Data Analysis</option>
                  <option value="web">Web/API</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Completion
                </label>
                <input
                  type="date"
                  name="target_completion_date"
                  value={formData.target_completion_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL
              </label>
              <input
                type="url"
                name="repository_url"
                value={formData.repository_url}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </fieldset>

          {/* Learning Goals */}
          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-gray-900">Learning Goals</legend>
            <div className="space-y-2">
              {formData.learning_goals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded">
                  <span>{goal}</span>
                  <button
                    type="button"
                    onClick={() => removeLearningGoal(index)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a learning goal"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addLearningGoal}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </fieldset>

          {/* Technologies */}
          <fieldset className="space-y-4">
            <legend className="text-xl font-bold text-gray-900">Technologies</legend>
            <div className="space-y-2">
              {formData.technologies_used.map((tech, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-50 px-4 py-2 rounded">
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add a technology (e.g., Python, PyTorch)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTechnology}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default EditProject
