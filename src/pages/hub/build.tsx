import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { DashboardLayout } from '@/components/DashboardLayout'

interface IdeaFormData {
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
  const [formData, setFormData] = useState<IdeaFormData>({
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

  const handleAnalyze = async () => {
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
    setFormData({ mainIdea: '', targetUser: '', problemSolved: '', howItWorks: '' })
    setClarifyingQuestions(null)
    setAnswers([])
    setPrototype(null)
    setError('')
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Build the Damn Thing! - Take The Reins</title>
      </Head>

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
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold">
                3
              </div>
              <h2 className="text-2xl font-bold text-white">Your Interactive Prototype</h2>
            </div>

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
              <p className="text-slate-300">{prototype.feasibility}</p>
            </div>

            {/* Step-by-Step Build Plan */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🛠️ Step-by-Step Build Plan</h3>
              <ol className="space-y-3">
                {prototype.buildPlan.map((step, idx) => (
                  <li key={idx} className="flex gap-4 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tech Stack */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">💻 Recommended Tech Stack (Zero-Config, Beginner-Friendly)</h3>
              <div className="space-y-3">
                {prototype.technologies.map((tech, idx) => (
                  <div key={idx} className="flex gap-3 text-slate-300 p-3 bg-slate-900/50 rounded-lg">
                    <span className="flex-shrink-0">✓</span>
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MVP Tasks */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🚀 MVP - Launch First</h3>
              <p className="text-slate-400 mb-4">Start with these core features to get live quickly:</p>
              <div className="space-y-2">
                {prototype.mvpTasks.map((task, idx) => (
                  <div key={idx} className="flex gap-3 text-slate-300">
                    <input type="checkbox" disabled className="flex-shrink-0 mt-1" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Strategy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">✅ Testing Strategy (Best Practice)</h3>
              <p className="text-slate-400 text-sm mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded">
                📋 Before you launch to everyone, test with real users
              </p>
              <p className="text-slate-300 whitespace-pre-wrap">{prototype.testStrategy}</p>
            </div>

            {/* Launch Strategy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📈 Launch Strategy</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{prototype.launchStrategy}</p>
            </div>

            {/* Action Buttons */}
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
