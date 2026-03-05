import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth user
    const authSupabase = getSupabase()
    if (!authSupabase) {
      return res.status(500).json({ error: 'Auth service unavailable' })
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: { user }, error: userError } = await authSupabase.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if user is admin by querying user_profiles table
    const { data: profile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get all advertisers with their account details
    const { data: advertisers, error: listError } = await authSupabase
      .from('advertiser_accounts')
      .select(`
        id,
        user_id,
        company_name,
        website,
        contact_email,
        payment_status,
        subscription_type,
        subscription_end_date,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (listError) {
      console.error('Error fetching advertisers:', listError)
      return res.status(500).json({ error: 'Failed to fetch advertisers' })
    }

    // Get ad counts for each advertiser
    const { data: adCounts, error: adCountError } = await authSupabase
      .from('advertisements')
      .select('advertiser_id, id')

    if (adCountError) {
      console.error('Error fetching ad counts:', adCountError)
    }

    // Build advertiser list with ad counts
    const advertisersList = (advertisers || []).map(advertiser => {
      const adCount = (adCounts || []).filter(ad => ad.advertiser_id === advertiser.id).length
      return {
        ...advertiser,
        ad_count: adCount
      }
    })

    return res.status(200).json(advertisersList)
  } catch (error) {
    console.error('Error in admin advertisers endpoint:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
