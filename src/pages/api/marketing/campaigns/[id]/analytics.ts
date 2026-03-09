import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthenticatedSupabase } from '@/lib/supabase'

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

    // If no analytics record, that's an error (should have been created when campaign was created)
    if (analyticsError || !analytics) {
      if (analyticsError?.code === 'PGRST116') {
        // No rows returned - analytics record wasn't found
        // This could mean RLS is blocking or record doesn't exist
        console.warn('Analytics - No analytics record found for campaign:', {
          campaignId: id,
          hint: 'Record may not exist or RLS is blocking access'
        })
        // Return 0 recipients to avoid breaking frontend
        return res.status(200).json({
          total_recipients: 0,
          total_sent: 0,
          total_bounced: 0,
          total_opened: 0,
          total_clicked: 0,
          total_conversions: 0,
          open_rate: 0,
          click_through_rate: 0,
          conversion_rate: 0,
        })
      }
      console.error('Analytics - Error fetching analytics:', analyticsError)
      return res.status(400).json({ error: 'Failed to fetch analytics', details: analyticsError?.message })
    }

    // Use total_recipients from analytics table
    const totalRecipients = analytics?.total_recipients || 0

    console.log('Analytics - Returning data:', { 
      campaignId: id,
      totalRecipients,
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
