import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getSupabase } from '@/lib/supabase'

const HubLogin = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not initialized')

      if (isSignup) {
        // Sign up
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
            },
          },
        })
        if (signupError) throw signupError
        if (data?.user) {
          setError('Account created! Logging in...')
          await new Promise(r => setTimeout(r, 1000))
          router.push('/hub')
        }
      } else {
        // Sign in
        const { data, error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signinError) throw signinError
        if (data?.user) {
          await new Promise(r => setTimeout(r, 500))
          router.push('/hub')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError((err as Error).message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Head>
        <title>Login - Hub</title>
      </Head>

      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Take The Reins</h1>
        <p className="text-gray-600 mb-6">Learn, build, and collaborate on AI solutions</p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HubLogin
