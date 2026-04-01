import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { DashboardLayout } from '@/components/DashboardLayout'

interface IdeaFormData {
  appName: string
  mainIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
}

interface ClarifyingQuestions {
  questions: string[]
}

interface Prototype {
  htmlMockup: string
  userFlow: string[]
  feasibility: string
  buildPlan: string[]
  technologies: string[]
  testStrategy: string
  launchStrategy: string
  mvpTasks: string[]
}

export default function BuildTheDamnThing() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Form, 2: Questions or Prototype, 3: Answers, 4: Full Blueprint
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [buildLiveUrl, setBuildLiveUrl] = useState('')
  const [deploymentStatus, setDeploymentStatus] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editedPrototype, setEditedPrototype] = useState<Prototype | null>(null)
  const [formData, setFormData] = useState<IdeaFormData>({
    appName: '',
    mainIdea: '',
    targetUser: '',
    problemSolved: '',
    howItWorks: '',
  })
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestions | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [prototype, setPrototype] = useState<Prototype | null>(null)

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Please log in to use this feature</p>
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
              Go to Login
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateAppName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'App name is required'
    }

    if (name.length < 3) {
      return 'App name must be at least 3 characters'
    }

    if (name.length > 39) {
      return 'App name must be 39 characters or less'
    }

    // Check for valid characters (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return 'App name can only contain letters, numbers, dashes, and underscores (no spaces)'
    }

    // Check if starts/ends with dash
    if (name.startsWith('-') || name.endsWith('-')) {
      return 'App name cannot start or end with a dash'
    }

    return null
  }

  const handleAnalyze = async () => {
    // Validate app name first
    const appNameError = validateAppName(formData.appName)
    if (appNameError) {
      setError(appNameError)
      return
    }

    if (!formData.mainIdea || !formData.targetUser || !formData.problemSolved || !formData.howItWorks) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/hub/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze idea')
      }

      const data = await response.json()

      // Check if response contains questions
      if (data.questions && data.questions.length > 0) {
        setClarifyingQuestions(data)
        setStep(2) // Show clarifying questions
      } else {
        // Idea is clear, generate prototype immediately
        await generatePrototypeDirectly()
      }
    } catch (err) {
      setError((err as Error).message || 'Error analyzing idea. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generatePrototypeDirectly = async () => {
    try {
      const response = await fetch('/api/hub/generate-prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalIdea: formData,
          questions: [],
          answers: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prototype')
      }

      const data = await response.json()
      setPrototype(data)
      setStep(4)
    } catch (err) {
      setError((err as Error).message || 'Error generating prototype. Please try again.')
    }
  }

  const handleAnswersSubmit = async () => {
    if (answers.some(a => !a.trim())) {
      setError('Please answer all questions')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/hub/generate-prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalIdea: formData,
          questions: clarifyingQuestions?.questions || [],
          answers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prototype')
      }

      const data = await response.json()
      setPrototype(data)
      setStep(4)
    } catch (err) {
      setError((err as Error).message || 'Error generating prototype. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFormData({ appName: '', mainIdea: '', targetUser: '', problemSolved: '', howItWorks: '' })
    setClarifyingQuestions(null)
    setAnswers([])
    setPrototype(null)
    setBuildLiveUrl('')
    setDeploymentStatus('')
    setEditMode(false)
    setEditedPrototype(null)
    setError('')
    setErrorCode('')
  }

  const handleEditMode = () => {
    if (prototype && !editMode) {
      setEditedPrototype(JSON.parse(JSON.stringify(prototype))) // Deep copy
    }
    setEditMode(!editMode)
  }

  const handleSaveEdits = () => {
    if (editedPrototype) {
      setPrototype(editedPrototype)
      setEditMode(false)
    }
  }

  const updateEditedField = <K extends keyof Prototype>(field: K, value: Prototype[K]) => {
    if (editedPrototype) {
      setEditedPrototype({ ...editedPrototype, [field]: value })
    }
  }

  const handleBuildAndDeploy = async () => {
    if (!prototype) {
      setError('No prototype available to build')
      return
    }

    setLoading(true)
    setError('')
    setErrorCode('')
    setDeploymentStatus('Building your project...')

    try {
      const response = await fetch('/api/hub/build-and-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: formData,
          prototype,
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        let errorMsg = 'Failed to build and deploy'
        
        // Try to parse as JSON, but handle HTML error pages
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            errorData = await response.json()
            if (errorData.missing) {
              errorMsg = `⚠️ Missing setup: ${errorData.missing.join(', ')}\n\n${errorData.instructions}`
            } else {
              errorMsg = errorData.error || errorMsg
            }
          } catch (e) {
            console.error('Failed to parse error response:', e)
          }
        }
        
        // Handle specific status codes
        if (response.status === 409) {
          // Conflict - app name already taken
          setErrorCode('REPO_ALREADY_EXISTS')
          const appName = errorData.appName || formData.appName
          errorMsg = `❌ App name "${appName}" is already taken on GitHub or Netlify.\n\nTry these alternatives:\n• ${appName}2\n• ${appName}-app\n• ${appName}-pro\n\nGo back to Step 1 and choose a different app name.`
        } else if (response.status === 504) {
          setErrorCode('')
          errorMsg = `Server timeout (504). This sometimes happens with large deployments. Try building with fewer files or wait a moment and try again.`
        } else if (response.status === 500) {
          setErrorCode('')
          errorMsg = `Server error (500). ${errorMsg}`
        }
        
        throw new Error(errorMsg)
      }

      setDeploymentStatus('Deploying to Netlify & waiting for build...')
      const data = await response.json()
      
      setDeploymentStatus('✅ Build complete! Launching your app...')
      setBuildLiveUrl(data.liveUrl)
      setStep(5) // Show success/live app screen
      
      // Small delay before auto-launching to let UI update
      setTimeout(() => {
        window.open(data.liveUrl, '_blank')
      }, 1500)
    } catch (err) {
      const errorMsg = (err as Error).message || 'Error building and deploying. Please try again.'
      console.error('Build error:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
      setDeploymentStatus('')
    }
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Build the Damn Thing! - Take The Reins</title>
      </Head>

      {/* Deployment Status Overlay - Outside main content for full screen */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-slate-800 border-2 border-green-500 rounded-xl p-12 text-center max-w-md shadow-2xl">
            <div className="mb-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-600 border-t-green-500"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">Building Magic...</h2>
            <p className="text-green-300 text-xl font-semibold mb-6 min-h-8">{deploymentStatus}</p>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>✓ Creating your GitHub repository</p>
              <p>✓ Generating your Next.js project</p>
              <p>✓ Deploying to Netlify</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">Build the Damn Thing!</h1>
          <p className="text-xl text-slate-400">
            Turn your brilliant idea into a launchable product with AI guidance
          </p>
        </div>

        {/* Step 1: Idea Form */}
        {step === 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold">
                  1
                </div>
                <h2 className="text-2xl font-bold text-white">Tell Me About Your Idea</h2>
              </div>
              <p className="text-slate-400">
                Answer these questions and I'll help you figure out how to build and launch it.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-600/20 border border-red-600/50 text-red-200 px-6 py-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* App Name - REQUIRED AND MUST BE UNIQUE */}
              <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-lg p-4">
                <label className="block text-white font-bold mb-2">
                  📛 Choose Your App Name (REQUIRED - Must be unique)
                </label>
                <p className="text-indigo-300 text-sm mb-3">
                  This is your app's identifier on GitHub and Netlify. Choose something memorable and unique!
                </p>
                <input
                  type="text"
                  name="appName"
                  value={formData.appName}
                  onChange={handleInputChange}
                  placeholder="e.g., TaskFlow, PromoHub, SmartReminder (3-39 chars, letters/numbers/dashes only)"
                  className={`w-full bg-slate-900 border-2 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${
                    formData.appName && validateAppName(formData.appName) === null
                      ? 'border-green-500 focus:border-green-400'
                      : formData.appName && validateAppName(formData.appName)
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-600 focus:border-indigo-500'
                  }`}
                />
                <div className="flex justify-between items-start mt-3">
                  <div className="text-slate-400 text-xs space-y-1">
                    <p>✓ Letters, numbers, dashes, underscores only</p>
                    <p>✓ 3-39 characters</p>
                    <p>✓ Must be unique (no existing repos/sites with this name)</p>
                  </div>
                  <div className="text-right text-slate-400 text-xs">
                    <p>Length: {formData.appName.length}/39</p>
                    {validateAppName(formData.appName) === null && formData.appName && (
                      <p className="text-green-400 font-semibold">✓ Valid!</p>
                    )}
                    {validateAppName(formData.appName) && (
                      <p className="text-red-400 font-semibold">{validateAppName(formData.appName)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Idea */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  What's your main idea? 💡
                </label>
                <input
                  type="text"
                  name="mainIdea"
                  value={formData.mainIdea}
                  onChange={handleInputChange}
                  placeholder="e.g., An app to help remote teams track their productivity without micromanagement"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target User */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Who's your target user? 👥
                </label>
                <input
                  type="text"
                  name="targetUser"
                  value={formData.targetUser}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote team managers in tech companies, 5-50 person teams"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Problem Solved */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  What problem does it solve? 🔧
                </label>
                <textarea
                  name="problemSolved"
                  value={formData.problemSolved}
                  onChange={handleInputChange}
                  placeholder="e.g., Managers need visibility into team productivity without treating employees like robots. Current tools are invasive or ineffective."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* How It Works */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  How could it work? (basic flow) 🔄
                </label>
                <textarea
                  name="howItWorks"
                  value={formData.howItWorks}
                  onChange={handleInputChange}
                  placeholder="e.g., Managers create a team → invite team members → members set daily goals → app tracks goal completion, not idle time → generates weekly insight reports"
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {loading ? 'Analyzing with AI...' : '✨ Analyze My Idea'}
              </button>
              <Link
                href="/hub"
                className="text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Clarifying Questions */}
        {step === 2 && clarifyingQuestions && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-600 text-white font-bold">
                  2
                </div>
                <h2 className="text-2xl font-bold text-white">Let's Clarify Your Idea</h2>
              </div>
              <p className="text-slate-400">
                I have a few questions to help me better understand your vision. Answer these and I'll generate your interactive prototype!
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-600/20 border border-red-600/50 text-red-200 px-6 py-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6 mb-8">
              {clarifyingQuestions.questions.map((question, idx) => (
                <div key={idx}>
                  <label className="block text-white font-semibold mb-2">
                    {idx + 1}. {question}
                  </label>
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => {
                      const newAnswers = [...answers]
                      newAnswers[idx] = e.target.value
                      setAnswers(newAnswers)
                    }}
                    placeholder="Your answer..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAnswersSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {loading ? 'Generating prototype...' : '🎯 Generate Prototype'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Prototype & Full Blueprint */}
        {step === 4 && prototype && (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold">
                  3
                </div>
                <h2 className="text-2xl font-bold text-white">Your Interactive Prototype</h2>
              </div>
              <button
                onClick={handleEditMode}
                className={`font-semibold py-2 px-4 rounded-lg transition ${
                  editMode
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {editMode ? '❌ Cancel Editing' : '✏️ Edit Plan'}
              </button>
            </div>

            {editMode && editedPrototype && (
              <div className="bg-orange-900/30 border-2 border-orange-500 rounded-xl p-6">
                <p className="text-orange-200 font-semibold mb-2">✏️ Editing Mode</p>
                <p className="text-orange-100 text-sm mb-4">
                  Change anything you don't like! Bad Stripe recommendation? Use Zelle or Venmo instead. Not happy with a tech? Replace it. Fix whatever isn't working for you.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdits}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    ✅ Save Changes
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-600/20 border border-red-600/50 rounded-xl p-6">
                <p className="text-red-200 font-semibold mb-3 whitespace-pre-wrap">{error}</p>
                {errorCode === 'REPO_ALREADY_EXISTS' && (
                  <button
                    onClick={() => setStep(1)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    ← Go Back to Step 1 & Try Different Name
                  </button>
                )}
              </div>
            )}

            {/* HTML Mockup */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🎨 Click-Through Prototype</h3>
              <p className="text-slate-400 text-sm mb-4">Try interacting with your app prototype below:</p>
              <div className="bg-white border border-slate-600 rounded-lg p-6 overflow-auto max-h-96">
                <iframe
                  srcDoc={prototype.htmlMockup}
                  className="w-full h-full border-0"
                  title="App Prototype"
                  sandbox="allow-scripts"
                />
              </div>
            </div>

            {/* User Flow */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📋 Step-by-Step User Flow</h3>
              <p className="text-slate-400 text-sm mb-4">Try this flow with friends to test your idea:</p>
              <ol className="space-y-3">
                {prototype.userFlow.map((step, idx) => (
                  <li key={idx} className="flex gap-4 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6 text-center">
              <p className="text-blue-200 font-semibold mb-3">💡 Test Philosophy</p>
              <p className="text-blue-100">
                Show this prototype to 5-10 potential users. Ask: "Does this solve your problem?" Listen for their reactions. You should be ready to move forward if 70%+ say yes!
              </p>
            </div>

            {/* Build Plan Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold">
                4
              </div>
              <h2 className="text-2xl font-bold text-white">Now Build It</h2>
            </div>

            {/* Feasibility */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📊 Feasibility Assessment</h3>
              {editMode && editedPrototype ? (
                <textarea
                  value={editedPrototype.feasibility}
                  onChange={(e) => updateEditedField('feasibility', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                  rows={4}
                />
              ) : (
                <p className="text-slate-300">{(editedPrototype || prototype)!.feasibility}</p>
              )}
            </div>

            {/* Step-by-Step Build Plan */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🛠️ Step-by-Step Build Plan</h3>
              {editMode && editedPrototype ? (
                <div className="space-y-3">
                  {editedPrototype.buildPlan.map((step, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newPlan = [...editedPrototype.buildPlan]
                        newPlan[idx] = e.target.value
                        updateEditedField('buildPlan', newPlan)
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                  <button
                    onClick={() => updateEditedField('buildPlan', [...editedPrototype.buildPlan, 'New step...'])}
                    className="w-full bg-slate-900 border border-dashed border-slate-600 hover:border-indigo-500 rounded-lg px-4 py-3 text-slate-400 hover:text-indigo-400 transition"
                  >
                    + Add Another Step
                  </button>
                </div>
              ) : (
                <ol className="space-y-3">
                  {(editedPrototype || prototype)!.buildPlan.map((step, idx) => (
                    <li key={idx} className="flex gap-4 text-slate-300">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Tech Stack */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">💻 Recommended Tech Stack (Zero-Config, Beginner-Friendly)</h3>
              {editMode && editedPrototype ? (
                <div className="space-y-3">
                  {editedPrototype.technologies.map((tech, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={tech}
                      onChange={(e) => {
                        const newTechs = [...editedPrototype.technologies]
                        newTechs[idx] = e.target.value
                        updateEditedField('technologies', newTechs)
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                  <button
                    onClick={() => {
                      updateEditedField('technologies', [...editedPrototype.technologies, 'New tech...'])
                    }}
                    className="w-full bg-slate-900 border border-dashed border-slate-600 hover:border-indigo-500 rounded-lg px-4 py-3 text-slate-400 hover:text-indigo-400 transition"
                  >
                    + Add Another Tech
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(editedPrototype || prototype)!.technologies.map((tech, idx) => (
                    <div key={idx} className="flex gap-3 text-slate-300 p-3 bg-slate-900/50 rounded-lg">
                      <span className="flex-shrink-0">✓</span>
                      <span>{tech}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MVP Tasks */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🚀 MVP - Launch First</h3>
              <p className="text-slate-400 mb-4">Start with these core features to get live quickly:</p>
              {editMode && editedPrototype ? (
                <div className="space-y-3">
                  {editedPrototype.mvpTasks.map((task, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...editedPrototype.mvpTasks]
                        newTasks[idx] = e.target.value
                        updateEditedField('mvpTasks', newTasks)
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                  <button
                    onClick={() => updateEditedField('mvpTasks', [...editedPrototype.mvpTasks, 'New feature...'])}
                    className="w-full bg-slate-900 border border-dashed border-slate-600 hover:border-indigo-500 rounded-lg px-4 py-3 text-slate-400 hover:text-indigo-400 transition"
                  >
                    + Add Another Feature
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(editedPrototype || prototype)!.mvpTasks.map((task, idx) => (
                    <div key={idx} className="flex gap-3 text-slate-300">
                      <input type="checkbox" disabled className="flex-shrink-0 mt-1" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Strategy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">✅ Testing Strategy (Best Practice)</h3>
              <p className="text-slate-400 text-sm mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded">
                📋 Before you launch to everyone, test with real users
              </p>
              {editMode && editedPrototype ? (
                <textarea
                  value={editedPrototype.testStrategy}
                  onChange={(e) => updateEditedField('testStrategy', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                  rows={4}
                />
              ) : (
                <p className="text-slate-300 whitespace-pre-wrap">{(editedPrototype || prototype)!.testStrategy}</p>
              )}
            </div>

            {/* Launch Strategy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📈 Launch Strategy</h3>
              {editMode && editedPrototype ? (
                <textarea
                  value={editedPrototype.launchStrategy}
                  onChange={(e) => updateEditedField('launchStrategy', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                  rows={4}
                />
              ) : (
                <p className="text-slate-300 whitespace-pre-wrap">{(editedPrototype || prototype)!.launchStrategy}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleBuildAndDeploy}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {loading ? '🚀 Building, Testing & Deploying...' : '🚀 Build It, Test It, Deploy It!'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                💡 Build Another Idea
              </button>
              <Link
                href="/hub"
                className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        )}
        {/* Step 5: Live App */}
        {step === 5 && buildLiveUrl && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold">
                ✓
              </div>
              <h2 className="text-4xl font-bold text-white">🎉 Your App is Built, Tested & Live!</h2>
            </div>

            <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-8 text-center">
              <p className="text-green-200 mb-6 text-lg font-semibold">
                ✨ Your app has been built, deployed to GitHub, and is now live on Netlify!
              </p>
              <p className="text-green-300 mb-8 text-base">
                The app should have opened in a new tab. Here's your live URL:
              </p>
              <div className="bg-slate-900 border-2 border-green-500 rounded-lg p-6 mb-6">
                <p className="text-slate-400 text-sm mb-3 font-semibold">🌐 LIVE URL</p>
                <a
                  href={buildLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-2xl font-mono break-all font-bold block mb-4"
                >
                  {buildLiveUrl}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildLiveUrl)
                    alert('URL copied to clipboard!')
                  }}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  📋 Copy URL
                </button>
              </div>
              <button
                onClick={() => window.open(buildLiveUrl, '_blank')}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition text-lg mb-6"
              >
                👉 View Your Live App Now
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* GitHub Repo */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">📚 GitHub Repository</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Your code is ready to continue development:
                </p>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>✓ Full source code in `/src`</p>
                  <p>✓ Build plan in README.md</p>
                  <p>✓ Auto-deploys on git push</p>
                </div>
              </div>

              {/* Test Now */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">🧪 Test Now</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Share the live URL with real users:
                </p>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>✓ Test core features</p>
                  <p>✓ Gather feedback</p>
                  <p>✓ Iterate rapidly</p>
                </div>
              </div>

              {/* Continue Development */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">💻 Keep Building</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Update and deploy whenever you want:
                </p>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>✓ Edit code locally</p>
                  <p>✓ Push to GitHub</p>
                  <p>✓ Netlify deploys instantly</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6">
              <p className="text-blue-200 font-semibold mb-2">💡 Pro Tip: Your MVP is Live!</p>
              <p className="text-blue-100">
                Stop planning and start learning. Share this URL with real users NOW. Their feedback will teach you more than any amount of design. Update your GitHub repo with fixes and features as you learn what users actually want. Every push to main deploys automatically.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                💡 Build Another Idea
              </button>
              <Link
                href="/hub"
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
