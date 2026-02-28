import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'

const BuildManifesto = () => {
  const router = useRouter()
  const [stage, setStage] = useState<'intro' | 'questions' | 'preview' | 'complete'>('intro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    professional_identity: '',
    passions: '',
    accomplishment: '',
    team_environment: '',
    boundaries: '',
    next_phase: '',
    five_year_vision: '',
  })

  const [manifestoContent, setManifestoContent] = useState('')
  const [manifestoUrl, setManifestoUrl] = useState('')

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch('/api/auth/user')
        const data = await res.json()
        if (data.user?.id) {
          setUserId(data.user.id)
        } else {
          router.push('/hub/login')
        }
      } catch (err) {
        console.error('Error getting user:', err)
        router.push('/hub/login')
      }
    }
    getUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleGenerateManifesto = async () => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    // Validate required fields
    const requiredFields = [
      formData.professional_identity,
      formData.passions,
      formData.accomplishment,
      formData.team_environment,
      formData.boundaries,
      formData.next_phase,
      formData.five_year_vision,
    ]

    if (requiredFields.some((field) => !field.trim())) {
      setError('Please answer all questions before generating your manifesto')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await axios.post('/api/hub/manifesto/generate', {
        userId,
        answers: formData,
      })

      if (res.data.manifesto) {
        setManifestoContent(res.data.manifesto)
        setManifestoUrl(res.data.url)
        setStage('preview')
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setError('Failed to generate manifesto. Please try again.')
      }
    } catch (err: any) {
      console.error('Error generating manifesto:', err)
      setError(err.response?.data?.error || 'Failed to generate manifesto')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await axios.post('/api/hub/manifesto/publish', {
        userId,
        content: manifestoContent,
      })

      if (res.data.success) {
        setManifestoUrl(res.data.url)
        setStage('complete')
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setError('Failed to publish manifesto')
      }
    } catch (err: any) {
      console.error('Error publishing manifesto:', err)
      setError(err.response?.data?.error || 'Failed to publish manifesto')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setStage('questions')
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Build Your Manifesto - Take The Reins</title>
        <meta name="description" content="Create your personal manifesto and share your authentic story." />
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/hub')}
            className="text-slate-300 hover:text-white transition text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Build Your Manifesto</h1>
          <div className="w-12"></div>
        </div>
      </nav>

      <div ref={scrollRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* INTRO STAGE */}
        {stage === 'intro' && (
          <div className="space-y-8">
            {/* Dictionary Definition */}
            <div className="bg-slate-800 border border-indigo-500/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">What's a Manifesto?</h2>
              <p className="text-lg text-slate-300 italic mb-4">
                "A public declaration of motives and intentions; a statement of principles and aims."
              </p>
              <p className="text-slate-400">
                In the context of your career, your manifesto is your authentic voice telling the world who you are—beyond
                a job title or resume. It's a statement about what you believe in, what drives you, and how you show up in
                the world.
              </p>
            </div>

            {/* Why You Need It */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Why Your Manifesto Matters</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-600/20">
                      <span className="text-rose-400">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Employers See the Real You</h3>
                    <p className="text-slate-400 text-sm">
                      They don't just want your work history—they want to understand WHO YOU ARE. Your manifesto shows
                      them your authentic values, what drives you, and how you show up.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600/20">
                      <span className="text-emerald-400">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Memorable & Shareable</h3>
                    <p className="text-slate-400 text-sm">
                      A manifesto is 10x more memorable than a resume. Drop the link on job applications, LinkedIn,
                      emails—anywhere you want to stand out.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600/20">
                      <span className="text-indigo-400">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">You Take a Stand</h3>
                    <p className="text-slate-400 text-sm">
                      Be clear on what you believe in, what energizes you, and what you won't compromise on. Attract
                      people and opportunities aligned with your values.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How We Build It Together</h2>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="text-rose-400 font-bold text-lg">1.</span>
                  <p className="text-slate-300">
                    <strong>Answer 7 Quick Questions</strong> - We'll ask about who you are, what you're passionate
                    about, and what matters to you. (~5 minutes)
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-rose-400 font-bold text-lg">2.</span>
                  <p className="text-slate-300">
                    <strong>AI Writes Your Story</strong> - Copilot transforms your answers into a compelling manifesto
                    that sounds like you
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-rose-400 font-bold text-lg">3.</span>
                  <p className="text-slate-300">
                    <strong>Review & Customize</strong> - Read it, refine it, make it perfectly yours
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-rose-400 font-bold text-lg">4.</span>
                  <p className="text-slate-300">
                    <strong>Publish & Share</strong> - Your manifesto gets its own URL. Share it anywhere.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setStage('questions')
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 px-6 rounded-lg transition"
            >
              Start Building Your Manifesto (5 minutes)
            </button>
          </div>
        )}

        {/* QUESTIONS STAGE */}
        {stage === 'questions' && (
          <div className="space-y-8 bg-slate-800/30 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Answer These 7 Questions</h2>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Q1 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                1. In one sentence, what are you professionally (or want to be)?
              </label>
              <textarea
                name="professional_identity"
                value={formData.professional_identity}
                onChange={handleInputChange}
                placeholder="e.g., A product manager passionate about building tools that solve real human problems"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">Give us your professional elevator pitch</p>
            </div>

            {/* Q2 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                2. What are you genuinely passionate about in your work?
              </label>
              <textarea
                name="passions"
                value={formData.passions}
                onChange={handleInputChange}
                placeholder="e.g., I'm energized by mentoring junior developers and seeing them grow into confident engineers"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">What makes you lose track of time?</p>
            </div>

            {/* Q3 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                3. Describe an accomplishment you're genuinely proud of—what made it matter?
              </label>
              <textarea
                name="accomplishment"
                value={formData.accomplishment}
                onChange={handleInputChange}
                placeholder="e.g., Led a cross-functional team through a complete redesign that cut user friction by 40%. What mattered: we shipped it in half the time while improving team morale."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <p className="text-slate-400 text-xs">This shows what you can do and what you value</p>
            </div>

            {/* Q4 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                4. What kind of team environment brings out your best work?
              </label>
              <textarea
                name="team_environment"
                value={formData.team_environment}
                onChange={handleInputChange}
                placeholder="e.g., Teams that are direct, curious, and collaborative. I thrive when I can ask hard questions and people aren't afraid to tell me I'm wrong."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">Help employers understand if they're a fit for you</p>
            </div>

            {/* Q5 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                5. What's a boundary or principle you won't compromise on professionally?
              </label>
              <textarea
                name="boundaries"
                value={formData.boundaries}
                onChange={handleInputChange}
                placeholder="e.g., I won't join teams where we ship low-quality work just to hit a deadline. I also won't work somewhere that doesn't invest in employee growth."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">This shows integrity and self-respect</p>
            </div>

            {/* Q6 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                6. What's driving your next career move or phase? Why now?
              </label>
              <textarea
                name="next_phase"
                value={formData.next_phase}
                onChange={handleInputChange}
                placeholder="e.g., After 8 years in tech, I'm ready to leverage what I've learned to help early-stage companies scale. I want to be part of something from the ground up."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">Share your why and your momentum</p>
            </div>

            {/* Q7 */}
            <div className="space-y-2">
              <label className="block text-white font-semibold">
                7. In 5 years, what do you want to be known for?
              </label>
              <textarea
                name="five_year_vision"
                value={formData.five_year_vision}
                onChange={handleInputChange}
                placeholder="e.g., I want to be known as someone who builds inclusive, high-performing teams and ships products that people love."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <p className="text-slate-400 text-xs">Your long-term vision and legacy</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setStage('intro')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleGenerateManifesto}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {loading ? 'Generating Your Manifesto...' : 'Generate My Manifesto'}
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW STAGE */}
        {stage === 'preview' && (
          <div className="space-y-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Your Manifesto</h2>
              <p className="text-slate-400 text-sm mb-6">
                Read it. Make sure it sounds like you. Edit if needed. Publish when ready.
              </p>

              {/* Manifesto Content Preview */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 mb-8 min-h-96">
                <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap">
                  {manifestoContent}
                </div>
              </div>

              {/* Edit/Publish - need to add direct edit capability */}
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  💡 Don't love it? You can edit directly below or go back to regenerate.
                </p>
                <textarea
                  value={manifestoContent}
                  onChange={(e) => setManifestoContent(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={10}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Back to Questions
                </button>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  {loading ? 'Publishing...' : 'Publish My Manifesto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETE STAGE */}
        {stage === 'complete' && (
          <div className="text-center space-y-8">
            <div className="bg-slate-800 border border-rose-500/30 rounded-xl p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600/20 rounded-full mb-6">
                <svg
                  className="w-8 h-8 text-rose-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Your Manifesto is Live!</h2>
              <p className="text-xl text-slate-300 mb-6">
                You've taken a stand. Now share it with the world.
              </p>

              {/* Shareable Link */}
              <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 mb-8">
                <p className="text-slate-400 text-sm mb-3">Your manifesto URL:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-left text-slate-300 break-all">
                    {manifestoUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(manifestoUrl)
                      alert('Link copied!')
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap transition"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 mb-8">
                <p className="text-white font-semibold mb-4">Share Your Manifesto</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(
                          `https://twitter.com/intent/tweet?text=I just built my manifesto on Take The Reins: ${manifestoUrl}`,
                          '_blank'
                        )
                      }
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.share?.({
                          title: 'My Manifesto',
                          text: 'Check out my manifesto on Take The Reins',
                          url: manifestoUrl,
                        })
                      }
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      window.open(manifestoUrl, '_blank')
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition"
                  >
                    View Manifesto
                  </button>
                </div>
              </div>

              {/* Next Steps */}
              <div className="text-left bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
                <p className="text-white font-semibold mb-3">What's Next?</p>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ Add this link to job applications</li>
                  <li>✓ Share it on LinkedIn</li>
                  <li>✓ Include in your email signature</li>
                  <li>✓ Keep it updated as you grow</li>
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/hub')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Back to Hub
                </button>
                <button
                  onClick={() => router.push('/hub/discussions')}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Explore Community
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuildManifesto
