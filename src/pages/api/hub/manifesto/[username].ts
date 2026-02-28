import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username or ID required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    // First, try to find by username in hub_members (authenticated users)
    const { data: authenticatedUser, error: authError } = await supabase
      .from('hub_members')
      .select('username, bio, avatar_url, manifesto, updated_at')
      .eq('username', username)
      .not('manifesto', 'is', null)
      .single()

    if (!authError && authenticatedUser) {
      return res.status(200).json(authenticatedUser)
    }

    // If not found, try to find by ID in public_manifestos (anonymous users)
    const { data: anonymousManifesto, error: anonError } = await supabase
      .from('public_manifestos')
      .select('id, content, username, created_at, updated_at')
      .eq('id', username)
      .single()

    if (!anonError && anonymousManifesto) {
      return res.status(200).json({
        username: anonymousManifesto.username || 'Anonymous',
        bio: null,
        avatar_url: null,
        manifesto: anonymousManifesto.content,
        updated_at: anonymousManifesto.updated_at,
        isAnonymous: true,
      })
    }

    // Not found in either table
    return res.status(404).json({ error: 'Manifesto not found' })
  } catch (error: any) {
    console.error('Error fetching manifesto:', error)
    return res.status(500).json({
      error: error.message || 'Failed to fetch manifesto',
    })
  }
}
