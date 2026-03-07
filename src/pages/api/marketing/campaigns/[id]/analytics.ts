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
    const authenticatedSupabase = getAuthenticatedSupabase(token)
    const { data: { user } } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Verify campaign ownership
    const supabase = getSupabase()
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)
      .single()

    if (analyticsError) {
      // If no analytics yet, return zeros
      if (analyticsError.code === 'PGRST116') {
        return res.status(200).json({
          total_recipients: 0,
          sent: 0,
          bounced: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          open_rate: 0,
          click_through_rate: 0,
          conversion_rate: 0,
        })
      }
      throw analyticsError
    }

    // Count recipients
    const { count: recipientCount } = await supabase
      .from('campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)

    // Calculate rates
    const openRate = analytics.sent > 0 ? (analytics.opened / analytics.sent) * 100 : 0
    const clickThroughRate = analytics.opened > 0 ? (analytics.clicked / analytics.opened) * 100 : 0
    const conversionRate = analytics.sent > 0 ? (analytics.converted / analytics.sent) * 100 : 0

    res.status(200).json({
      total_recipients: recipientCount || 0,
      sent: analytics.sent || 0,
      bounced: analytics.bounced || 0,
      opened: analytics.opened || 0,
      clicked: analytics.clicked || 0,
      converted: analytics.converted || 0,
      open_rate: openRate,
      click_through_rate: clickThroughRate,
      conversion_rate: conversionRate,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
