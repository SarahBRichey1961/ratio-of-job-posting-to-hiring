import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get user profile from hub_members
    const { data: profile, error: profileError } = await supabase
      .from('hub_members')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Return basic auth user if profile doesn't exist yet
      return res.status(200).json({
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      })
    }

    return res.status(200).json({
      user: {
        id: session.user.id,
        email: session.user.email,
        ...profile,
      },
    })
  } catch (error: any) {
    console.error('Error getting user:', error)
    return res.status(500).json({
      error: error.message || 'Failed to get user',
    })
  }
}
