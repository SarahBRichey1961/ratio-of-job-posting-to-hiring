import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthenticatedSupabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

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

    let analyticsData = analytics

    // If no analytics record found, create one (lazy creation)
    if (analyticsError?.code === 'PGRST116' || !analytics) {
      console.log('Analytics - Record not found, creating with lazy creation...')
      
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
      
      const recipientCount = actualRecipientCount || 0
      console.log('Analytics - Actual recipients in database:', recipientCount)

      // Create analytics record with SERVICE_ROLE_KEY to bypass RLS
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
          console.warn('Analytics - SUPABASE_SERVICE_ROLE_KEY not configured, cannot create record')
          // Return empty analytics instead of failing
          return res.status(200).json({
            total_recipients: recipientCount,
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

        console.log('📊 Analytics - Creating missing record with SERVICE_ROLE_KEY', {
          campaignId: id,
          recipientCount,
        })

        const serviceRoleClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        )

        const { data: createdAnalytics, error: createError } = await serviceRoleClient
          .from('campaign_analytics')
          .insert({
            campaign_id: id as string,
            total_recipients: recipientCount,
            total_sent: 0,
            total_bounced: 0,
            total_opened: 0,
            total_clicked: 0,
            total_conversions: 0,
            conversion_rate: 0,
            click_through_rate: 0,
            open_rate: 0,
          })
          .select()

        if (createError) {
          console.warn('⚠️ Analytics - Failed to create record (will return recipientCount):', {
            code: createError.code,
            message: createError.message,
          })
          // Even if create fails, return the recipient count we calculated
          return res.status(200).json({
            total_recipients: recipientCount,
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

        console.log('✅ Analytics - Record created successfully:', {
          campaignId: id,
          totalRecipients: recipientCount,
        })

        analyticsData = createdAnalytics?.[0]
      } catch (err) {
        console.error('Analytics - Exception creating record:', (err as any).message)
        // Return calculated count even if creation fails
        return res.status(200).json({
          total_recipients: recipientCount,
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
    }

    // Use total_recipients from analytics table (or created record)
    const totalRecipients = analyticsData?.total_recipients || 0

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
