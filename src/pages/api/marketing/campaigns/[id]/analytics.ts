import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthenticatedSupabase } from '@/lib/supabase'

// Helper function to set CORS headers
function setCORSHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all responses
  setCORSHeaders(res)

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

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
      console.error('Analytics - Failed to create authenticated client')
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    console.log('Analytics - Client initialized for campaign:', id)

    // Use authenticated client for all queries so RLS policies work
    const supabase = authenticatedSupabase

    // Get analytics with total_recipients
    // RLS will ensure we only get analytics for campaigns we own
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)
      .single()

    console.log('Analytics - Query result:', {
      campaignId: id,
      analyticsExists: !!analytics,
      totalRecipients: analytics?.total_recipients,
      error: analyticsError ? { code: analyticsError.code, message: analyticsError.message } : null,
    })

    let analyticsData = analytics
    let totalRecipients = analytics?.total_recipients || 0

    // If no analytics record found, calculate from recipients table
    if (analyticsError?.code === 'PGRST116' || !analytics) {
      console.log('Analytics - Record not found, calculating from recipients table...')
      
      // First, verify the campaign belongs to this user
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('id, creator_id')
        .eq('id', id)
        .single()
      
      if (campaignError || !campaign) {
        console.error('Analytics - Campaign not found or access denied:', campaignError?.message)
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // Get actual recipient count for this campaign
      console.log('Analytics - Fetching actual recipient count from database...')
      const { count: actualRecipientCount, error: countError } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id as string)
      
      totalRecipients = actualRecipientCount || 0
      console.log('✅ Analytics - Calculated recipients from recipients table:', totalRecipients)
    } else {
      // Use the value from analytics table if it exists
      totalRecipients = analyticsData?.total_recipients || 0
    }

    console.log('Analytics - Returning data:', { 
      campaignId: id,
      totalRecipients,
    })

    // Return analytics data
    const responseData = {
      total_recipients: totalRecipients,
      total_sent: analyticsData?.total_sent || 0,
      total_bounced: analyticsData?.total_bounced || 0,
      total_opened: analyticsData?.total_opened || 0,
      total_clicked: analyticsData?.total_clicked || 0,
      total_conversions: analyticsData?.total_conversions || 0,
      open_rate: analyticsData?.open_rate || 0,
      click_through_rate: analyticsData?.click_through_rate || 0,
      conversion_rate: analyticsData?.conversion_rate || 0,
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('Error fetching analytics:', { error: (error as any).message, details: error })
    res.status(500).json({ error: 'Internal server error', details: (error as any).message })
  }
}
