import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const LoginPage = () => {
  const router = useRouter()
  const { signIn, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect after successful login
  useEffect(() => {
    if (!session) return

    // Check if there's a redirect parameter
    const redirectUrl = (router.query.redirect as string) || '/hub'
    
    router.push(redirectUrl)
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // The useEffect above will handle the advertiser check and redirect
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in'
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
        setError('Tried too many times to log in, wait 15 minutes and try again')
      } else {
        setError(errorMessage)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Sign In - Take The Reins</title>
        <meta name="description" content="Sign in to Take The Reins" />
      </Head>

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

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-slate-300 text-sm">
          <p className="font-semibold mb-2">Or create an account to get started</p>
          <p>Sign up to manage multiple manifestos, track edits, and access your account from anywhere.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
