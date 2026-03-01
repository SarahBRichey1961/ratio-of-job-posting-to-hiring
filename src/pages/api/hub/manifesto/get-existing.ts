import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' })
    }

    // Fetch the user's manifesto and Q&A data
    const { data, error } = await supabase
      .from('hub_members')
      .select('manifesto, manifesto_questions, username')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Manifesto not found' })
    }

    return res.status(200).json({
      success: true,
      content: data.manifesto,
      questions_data: data.manifesto_questions ? JSON.parse(data.manifesto_questions) : [],
      username: data.username,
    })
  } catch (error: any) {
    console.error('Error fetching manifesto:', error)
    return res.status(500).json({ error: 'Failed to fetch manifesto' })
  }
}
