import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

const NewProject = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    category: 'general',
    difficulty_level: 'beginner',
    learning_goals: [] as string[],
    technologies_used: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    target_completion_date: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addLearningGoal = () => {
    if (newGoal.trim()) {
      console.log('addLearningGoal called with:', newGoal)
      setFormData((prev) => {
        const updated = {
          ...prev,
          learning_goals: [...prev.learning_goals, newGoal.trim()],
        }
        console.log('Updated formData after adding goal:', updated.learning_goals)
        return updated
      })
      setNewGoal('')
    } else {
      console.log('addLearningGoal: newGoal is empty')
    }
  }

  const removeLearningGoal = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      learning_goals: prev.learning_goals.filter((_, i) => i !== index),
    }))
  }

  const addTechnology = () => {
    console.log('addTechnology called')
    console.log('Current newTech value:', newTech)
    console.log('newTech.trim():', newTech.trim())
    console.log('Condition check - newTech.trim() is truthy?', Boolean(newTech.trim()))
    
    if (newTech.trim()) {
      console.log('✅ Adding technology:', newTech)
      setFormData((prev) => {
        const updated = {
          ...prev,
          technologies_used: [...prev.technologies_used, newTech.trim()],
        }
        console.log('Updated formData.technologies_used:', updated.technologies_used)
        return updated
      })
      setNewTech('')
      console.log('Cleared newTech input')
    } else {
      console.log('❌ newTech is empty, not adding')
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
    
    if (!userId) {
      setError('User ID not available. Please refresh the page.')
      return
    }

    console.log('=== FORM SUBMISSION ===')
    console.log('Complete formData:', JSON.stringify(formData, null, 2))
    console.log('---')
    console.log('learning_goals:', formData.learning_goals)
    console.log('learning_goals type:', typeof formData.learning_goals)
    console.log('learning_goals isArray:', Array.isArray(formData.learning_goals))
    console.log('learning_goals length:', formData.learning_goals.length)
    console.log('---')
    console.log('technologies_used:', formData.technologies_used)
    console.log('technologies_used type:', typeof formData.technologies_used)
    console.log('technologies_used isArray:', Array.isArray(formData.technologies_used))
    console.log('technologies_used length:', formData.technologies_used.length)
    console.log('---')

    setLoading(true)
    setError('')

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Authentication token not available. Please log in again.')
        return
      }

      console.log('SENDING TO API - formData payload:')
      console.log(JSON.stringify(formData, null, 2))
      
      const response = await axios.post('/api/hub/projects', formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('API RESPONSE received:')
      console.log(JSON.stringify(response.data, null, 2))
      console.log('---')
      console.log('Response learning_goals:', response.data.learning_goals)
      console.log('Response technologies_used:', response.data.technologies_used)

      router.push(`/hub/projects/${response.data.id}`)
    } catch (err) {
      console.error('DEBUG: Error submitting form:', err)
      setError((err as any).response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Create New Project - Hub</title>
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Start a project to build an AI solution with the community</p>
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
                  <option value="nlp">Natural Language Processing</option>
                  <option value="cv">Computer Vision</option>
                  <option value="ml">Machine Learning</option>
                  <option value="data-science">Data Science</option>
                  <option value="web">Web Development</option>
                  <option value="other">Other</option>
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
          </fieldset>

          {/* Learning Goals */}
          <fieldset className="space-y-3">
            <legend className="text-lg font-bold text-gray-900">Learning Goals</legend>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningGoal())}
                placeholder="Add a learning goal and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addLearningGoal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.learning_goals.map((goal, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                >
                  {goal}
                  <button
                    type="button"
                    onClick={() => removeLearningGoal(index)}
                    className="ml-2 text-indigo-600 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Technologies */}
          <fieldset className="space-y-3">
            <legend className="text-lg font-bold text-gray-900">Technologies</legend>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                placeholder="e.g., Python, TensorFlow, React"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTechnology}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.technologies_used.map((tech, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="ml-2 text-blue-600 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Timeline */}
          <fieldset className="space-y-6">
            <legend className="text-lg font-bold text-gray-900">Timeline</legend>

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
                  Target Completion Date
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
          </fieldset>

          {/* Submit */}
          <div className="flex justify-between pt-8 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default NewProject
