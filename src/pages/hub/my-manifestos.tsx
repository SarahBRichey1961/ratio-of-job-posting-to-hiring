import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'

interface Manifesto {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  created_at: string
  updated_at: string
}

const MyManifestosPage = () => {
  const router = useRouter()
  const { user, signOut, isLoading: authLoading, isAuthenticated } = useAuth()
  const [manifestos, setManifestos] = useState<Manifesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated) {
      loadManifestos()
    }
  }, [isAuthenticated, authLoading])

  const loadManifestos = async () => {
    setLoading(true)
    try {
      // Get the auth token to pass to API
      const client = getSupabase()
      const { data: { session } } = await client?.auth.getSession() || { data: { session: null } }
      
      const config: any = {}
      if (session?.access_token) {
        config.headers = {
          Authorization: `Bearer ${session.access_token}`,
        }
      }
      
      const res = await axios.get('/api/hub/manifestos', config)
      setManifestos(res.data.manifestos || [])
      setError('')
    } catch (err: any) {
      console.error('Error loading manifestos:', err)
      setError(err.response?.data?.error || 'Failed to load manifestos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this manifesto?')) return

    setDeletingId(id)
    try {
      // Get the auth token to pass to API
      const client = getSupabase()
      const { data: { session } } = await client?.auth.getSession() || { data: { session: null } }
      
      const config: any = {}
      if (session?.access_token) {
        config.headers = {
          Authorization: `Bearer ${session.access_token}`,
        }
      }
      
      await axios.delete(`/api/hub/manifestos?id=${id}`, config)
      setManifestos((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete manifesto')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/hub')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-600/20 rounded-full mb-4 animate-spin">
            <div className="w-8 h-8 border-2 border-rose-600/20 border-t-rose-600 rounded-full"></div>
          </div>
          <p className="text-slate-300">Loading your manifestos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>My Manifestos - Take The Reins</title>
        <meta name="description" content="Manage your manifestos on Take The Reins" />
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/hub')}
            className="text-slate-300 hover:text-white transition text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">My Manifestos</h1>
          <button
            onClick={handleSignOut}
            className="text-slate-300 hover:text-white transition text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.email}!</h2>
          <p className="text-slate-400">Manage, edit, and regenerate your manifestos below.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/50 text-red-200 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Create New */}
        <div className="mb-12">
          <Link href="/hub/members/new">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition">
              + Create New Manifesto
            </button>
          </Link>
        </div>

        {/* Manifestos List */}
        {manifestos.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-6">You haven't created any manifestos yet.</p>
            <Link href="/hub/members/new">
              <button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                Build Your First Manifesto
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {manifestos.map((manifesto) => (
              <div key={manifesto.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{manifesto.title}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{manifesto.content.substring(0, 150)}...</p>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>Created: {new Date(manifesto.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated: {new Date(manifesto.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {manifesto.published && (
                      <span className="inline-block bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded text-xs font-semibold">
                        Published
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(`/manifesto/${manifesto.slug}`, '_blank')}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/hub/members/new?editId=${manifesto.id}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(manifesto.id)}
                    disabled={deletingId === manifesto.id}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 px-4 py-2 rounded text-sm transition disabled:opacity-50"
                  >
                    {deletingId === manifesto.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyManifestosPage
