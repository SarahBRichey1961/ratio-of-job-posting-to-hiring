import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { data, error } = await supabase
      .from('hub_members')
      .select('username, bio, avatar_url, manifesto, updated_at')
      .eq('username', username)
      .not('manifesto', 'is', null)
      .single()

    if (error || !data) {
      console.error('Error fetching manifesto:', error)
      return res.status(404).json({ error: 'Manifesto not found' })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('Error fetching manifesto:', error)
    return res.status(500).json({
      error: error.message || 'Failed to fetch manifesto',
    })
  }
}
