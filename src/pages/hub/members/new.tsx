import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface Question {
  id: string
  question: string
  answer: string
  isDefault: boolean
  isIncluded: boolean
}

const defaultQuestions = [
  {
    id: 'q1',
    question: 'In one sentence, what are you professionally (or want to be)?',
    hint: 'Give us your professional elevator pitch',
  },
  {
    id: 'q2',
    question: 'What are you genuinely passionate about in your work?',
    hint: 'What makes you lose track of time?',
  },
  {
    id: 'q3',
    question:
      'Describe an accomplishment you\'re genuinely proud of—what made it matter?',
    hint: 'This shows what you can do and what you value',
  },
  {
    id: 'q4',
    question: 'What kind of team environment brings out your best work?',
    hint: 'Help employers understand if they\'re a fit for you',
  },
  {
    id: 'q5',
    question: 'What\'s a boundary or principle you won\'t compromise on professionally?',
    hint: 'This shows integrity and self-respect',
  },
  {
    id: 'q6',
    question: 'What\'s driving your next career move or phase? Why now?',
    hint: 'Share your why and your momentum',
  },
  {
    id: 'q7',
    question: 'In 5 years, what do you want to be known for?',
    hint: 'Your long-term vision and legacy',
  },
]

const BuildManifesto = () => {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [stage, setStage] = useState<'intro' | 'questions' | 'preview' | 'complete'>('intro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [questions, setQuestions] = useState<Question[]>(
    defaultQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: '',
      isDefault: true,
      isIncluded: true,
    }))
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [manifestoContent, setManifestoContent] = useState('')
  const [manifestoUrl, setManifestoUrl] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Tone selection state
  const toneOptions = ['Bold', 'Professional', 'Serious', 'Funny', 'Insightful', 'Futuristic', 'BadAss', 'Motivational', 'Inspirational', 'Sassy', 'Sarcastic', 'Uppity', 'Kind', 'Loving', 'Humanitarian', 'World peace focus']
  const [selectedTones, setSelectedTones] = useState<string[]>([])

  // Pronouns selection state
  const pronounsOptions = ['I am woman hear me roar!', "A man's man", 'A bro', 'A sister', 'We', 'Male', 'Female', 'Binary']
  const [selectedPronouns, setSelectedPronouns] = useState<string | null>(null)

  // Meme generation state
  const [generateMeme, setGenerateMeme] = useState(false)
  const [memeImage, setMemeImage] = useState<string | null>(null)

  // Check auth status and initialize userId
  useEffect(() => {
    if (!isAuthLoading) {
      if (user?.id) {
        // User is authenticated - use their real ID
        setUserId(user.id)
        setIsAuthenticated(true)
        setUserEmail(user.email || null)
      } else {
        // Anonymous user - generate random sessionId
        const sessionId = Math.random().toString(36).substring(2, 15)
        setUserId(sessionId)
        setIsAuthenticated(false)
      }
    }
  }, [user, isAuthLoading])

  // Check if we're editing an existing manifesto
  useEffect(() => {
    if (userId && router.query.editId) {
      loadExistingManifesto(router.query.editId as string)
    }
  }, [router.query.editId, userId])

  const loadExistingManifesto = async (userId: string) => {
    try {
      const res = await axios.get(`/api/hub/manifesto/get-existing?userId=${userId}`)
      if (res.data.success) {
        setIsEditMode(true)
        setManifestoContent(res.data.content)
        
        // Load the questions and answers
        if (res.data.questions_data && res.data.questions_data.length > 0) {
          const loadedQuestions = res.data.questions_data.map((qa: any, idx: number) => ({
            id: `q${idx + 1}`,
            question: qa.question,
            answer: qa.answer,
            isDefault: idx < 7, // Assume first 7 are defaults
            isIncluded: true,
          }))
          setQuestions(loadedQuestions)
        }
        
        // Jump to preview stage if content already exists
        if (res.data.content) {
          setStage('preview')
        } else {
          setStage('questions')
        }
      }
    } catch (err) {
      console.error('Error loading existing manifesto:', err)
      // Continue without loading - create new instead
    }
  }

  const handleAnswerChange = (id: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer: value } : q))
    )
  }

  const handleEditQuestion = (id: string) => {
    const question = questions.find((q) => q.id === id)
    if (question) {
      setEditingId(id)
      setEditingText(question.question)
    }
  }

  const handleSaveEdit = (id: string) => {
    if (editingText.trim()) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, question: editingText.trim() } : q
        )
      )
    }
    setEditingId(null)
    setEditingText('')
  }

  const handleToggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isIncluded: !q.isIncluded } : q))
    )
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleAddQuestion = () => {
    const newId = `custom-${Date.now()}`
    const newQuestion: Question = {
      id: newId,
      question: '',
      answer: '',
      isDefault: false,
      isIncluded: true,
    }
    setQuestions((prev) => [...prev, newQuestion])
    setEditingId(newId)
    setEditingText('')
  }

  const handleToneToggle = (tone: string) => {
    setSelectedTones((prev) => {
      if (prev.includes(tone)) {
        // Remove if already selected
        return prev.filter((t) => t !== tone)
      } else if (prev.length < 2) {
        // Add if under 2 selections
        return [...prev, tone]
      }
      // Don't add if already 2 selected
      return prev
    })
  }

  const handleGenerateManifesto = async () => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    // Filter to only included questions
    const includedQuestions = questions.filter((q) => q.isIncluded)

    // Validate required fields
    if (includedQuestions.length === 0) {
      setError('You need at least one question')
      return
    }

    if (includedQuestions.some((q) => !q.question.trim() || !q.answer.trim())) {
      setError('Please answer all your questions and give them text before generating')
      return
    }

    setLoading(true)
    setError('')
    setMemeImage(null) // Reset meme image

    try {
      // Build answers object from included questions
      const answers: Record<string, string> = {}
      includedQuestions.forEach((q, index) => {
        answers[`question_${index + 1}`] = q.answer
        answers[`question_${index + 1}_prompt`] = q.question
      })

      const res = await axios.post('/api/hub/manifesto/generate', {
        userId,
        answers,
        questions: includedQuestions.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
        tones: selectedTones,
        pronouns: selectedPronouns,
        generateMeme: generateMeme,
      }, {
        timeout: 50000 // 50 second timeout (manifesto ~15-20s + meme ~20-25s max)
      })

      if (res.data.manifesto) {
        setManifestoContent(res.data.manifesto)
        setManifestoUrl(res.data.url)
        if (res.data.memeImage) {
          setMemeImage(res.data.memeImage)
        } else if (generateMeme) {
          // Meme was requested but not generated (might have timed out)
          console.warn('Meme generation did not complete in time')
        }
        setStage('preview')
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setError('Failed to generate manifesto. Please try again.')
      }
    } catch (err: any) {
      console.error('Error generating manifesto:', err)
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Manifesto generation took too long. Try again with fewer questions or without meme generation.')
      } else {
        setError(err.response?.data?.error || 'Failed to generate manifesto')
      }
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
      const questionsData = questions.map((q) => ({
        question: q.question,
        answer: q.answer,
      }))
      
      // Get auth token if user is logged in
      const client = getSupabase()
      const { data: { session } } = await client?.auth.getSession() || { data: { session: null } }
      
      const axiosConfig: any = {
        headers: {}
      }
      
      // Pass auth token if available
      if (session?.access_token) {
        axiosConfig.headers.Authorization = `Bearer ${session.access_token}`
      }
      
      const res = await axios.post('/api/hub/manifesto/publish', {
        userId,
        content: manifestoContent,
        questionsData,
        memeImageUrl: memeImage,
      }, axiosConfig)

      if (res.data.success) {
        setManifestoUrl(res.data.url)
        setUserEmail(res.data.email || null)
        
        // Extract manifesto ID from URL (e.g., /manifesto/abc123 -> abc123)
        const manifestoId = res.data.url.split('/').pop()
        
        // Save to localStorage for easy access
        if (typeof window !== 'undefined' && manifestoId) {
          try {
            const existing = localStorage.getItem('recentManifestos')
            const recent = existing ? JSON.parse(existing) : []
            
            // Add new manifesto to the beginning of the list
            const newManifesto = {
              id: manifestoId,
              url: res.data.url,
              createdAt: new Date().toISOString(),
              preview: manifestoContent.substring(0, 150) + '...',
            }
            
            // Remove duplicates (if re-publishing the same one)
            const filtered = recent.filter((m: any) => m.id !== manifestoId)
            
            // Keep only last 10 manifestos
            const updated = [newManifesto, ...filtered].slice(0, 10)
            localStorage.setItem('recentManifestos', JSON.stringify(updated))
          } catch (err) {
            console.error('Error saving to localStorage:', err)
          }
        }
        
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
          <h1 className="text-xl font-bold text-white">
            {isEditMode ? 'Edit Your Manifesto' : 'Build Your Manifesto'}
          </h1>
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

            {/* Login Offer or Auth Status */}
            {isAuthenticated ? (
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/50 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">Account Connected</h2>
                </div>
                <p className="text-slate-300 mb-4">
                  You're logged in as <code className="bg-slate-900 px-2 py-1 rounded text-emerald-300">{userEmail}</code>
                </p>
                <p className="text-slate-400 text-sm">
                  Your manifesto will be saved to your account and you'll get a personalized email-based URL.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-indigo-600/20 to-rose-600/20 border border-indigo-600/50 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Want a Custom URL?</h2>
                <p className="text-slate-300 mb-6">
                  Sign in to get a personalized, email-based manifesto URL that's easy to share and remember:
                </p>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6">
                  <code className="text-indigo-300 font-semibold">takethereigns.netlify.app/manifesto/your@email.com</code>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  Perfect for LinkedIn profiles, résumés, and business cards. Or skip this and create anonymously—it's up to you.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    Sign Up (Free)
                  </button>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    Log In
                  </button>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How We Build It Together</h2>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="text-rose-400 font-bold text-lg">1.</span>
                  <p className="text-slate-300">
                    <strong>Answer Questions (Your Way)</strong> - We provide 7 starter questions, but you can edit them, remove ones that don't resonate, or add your own. Make it personal.
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
              Start Build Your Manifesto (In Your Own Words)
            </button>
          </div>
        )}

        {/* QUESTIONS STAGE */}
        {stage === 'questions' && (
          <div className="space-y-8 bg-slate-800/30 border border-slate-700 rounded-xl p-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Answer These Questions</h2>
              <p className="text-slate-400 text-sm mb-6">
                Feel free to edit the questions, remove ones you don't want to answer, or add your own. Make it yours.
              </p>
              <p className="text-indigo-400 text-sm font-medium mb-6">
                {questions.filter((q) => q.isIncluded).length} question{questions.filter((q) => q.isIncluded).length !== 1 ? 's' : ''} • Customize to fit your voice
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="space-y-3 pb-6 border-b border-slate-700 last:border-b-0">
                  {/* Question Header with Edit/Remove */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {editingId === q.id ? (
                        <div className="space-y-2">
                          <label className="block text-white font-semibold text-sm">
                            Edit Question {q.isDefault ? '' : '(Custom)'}
                          </label>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="block text-white font-semibold">
                          {index + 1}. {q.question}
                        </label>
                      )}
                    </div>
                    {editingId !== q.id && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditQuestion(q.id)}
                          title="Edit question"
                          className="text-slate-400 hover:text-indigo-400 transition text-lg"
                        >
                          ✏️
                        </button>
                        {!q.isDefault ? (
                          <button
                            onClick={() => handleRemoveQuestion(q.id)}
                            title="Remove custom question"
                            className="text-slate-400 hover:text-red-400 transition text-lg"
                          >
                            ✕
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleQuestion(q.id)}
                            title={q.isIncluded ? 'Skip this question' : 'Include this question'}
                            className={`text-lg transition ${
                              q.isIncluded
                                ? 'text-emerald-400 hover:text-slate-400'
                                : 'text-slate-600 hover:text-emerald-400'
                            }`}
                          >
                            {q.isIncluded ? '✓' : '○'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Answer Textarea (if included) */}
                  {editingId !== q.id && q.isIncluded && (
                    <textarea
                      value={q.answer}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  )}

                  {/* Skipped Indicator */}
                  {editingId !== q.id && !q.isIncluded && (
                    <p className="text-slate-500 italic text-sm">
                      (Skipped - click the ○ button to include)
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Question Button */}
            <button
              onClick={handleAddQuestion}
              className="w-full border-2 border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 font-semibold py-3 px-6 rounded-lg transition"
            >
              + Add Your Own Question
            </button>

            {/* Tone Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Writing Tone (Optional)</h3>
              <p className="text-slate-400 text-sm mb-4">
                Pick up to 2 tones to guide how your manifesto is written. Leave empty for the default tone.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {toneOptions.map((tone) => (
                  <label key={tone} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTones.includes(tone)}
                      onChange={() => handleToneToggle(tone)}
                      disabled={selectedTones.length === 2 && !selectedTones.includes(tone)}
                      className={`w-4 h-4 rounded border-slate-600 ${
                        selectedTones.includes(tone)
                          ? 'bg-indigo-600 border-indigo-600 cursor-pointer'
                          : selectedTones.length === 2
                            ? 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-slate-700 border-slate-600 cursor-pointer'
                      }`}
                    />
                    <span className={selectedTones.includes(tone) ? 'text-white font-semibold' : 'text-slate-400'}>
                      {tone}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3">
                Selected: {selectedTones.length > 0 ? selectedTones.join(' + ') : 'None (default tone)'}
              </p>
            </div>

            {/* Pronouns Selection */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Pronouns & Perspective (Optional)</h3>
              <p className="text-slate-400 text-sm mb-4">
                Select pronouns to help personalize your manifesto's voice and perspective.
              </p>
              <select
                value={selectedPronouns || ''}
                onChange={(e) => setSelectedPronouns(e.target.value || null)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">-- Choose perspective --</option>
                {pronounsOptions.map((pronoun) => (
                  <option key={pronoun} value={pronoun}>
                    {pronoun}
                  </option>
                ))}
              </select>
              {selectedPronouns && (
                <p className="text-slate-400 text-sm mt-3">
                  Selected: <span className="text-indigo-400 font-semibold">{selectedPronouns}</span>
                </p>
              )}
            </div>

            {/* Meme Generation Option */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateMeme}
                  onChange={(e) => setGenerateMeme(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 border-slate-600 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold">Generate Inspirational Meme</p>
                  <p className="text-slate-400 text-sm">Create a graphic with an inspiring quote from your manifesto (Upper right corner preview)</p>
                </div>
              </label>
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
                disabled={loading || questions.filter((q) => q.isIncluded).length === 0}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {loading ? 'Generating Your Manifesto...' : `Generate My Manifesto (${questions.filter((q) => q.isIncluded).length} Q)`}
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

              {/* Meme Preview Section (if applicable) */}
              {generateMeme && (
                <div className="mb-8 border border-slate-600 rounded-lg p-6 bg-slate-900/50">
                  <h3 className="text-lg font-bold text-white mb-4">Inspirational Meme Preview</h3>
                  {memeImage ? (
                    <div className="text-center">
                      <img 
                        src={memeImage} 
                        alt="Inspirational Meme" 
                        className="max-w-xs h-auto rounded-lg border-2 border-indigo-500 shadow-lg mx-auto mb-3"
                      />
                      <p className="text-slate-400 text-sm">
                        ✓ Meme generated - Will be included when published
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-6">
                      <p className="mb-2">Generating meme...</p>
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Manifesto Content Preview */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 mb-8 min-h-96 relative">
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

              {/* Personalization Badge */}
              {userEmail && (
                <div className="mb-6 inline-block bg-indigo-600/20 border border-indigo-600/50 rounded-lg px-4 py-2">
                  <p className="text-indigo-300 text-sm font-semibold">
                    ✓ Your email-based URL is easy to share and remember
                  </p>
                </div>
              )}

              {/* Shareable Link */}
              <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 mb-8">
                <p className="text-slate-400 text-sm mb-3">Your manifesto URL:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-left text-indigo-300 break-all font-mono text-lg font-semibold">
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
                  onClick={() => handleEdit()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Edit Manifesto
                </button>
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
