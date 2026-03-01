import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface RecentManifesto {
  id: string
  url: string
  createdAt: string
  preview: string
}

const RecentManifestos = () => {
  const router = useRouter()
  const [manifestos, setManifestos] = useState<RecentManifesto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage on client side only
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recentManifestos')
        const recent = stored ? JSON.parse(stored) : []
        setManifestos(recent)
      } catch (err) {
        console.error('Error loading recent manifestos:', err)
      }
    }
    setLoading(false)
  }, [])

  const handleDelete = (id: string) => {
    if (typeof window !== 'undefined' && confirm('Remove this manifesto from your recent list?')) {
      try {
        const existing = localStorage.getItem('recentManifestos')
        const recent = existing ? JSON.parse(existing) : []
        const updated = recent.filter((m: RecentManifesto) => m.id !== id)
        localStorage.setItem('recentManifestos', JSON.stringify(updated))
        setManifestos(updated)
      } catch (err) {
        console.error('Error deleting manifesto:', err)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Head>
        <title>My Recent Manifestos | Take The Reigns</title>
        <meta name="description" content="View and manage your recently created manifestos" />
      </Head>

      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">My Recent Manifestos</h1>
                <p className="text-slate-400 mt-2">Stored locally in your browser</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/hub"
                  className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Back to Hub
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading...</p>
            </div>
          ) : manifestos.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <p className="text-slate-400 text-lg mb-6">No recent manifestos yet</p>
              <button
                onClick={() => router.push('/hub/members/new')}
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                Create Your First Manifesto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {manifestos.map((manifesto) => (
                <div
                  key={manifesto.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:bg-slate-800/70 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white font-mono text-sm bg-slate-900 px-3 py-1 rounded">
                          {manifesto.id}
                        </h3>
                        <span className="text-xs text-slate-400">
                          {formatDate(manifesto.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                        {manifesto.preview}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(manifesto.url, '_blank')}
                          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/hub/members/new?editId=${manifesto.id}`)}
                          className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                        >
                          Edit & Regenerate
                        </button>
                        <button
                          onClick={() => handleDelete(manifesto.id)}
                          className="text-sm px-4 py-2 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-3">💡 About Recent Manifestos</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ Your manifestos are stored in your browser's local storage</li>
              <li>✓ They persist across sessions on this device</li>
              <li>✓ Create an account to sync across devices and get a permanent dashboard</li>
              <li>✓ Clearing browser data will remove this list</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export default RecentManifestos
