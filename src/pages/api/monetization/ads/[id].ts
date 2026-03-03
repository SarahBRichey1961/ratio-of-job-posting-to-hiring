import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get auth token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  // Create authenticated client
  const authSupabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  // Get authenticated user
  const { data: { user }, error: userError } = await authSupabase.auth.getUser()
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id: adId } = req.query

  if (!adId || typeof adId !== 'string') {
    return res.status(400).json({ error: 'Ad ID is required' })
  }

  if (req.method === 'DELETE') {
    try {
      // Get advertiser account
      const { data: advertiser, error: advertiserError } = await supabase
        .from('advertiser_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (advertiserError || !advertiser) {
        return res.status(403).json({ error: 'You must be an advertiser' })
      }

      // Verify user owns this ad
      const { data: ad, error: adError } = await supabase
        .from('advertisements')
        .select('advertiser_id')
        .eq('id', adId)
        .single()

      if (adError || !ad || ad.advertiser_id !== advertiser.id) {
        return res.status(403).json({ error: 'You do not own this ad' })
      }

      // Delete the ad
      const { error: deleteError } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId)

      if (deleteError) throw deleteError

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting ad:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  } else if (req.method === 'GET') {
    try {
      // Get ad details and analytics
      const { data: ad, error: adError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('id', adId)
        .single()

      if (adError || !ad) {
        return res.status(404).json({ error: 'Ad not found' })
      }

      // Get advertiser account to verify ownership
      const { data: advertiser } = await supabase
        .from('advertiser_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!advertiser || ad.advertiser_id !== advertiser.id) {
        return res.status(403).json({ error: 'You do not own this ad' })
      }

      // Get impression count
      const { data: impressions, error: impressionError } = await supabase
        .from('ad_impressions')
        .select('id', { count: 'exact' })
        .eq('ad_id', adId)

      // Get click count
      const { data: clicks, error: clickError } = await supabase
        .from('ad_clicks')
        .select('id', { count: 'exact' })
        .eq('ad_id', adId)

      return res.status(200).json({
        ...ad,
        analytics: {
          impressions: impressions?.length || 0,
          clicks: clicks?.length || 0
        }
      })
    } catch (error) {
      console.error('Error fetching ad:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
