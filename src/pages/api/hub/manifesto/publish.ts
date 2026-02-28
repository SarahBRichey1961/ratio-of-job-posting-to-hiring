import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, content } = req.body

  if (!userId || !content) {
    return res.status(400).json({ error: 'User ID and content required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    // Update the hub_members table with the manifesto content
    const { error } = await supabase
      .from('hub_members')
      .update({
        manifesto: content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating manifesto:', error)
      return res.status(500).json({ error: 'Failed to publish manifesto' })
    }

    // Fetch the updated user to get username for the URL
    const { data: userData, error: fetchError } = await supabase
      .from('hub_members')
      .select('username')
      .eq('id', userId)
      .single()

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError)
      return res.status(200).json({
        success: true,
        url: `https://takethereins.ai/manifesto/${userId}`,
      })
    }

    const manifestoUrl = `https://takethereins.ai/manifesto/${userData.username}`

    return res.status(200).json({
      success: true,
      url: manifestoUrl,
      published_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error publishing manifesto:', error)
    return res.status(500).json({
      error: error.message || 'Failed to publish manifesto',
    })
  }
}
