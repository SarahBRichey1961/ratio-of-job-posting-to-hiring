import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch campaigns for authenticated user
  if (req.method === 'GET') {
    try {
      // Get auth token from request headers
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)
      const authenticatedSupabase = getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser()
      if (userError || !user) {
        console.error('Auth error:', userError)
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { status, limit = '20', offset = '0' } = req.query
      const limitNum = Math.min(Number(limit), 100)
      const offsetNum = Number(offset)

      let query = authenticatedSupabase
        .from('marketing_campaigns')
        .select('*')
        .eq('creator_id', user.id)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1)

      if (error) {
        console.error('Query error:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json({ data, count, limit: limitNum, offset: offsetNum })
    } catch (error) {
      console.error('Error:', error)
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
      const authenticatedSupabase = getAuthenticatedSupabase(token)
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
