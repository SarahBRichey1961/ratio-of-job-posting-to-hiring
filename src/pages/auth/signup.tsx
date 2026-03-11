import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const SignupPage = () => {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSponsor, setIsSponsor] = useState(false)
  const [isAdvertiser, setIsAdvertiser] = useState(false)
  const [companyName, setCompanyName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isAdvertiser && !companyName.trim()) {
      setError('Company name is required for advertisers')
      return
    }

    setLoading(true)

    try {
      const { user, session } = await signUp(email, password)
      
      if (!user) {
        throw new Error('Failed to create user')
      }

      // Create sponsor or advertiser placeholder records (payment status: unpaid)
      if (isSponsor) {
        await fetch('/api/monetization/sponsor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            user_id: user.id,
            is_sponsor: false,
            payment_status: 'unpaid'
          })
        }).catch(err => console.error('Failed to create sponsor record:', err))
      }

      if (isAdvertiser) {
        await fetch('/api/monetization/advertiser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            user_id: user.id,
            company_name: companyName,
            payment_status: 'unpaid'
          })
        }).catch(err => console.error('Failed to create advertiser account:', err))
      }

      // Redirect to pricing if monetization option selected, otherwise go to redirect param or hub
      if (isSponsor || isAdvertiser) {
        router.push('/monetization/pricing')
      } else {
        const redirectUrl = (router.query.redirect as string) || '/hub'
        router.push(redirectUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
      setLoading(false)
    }
    // Note: setLoading(false) is not called here because we're redirecting
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Head>
          <title>Account Created - Take The Reins</title>
        </Head>

        <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push('/hub')}
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-slate-800 border border-emerald-600/30 rounded-xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600/20 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-emerald-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome!</h2>
            <p className="text-slate-300 mb-2">
              Your account is ready.
            </p>
            <p className="text-slate-400 text-sm">Taking you to create your manifesto...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Sign Up - Take The Reins</title>
        <meta name="description" content="Create your account on Take The Reins" />
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
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Create Account</h2>

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
              <p className="text-slate-400 text-xs mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {/* Monetization Options */}
            <div className="space-y-3 pt-4 border-t border-slate-600">
              <p className="text-slate-300 text-sm font-semibold">Interested in:</p>
              
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isSponsor}
                  onChange={(e) => setIsSponsor(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border border-slate-600 checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
                />
                <span className="text-slate-300 group-hover:text-white transition">
                  Sponsor the platform
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAdvertiser}
                  onChange={(e) => setIsAdvertiser(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border border-slate-600 checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
                />
                <span className="text-slate-300 group-hover:text-white transition">
                  Advertise with us
                </span>
              </label>

              {isAdvertiser && (
                <div className="ml-7 mt-2">
                  <label className="block text-slate-300 text-sm mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Your company name"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-white font-semibold mb-4">Why create an account?</p>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✓ Manage multiple manifestos</li>
            <li>✓ Edit and regenerate anytime</li>
            <li>✓ Track your manifesto history</li>
            <li>✓ Access from any device</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
