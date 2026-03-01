import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'

interface ManifestoData {
  username: string
  title?: string
  bio?: string
  avatar_url?: string
  manifesto: string
  updated_at: string
  isAnonymous?: boolean
  isEmail?: boolean
  questions_data?: any[]
}

const ManifestoPage = () => {
  const router = useRouter()
  const { username } = router.query
  const [manifesto, setManifesto] = useState<ManifestoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    const fetchManifesto = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/api/hub/manifesto/${username}`)
        setManifesto(res.data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching manifesto:', err)
        setError(err.response?.data?.error || 'Manifesto not found')
        setManifesto(null)
      } finally {
        setLoading(false)
      }
    }

    fetchManifesto()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-600/20 rounded-full mb-4 animate-spin">
            <div className="w-8 h-8 border-2 border-rose-600/20 border-t-rose-600 rounded-full"></div>
          </div>
          <p className="text-slate-300">Loading manifesto...</p>
        </div>
      </div>
    )
  }

  if (error || !manifesto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <button
              onClick={() => router.push('/hub')}
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              ← Back to Take The Reins
            </button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Manifesto Not Found</h1>
          <p className="text-slate-400 mb-8">{error || 'This manifesto could not be found.'}</p>
          <button
            onClick={() => router.push('/hub')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Return to Take The Reins
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>{manifesto.username}'s Manifesto - Take The Reins</title>
        <meta name="description" content={`${manifesto.username}'s personal manifesto`} />
        <meta property="og:title" content={`${manifesto.username}'s Manifesto`} />
        <meta property="og:description" content={manifesto.manifesto.substring(0, 150) + '...'} />
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
          <h1 className="text-xl font-bold text-white">Take The Reins</h1>
          <div className="w-12"></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {manifesto.avatar_url && (
            <div className="inline-block mb-6">
              <img
                src={manifesto.avatar_url}
                alt={manifesto.username}
                className="w-24 h-24 rounded-full border-4 border-rose-600/30"
              />
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            {manifesto.username}
          </h1>
          {manifesto.isEmail && (
            <div className="inline-block bg-indigo-600/20 border border-indigo-600/50 rounded-lg px-4 py-2 mb-4">
              <p className="text-indigo-300 text-sm font-semibold">
                ✓ Email-based URL - Personal & Easy to Share
              </p>
            </div>
          )}
          {manifesto.bio && (
            <p className="text-lg text-slate-300 mb-6">{manifesto.bio}</p>
          )}
          <p className="text-sm text-slate-500">
            Last updated {new Date(manifesto.updated_at).toLocaleDateString()}
          </p>
          {manifesto.isAnonymous && !manifesto.isEmail && (
            <p className="text-sm text-emerald-400 mt-2">
              ✓ Anonymous manifesto - No account needed to share!
            </p>
          )}
        </div>

        {/* Manifesto Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 mb-12">
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
              {manifesto.manifesto}
            </div>
          </div>
        </div>

        {/* Actions for Owner */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8 text-center">
          <p className="text-slate-300 mb-4 text-sm">Is this your manifesto?</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const manifestoId = router.query.username as string
                router.push(`/hub/members/new?editId=${manifestoId}`)
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm transition font-semibold"
          >
            Edit & Regenerate
          </button>
        </div>

        {/* Share Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-300 mb-6">
            Share <strong>{manifesto.username}'s</strong> manifesto:
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                window.open(
                  `https://twitter.com/intent/tweet?text=Check out ${manifesto.username}'s manifesto on Take The Reins: ${url}`,
                  '_blank'
                )
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Share on Twitter
            </button>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({
                    title: `${manifesto.username}'s Manifesto`,
                    text: 'Read their manifesto on Take The Reins',
                    url: typeof window !== 'undefined' ? window.location.href : '',
                  })
                }
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Share
            </button>
            <button
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                const subject = `${manifesto.username}'s Manifesto`
                const body = `Check out this manifesto: ${url}`
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Email
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-300 mb-6">
            Inspiring? Build your own manifesto on Take The Reins.
          </p>
          <button
            onClick={() => router.push('/hub/members/new')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Build Your Manifesto
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          <p>
            Take The Reins © 2026. Where job seekers take control of their pathway forward.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ManifestoPage
