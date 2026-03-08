import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      
      const authenticatedSupabase = await getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        console.error('❌ Failed to initialize Supabase client')
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }
      console.log('✓ Supabase client initialized')

      const { data, error: userError } = await authenticatedSupabase.auth.getUser()
      const user = data?.user
      
      console.log('Auth getUser result:', { 
        error: userError?.message, 
        userId: user?.id,
        email: user?.email 
      })
      
      if (userError || !user) {
        console.error('❌ Auth error:', userError?.message)
        return res.status(401).json({ error: 'Unauthorized', details: userError?.message })
      }
      console.log('✓ User authenticated:', user.id)

      const { status, limit = '20', offset = '0' } = req.query
      const limitNum = Math.min(Number(limit), 100)
      const offsetNum = Number(offset)
      console.log('Query params:', { status, limit: limitNum, offset: offsetNum })

      let query = authenticatedSupabase
        .from('marketing_campaigns')
        .select('*')
        .eq('creator_id', user.id)

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

      res.status(201).json(data?.[0])
    } catch (error) {
      console.error('Error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
