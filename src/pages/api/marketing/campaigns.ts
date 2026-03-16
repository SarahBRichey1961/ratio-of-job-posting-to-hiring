import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Helper function to set CORS headers
function setCORSHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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

  const supabase = getSupabase()

  // GET: Fetch campaigns for authenticated user
  if (req.method === 'GET') {
    try {
      console.log('=== GET /api/marketing/campaigns ===')
      
      // Get auth token from request headers
      const authHeader = req.headers.authorization
      console.log('Authorization header present:', !!authHeader)
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('❌ Missing or invalid authorization header')
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)
      console.log('Token extracted, length:', token.length)
      
      // Extract user ID from JWT token
      const userId = getUserIdFromToken(token)
      if (!userId) {
        console.error('❌ Failed to extract user ID from token')
        return res.status(401).json({ error: 'Invalid token' })
      }
      console.log('✓ User authenticated:', userId)

      const authenticatedSupabase = await getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        console.error('❌ Failed to initialize Supabase client')
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }
      console.log('✓ Supabase client initialized')

      const { status, limit = '20', offset = '0' } = req.query
      const limitNum = Math.min(Number(limit), 100)
      const offsetNum = Number(offset)
      console.log('Query params:', { status, limit: limitNum, offset: offsetNum })

      let query = authenticatedSupabase
        .from('marketing_campaigns')
        .select('*')
        .eq('creator_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: campaigns, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1)

      console.log('Query result:', { 
        error: error?.message, 
        campaignCount: campaigns?.length, 
        totalCount: count 
      })

      if (error) {
        console.error('❌ Query error:', error.message, error.details, error.hint)
        return res.status(400).json({ 
          error: error.message, 
          details: error.details,
          hint: error.hint 
        })
      }

      console.log('✓ Campaigns fetched successfully')
      res.status(200).json({ data: campaigns, count, limit: limitNum, offset: offsetNum })
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // POST: Create new campaign
  else if (req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)
      const authenticatedSupabase = await getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser()
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        project_id,
        name,
        description,
        email_subject,
        email_body_html,
        target_audience_segment,
        list_source,
        utm_campaign,
      } = req.body

      if (!name || !email_subject || !email_body_html) {
        return res.status(400).json({ error: 'Name, email subject, and email body are required' })
      }

      const insertData = {
        project_id: project_id || null,
        creator_id: user.id,
        name,
        description: description || '',
        email_subject,
        email_body_html,
        target_audience_segment: target_audience_segment || 'custom',
        list_source: list_source || 'imported',
        utm_campaign: utm_campaign || name,
        status: 'draft',
      }

      const { data, error } = await authenticatedSupabase
        .from('marketing_campaigns')
        .insert(insertData)
        .select()

      if (error) {
        console.error('Database error:', error)
        return res.status(400).json({ error: error.message })
      }

      const campaign = data?.[0]

      // Create analytics record for new campaign using SERVICE_ROLE
      if (campaign?.id) {
        try {
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (!serviceRoleKey) {
            console.warn('⚠️ CREATE - SUPABASE_SERVICE_ROLE_KEY not configured, analytics record not created')
          } else {
            console.log('📊 CREATE - Creating analytics record with SERVICE_ROLE_KEY:', {
              campaignId: campaign.id,
              serviceRoleKeyLength: serviceRoleKey.length,
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

            console.log('📊 CREATE - INSERT analytics with columns: campaign_id, total_recipients, total_sent, total_bounced, total_opened, total_clicked, total_conversions, conversion_rate, click_through_rate, open_rate')
            
            const { data: insertData, error: analyticsError } = await serviceRoleClient
              .from('campaign_analytics')
              .insert({
                campaign_id: campaign.id,
                total_recipients: 0,
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

            if (analyticsError) {
              console.error('❌ CREATE - Failed to create analytics record:', {
                campaignId: campaign.id,
                errorMessage: analyticsError.message,
                errorCode: analyticsError.code,
                errorDetails: analyticsError.details,
                errorHint: analyticsError.hint,
              })
              // Don't fail the campaign creation if analytics record creation fails
            } else {
              console.log('✅ CREATE - Analytics record created for campaign:', {
                campaignId: campaign.id,
                recordId: insertData?.[0]?.id,
              })
            }
          }
        } catch (err) {
          console.error('❌ CREATE - Exception creating analytics record:', {
            campaignId: campaign.id,
            errorMessage: (err as any).message,
            errorStack: (err as any).stack,
          })
          // Don't fail campaign creation
        }
      }

      res.status(201).json(campaign)
    } catch (error) {
      console.error('Error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
