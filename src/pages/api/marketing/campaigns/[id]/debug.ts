import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'

// Helper function to set CORS headers
function setCORSHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

/**
 * DEBUG ENDPOINT: Check the actual state of campaign data in database
 * GET /api/marketing/campaigns/[id]/debug
 */
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
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const authenticatedSupabase = await getAuthenticatedSupabase(token)
    if (!authenticatedSupabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await authenticatedSupabase
      .from('marketing_campaigns')
      .select('id, creator_id, name, status')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Use SERVICE_ROLE to see all data without RLS restrictions
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'SERVICE_ROLE_KEY not configured' })
    }

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

    // Get all recipients for this campaign
    const { data: allRecipients, error: recipientsError } = await serviceRoleClient
      .from('campaign_recipients')
      .select('id, email, status, campaign_id, created_at')
      .eq('campaign_id', id)

    // Get analytics
    const { data: analytics, error: analyticsError } = await serviceRoleClient
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', id)

    // Count duplicates in campaign_analytics
    const { data: allAnalytics, error: allAnalyticsError } = await serviceRoleClient
      .from('campaign_analytics')
      .select('id, campaign_id, total_recipients')

    const analyticsForThisCampaign = allAnalytics?.filter(a => a.campaign_id === id) || []

    res.status(200).json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        creator_id: campaign.creator_id,
      },
      recipients: {
        total: allRecipients?.length || 0,
        byStatus: allRecipients ? allRecipients.reduce((acc: any, r: any) => {
          acc[r.status] = (acc[r.status] || 0) + 1
          return acc
        }, {}) : {},
        sampleEmails: allRecipients ? allRecipients.slice(0, 3).map(r => r.email) : [],
        errors: recipientsError ? { code: recipientsError.code, message: recipientsError.message } : null,
      },
      analytics: {
        records: analyticsForThisCampaign,
        duplicateCount: analyticsForThisCampaign.length > 1 ? analyticsForThisCampaign.length - 1 : 0,
        totalRecipientCount: analytics?.[0]?.total_recipients || 0,
        errors: analyticsError ? { code: analyticsError.code, message: analyticsError.message } : null,
      },
      schema: {
        hasUniqueConstraint: 'Run: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = "campaign_analytics" AND constraint_name LIKE "%unique%"',
      },
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    res.status(500).json({ error: (error as any).message })
  }
}
