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

interface AIAnalysis {
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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<IdeaFormData>({
    mainIdea: '',
    targetUser: '',
    problemSolved: '',
    howItWorks: '',
  })
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)

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
      setAnalysis(data)
      setStep(2)
    } catch (err) {
      setError((err as Error).message || 'Error analyzing idea. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFormData({ mainIdea: '', targetUser: '', problemSolved: '', howItWorks: '' })
    setAnalysis(null)
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

        {/* Step 2: AI Analysis */}
        {step === 2 && analysis && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-white">Here's Your Blueprint</h2>
            </div>

            {/* Feasibility */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📊 Feasibility Assessment</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{analysis.feasibility}</p>
            </div>

            {/* Step-by-Step Build Plan */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🛠️ Step-by-Step Build Plan</h3>
              <ol className="space-y-3">
                {analysis.buildPlan.map((step, idx) => (
                  <li key={idx} className="flex gap-4 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Beginner-Friendly Technologies */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">💻 Recommended Tech Stack (Zero-Config, Beginner-Friendly)</h3>
              <div className="space-y-3">
                {analysis.technologies.map((tech, idx) => (
                  <div key={idx} className="flex gap-3 text-slate-300 p-3 bg-slate-900/50 rounded-lg">
                    <span className="flex-shrink-0">✓</span>
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded">
                💡 No complex setup needed. These tools work out-of-the-box!
              </p>
            </div>

            {/* MVP Tasks (Quick Wins) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🚀 MVP (Minimum Viable Product) - Launch First</h3>
              <p className="text-slate-400 mb-4">Start with these core features to get live quickly:</p>
              <div className="space-y-2">
                {analysis.mvpTasks.map((task, idx) => (
                  <div key={idx} className="flex gap-3 text-slate-300">
                    <input type="checkbox" disabled className="flex-shrink-0 mt-1" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Strategy (Best Practice) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">✅ Testing Strategy (Before Launch)</h3>
              <p className="text-slate-400 text-sm mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded">
                📋 Best Practice: Test with real users before launching to catch bugs and get feedback
              </p>
              <p className="text-slate-300 whitespace-pre-wrap">{analysis.testStrategy}</p>
            </div>

            {/* Launch Strategy */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📈 Launch Strategy</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{analysis.launchStrategy}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                💡 Analyze Another Idea
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
