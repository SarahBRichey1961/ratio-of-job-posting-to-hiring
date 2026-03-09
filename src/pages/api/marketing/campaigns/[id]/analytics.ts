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

    // Count recipients - fetch all to manually count (more reliable than count parameter)
    const { data: recipientsList, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('id', { head: false })
      .eq('campaign_id', id)

    let recipientCount = recipientsList?.length || 0
    
    // Debug: Log full query result
    console.log('Analytics - Recipients query result:', { 
      campaignId: id, 
      userId: user.id,
      recipientsCount: recipientCount,
      dataLength: recipientsList?.length,
      hasError: !!recipientsError,
      rlsError: recipientsError ? { code: recipientsError.code, message: recipientsError.message, hint: recipientsError.hint } : null,
      recipientSample: recipientsList?.slice(0, 3),
    })

    // If query returned 0 because RLS might be blocking, try alternate count
    if (recipientCount === 0 && !recipientsError) {
      // Try using count() function as fallback
      const { count: countResult, error: countError } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
      
      console.log('Analytics - Fallback count result:', {
        campaignId: id,
        countResult,
        countError: countError ? { code: countError.code, message: countError.message } : null,
      })
      
      if (countResult !== null && !countError) {
        recipientCount = countResult
      }
    }

    // Get analytics data (may not exist yet)
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)
      .single()

    console.log('Analytics - Analytics record:', { campaignId: id, analytics, error: analyticsError?.code })

    // Calculate rates
    const sent = analytics?.sent || 0
    const opened = analytics?.opened || 0
    const clicked = analytics?.clicked || 0
    const converted = analytics?.converted || 0
    const bounced = analytics?.bounced || 0

    const openRate = sent > 0 ? (opened / sent) * 100 : 0
    const clickThroughRate = opened > 0 ? (clicked / opened) * 100 : 0
    const conversionRate = sent > 0 ? (converted / sent) * 100 : 0

    const responseData = {
      total_recipients: recipientCount,
      sent,
      bounced,
      opened,
      clicked,
      converted,
      open_rate: openRate,
      click_through_rate: clickThroughRate,
      conversion_rate: conversionRate,
    }

    console.log('Analytics - Returning data:', { 
      campaignId: id,
      userId: user.id,
      totalRecipients: recipientCount,
      analyticsRecord: analytics ? 'exists' : 'not-found'
    }, responseData)

    res.status(200).json(responseData)
  } catch (error) {
    console.error('Error fetching analytics:', { error: (error as any).message, details: error })
    res.status(500).json({ error: 'Internal server error', details: (error as any).message })
  }
}
