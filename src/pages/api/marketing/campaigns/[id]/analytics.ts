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

    // Use authenticated client for all queries so RLS policies work
    const supabase = authenticatedSupabase

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Count recipients FIRST - this is the source of truth
    const { count: recipientCount } = await supabase
      .from('campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)

    // Get analytics data (may not exist yet)
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)
      .single()

    // Calculate rates
    const sent = analytics?.sent || 0
    const opened = analytics?.opened || 0
    const clicked = analytics?.clicked || 0
    const converted = analytics?.converted || 0
    const bounced = analytics?.bounced || 0

    const openRate = sent > 0 ? (opened / sent) * 100 : 0
    const clickThroughRate = opened > 0 ? (clicked / opened) * 100 : 0
    const conversionRate = sent > 0 ? (converted / sent) * 100 : 0

    res.status(200).json({
      total_recipients: recipientCount || 0,
      sent,
      bounced,
      opened,
      clicked,
      converted,
      open_rate: openRate,
      click_through_rate: clickThroughRate,
      conversion_rate: conversionRate,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
