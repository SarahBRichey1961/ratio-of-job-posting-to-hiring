import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface Idea {
  title: string
  description: string
  monetization: string
  idea: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'ideas' | 'building'>('input')
  const [hobbies, setHobbies] = useState('')
  const [interests, setInterests] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [buildingIdea, setBuildingIdea] = useState<Idea | null>(null)
  const [buildProgress, setBuildProgress] = useState('')
  const [liveUrl, setLiveUrl] = useState('')

  const handleGenerateIdeas = async () => {
    if (!hobbies && !interests) {
      setError('Please enter hobbies or interests')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hobbies, interests }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate ideas')
      }

      const data = await response.json()
      setIdeas(data.ideas || [])
      setStep('ideas')
    } catch (err: any) {
      setError(err.message || 'Failed to generate ideas')
    } finally {
      setLoading(false)
    }
  }

  const handleBuildIdea = async (idea: Idea) => {
    setBuildingIdea(idea)
    setStep('building')
    setBuildProgress('Generating code with AI...')
    setLiveUrl('')
    setError('')

    try {
      const response = await fetch('/api/hub/build-and-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: idea.title,
          appIdea: idea.idea,
          targetUser: 'You',
          problemSolved: idea.description,
          howItWorks: idea.monetization,
          hobbies,
          interests,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Build failed')
      }

      const data = await response.json()
      setBuildProgress(`✅ Building complete! Your app is deploying...`)
      setLiveUrl(data.liveUrl || `https://${data.repoName}.netlify.app`)
    } catch (err: any) {
      setError(err.message || 'Build failed')
      setStep('ideas')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Build Money-Making Apps - Take The Reins</title>
        <meta name="description" content="Turn your hobbies into profitable apps" />
      </Head>

      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Take The Reins</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* STEP 1: Input */}
        {step === 'input' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-5xl font-bold text-white">Turn Your Passions Into Profit</h2>
              <p className="text-xl text-slate-300">Tell us about your hobbies & interests, and we'll suggest 3 apps you could build to make money</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Your Hobbies</label>
                <textarea
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  placeholder="e.g., photography, gaming, cooking, music production..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Your Interests</label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g., AI, finance, wellness, education, fitness..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />
              </div>

              {error && <div className="bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <button
                onClick={handleGenerateIdeas}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
              >
                {loading ? 'Generating Ideas...' : 'Generate 3 Money-Making Ideas'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Ideas */}
        {step === 'ideas' && ideas.length > 0 && (
          <div className="space-y-8">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-bold text-white">3 Ideas Perfect For You</h2>
              <p className="text-slate-300">Click "Build It" to deploy one instantly</p>
            </div>

            <div className="space-y-6">
              {ideas.map((idea, idx) => (
                <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-8 hover:border-indigo-500/50 transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{idea.title}</h3>
                      <p className="text-slate-300 mt-2">{idea.description}</p>
                      <p className="text-slate-400 mt-2 text-sm">💰 {idea.monetization}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">{idea.idea}</p>
                  <button
                    onClick={() => handleBuildIdea(idea)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    🚀 Build It
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('input')}
              className="mt-8 text-indigo-400 hover:text-indigo-300 text-center w-full"
            >
              ← Back to modify interests
            </button>
          </div>
        )}

        {/* STEP 3: Building */}
        {step === 'building' && buildingIdea && (
          <div className="space-y-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold text-white">Building Your App</h2>
              <p className="text-slate-300">{buildingIdea.title}</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-slate-300">{buildProgress}</p>
              </div>

              {liveUrl && (
                <div className="bg-indigo-600/20 border border-indigo-600/50 rounded-lg p-6 space-y-4">
                  <p className="text-indigo-200 font-semibold">✅ Your app is live!</p>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition text-center"
                  >
                    🌐 Open Your App →
                  </a>
                  <p className="text-slate-400 text-sm break-all">{liveUrl}</p>
                  <button
                    onClick={() => setStep('ideas')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Build Another App
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg text-sm space-y-2">
                  <p className="font-semibold">Build failed</p>
                  <p>{error}</p>
                  <button
                    onClick={() => setStep('ideas')}
                    className="bg-red-600/50 hover:bg-red-600/70 text-white font-bold py-2 px-4 rounded text-sm mt-2"
                  >
                    Back to Ideas
                  </button>
                </div>
              )}

              {!error && !liveUrl && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
