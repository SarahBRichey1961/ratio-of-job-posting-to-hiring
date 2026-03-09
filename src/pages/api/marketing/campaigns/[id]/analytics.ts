import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const authenticatedSupabase = await getAuthenticatedSupabase(token)
    if (!authenticatedSupabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    const { data: { user } } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Use authenticated client for all queries so RLS policies work
    const supabase = authenticatedSupabase

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== user.id) {
      console.error('Campaign access denied:', { campaignError, campaign, userId: user.id })
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get analytics with total_recipients
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)
      .single()

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.error('Analytics query error:', analyticsError)
      return res.status(400).json({ error: 'Failed to fetch analytics' })
    }

    // Use total_recipients from analytics table
    const totalRecipients = analytics?.total_recipients || 0

    console.log('Analytics - Returning data:', { 
      campaignId: id,
      userId: user.id,
      totalRecipients,
      analytics: !!analytics
    })

    // Return analytics data
    const responseData = {
      total_recipients: totalRecipients,
      total_sent: analytics?.total_sent || 0,
      total_bounced: analytics?.total_bounced || 0,
      total_opened: analytics?.total_opened || 0,
      total_clicked: analytics?.total_clicked || 0,
      total_conversions: analytics?.total_conversions || 0,
      open_rate: analytics?.open_rate || 0,
      click_through_rate: analytics?.click_through_rate || 0,
      conversion_rate: analytics?.conversion_rate || 0,
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('Error fetching analytics:', { error: (error as any).message, details: error })
    res.status(500).json({ error: 'Internal server error', details: (error as any).message })
  }
}
