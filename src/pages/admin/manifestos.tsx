import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface Manifesto {
  id: string
  user_id: string
  user_email: string
  title: string
  slug: string
  public_url: string
  published: boolean
  created_at: string
  updated_at: string
}

export default function AdminManifestosPage() {
  const { session, isAuthenticated } = useAuth()
  const [manifestos, setManifestos] = useState<Manifesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<string>('')

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    fetchManifestos()
  }, [isAuthenticated, session])

  const fetchManifestos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = session?.access_token
      if (!token) {
        setError('No session token available')
        return
      }

      const response = await fetch('/api/admin/manifestos', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch manifestos')
        return
      }

      setAdminUser(data.admin_user)
      setManifestos(data.manifestos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch manifestos')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p>You must be logged in to access the admin panel.</p>
            <Link href="/login" className="text-blue-400 hover:underline mt-4 inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Manifestos Management</h1>
              <p className="text-gray-400">View all published user manifestos</p>
              <p className="text-sm text-gray-500 mt-2">Logged in as: <strong>{adminUser}</strong></p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/comparison"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Loading manifestos...</p>
          </div>
        )}

        {/* No Manifestos */}
        {!isLoading && manifestos.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No published manifestos found in the system</p>
          </div>
        )}

        {/* Stats */}
        {!isLoading && manifestos.length > 0 && (
          <>
            <div className="mb-6">
              <div className="bg-slate-800 rounded-lg p-4 inline-block">
                <p className="text-gray-400 text-sm">Total Published Manifestos</p>
                <p className="text-4xl font-bold text-purple-400">{manifestos.length}</p>
              </div>
            </div>

            {/* Manifestos Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-300">Title</th>
                    <th className="text-left py-3 px-4 text-gray-300">Author Email</th>
                    <th className="text-left py-3 px-4 text-gray-300">Slug</th>
                    <th className="text-left py-3 px-4 text-gray-300">Published</th>
                    <th className="text-center py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manifestos.map((manifesto) => (
                    <tr
                      key={manifesto.id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold">{manifesto.title || 'Untitled'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-blue-400">{manifesto.user_email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-300 font-mono text-sm">{manifesto.slug}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            manifesto.published
                              ? 'bg-green-900/30 text-green-400 border border-green-700'
                              : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                          }`}
                        >
                          {manifesto.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={manifesto.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline inline-block"
                        >
                          View Manifesto →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed List */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Detailed Manifesto List</h2>
              <div className="space-y-4">
                {manifestos.map((manifesto) => (
                  <div key={manifesto.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{manifesto.title || 'Untitled'}</h3>
                      <a
                        href={manifesto.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Open →
                      </a>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>Author:</strong> {manifesto.user_email}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>URL:</strong> <span className="font-mono text-purple-400">{manifesto.public_url}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      <strong>Created:</strong> {new Date(manifesto.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      <strong>Last Updated:</strong> {new Date(manifesto.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
