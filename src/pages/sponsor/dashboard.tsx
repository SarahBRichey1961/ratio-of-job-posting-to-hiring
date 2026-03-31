import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

interface SponsorProfile {
  id: string
  user_id: string
  is_sponsor: boolean
  sponsor_name: string
  logo_url: string | null
  sponsor_tier: string
  payment_status: string
  subscription_type: string
  created_at: string
  updated_at: string
}

export default function SponsorDashboard() {
  const { session, isAuthenticated } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<SponsorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sponsorName, setSponsorName] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signup')
      return
    }

    loadProfile()
  }, [isAuthenticated])

  const loadProfile = async () => {
    if (!session?.user?.id) return

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error: err } = await supabase
        .from('sponsor_memberships')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (err && err.code !== 'PGRST116') {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
        return
      }

      if (data) {
        setProfile(data)
        setSponsorName(data.sponsor_name || '')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !session?.user?.id) return

    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Upload to Supabase storage
      const fileName = `sponsor-logos/${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(fileName)

      const logoUrl = publicUrlData.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from('sponsor_memberships')
        .update({
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        throw updateError
      }

      setProfile(prev => prev ? { ...prev, logo_url: logoUrl } : null)
      setSuccess('Logo uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError((err as Error).message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleNameUpdate = async () => {
    if (!session?.user?.id || !sponsorName.trim()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: updateError } = await supabase
        .from('sponsor_memberships')
        .update({
          sponsor_name: sponsorName,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        throw updateError
      }

      setProfile(prev => prev ? { ...prev, sponsor_name: sponsorName } : null)
      setSuccess('Sponsor name updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update sponsor name')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Sponsor Dashboard - Take The Reins</title>
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-white font-bold text-lg hover:text-indigo-400 transition">
            Take The Reins
          </Link>
          <div className="space-x-4">
            <Link href="/hub" className="text-slate-300 hover:text-white transition">
              Back to Hub
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sponsor Dashboard</h1>
          <p className="text-slate-400 mb-8">Manage your sponsor profile and brand presence</p>

          {error && (
            <div className="mb-6 bg-red-600/20 border border-red-600/50 text-red-200 px-6 py-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-600/20 border border-green-600/50 text-green-200 px-6 py-4 rounded-lg">
              {success}
            </div>
          )}

          {/* Membership Status */}
          <div className="bg-slate-900/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Membership Status</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className="text-white text-lg font-semibold capitalize">
                  {profile?.payment_status || 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Subscription Type</p>
                <p className="text-white text-lg font-semibold capitalize">
                  {profile?.subscription_type || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Sponsor Tier</p>
                <p className="text-white text-lg font-semibold capitalize">
                  {profile?.sponsor_tier || 'Basic'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Member Since</p>
                <p className="text-white text-lg font-semibold">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Sponsor Information */}
          <div className="bg-slate-900/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Sponsor Information</h2>

            {/* Sponsor Name */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">Sponsor Name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  placeholder="Your company or sponsor name"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleNameUpdate}
                  disabled={loading || !sponsorName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-white font-semibold mb-4">Sponsor Logo</label>

              {profile?.logo_url && (
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">Current Logo:</p>
                  <img
                    src={profile.logo_url}
                    alt="Sponsor Logo"
                    className="h-32 w-auto rounded-lg border border-slate-600"
                  />
                </div>
              )}

              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500/50 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-white font-semibold mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload your logo'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    PNG, JPG up to 5MB • Recommended: 500x500px
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4">
            <Link
              href="/hub"
              className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Back to Hub
            </Link>
            <Link
              href="/monetization/pricing"
              className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Manage Membership
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
