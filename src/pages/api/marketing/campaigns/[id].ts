import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Campaign ID is required' })
  }

  // GET: Fetch single campaign
  if (req.method === 'GET') {
    try {
      console.log('GET /api/marketing/campaigns/[id] - Start:', { id })
      
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('GET - No authorization header')
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)
      console.log('GET - Token received, length:', token.length)
      
      const authenticatedSupabase = await getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        console.error('GET - Failed to create authenticated Supabase client')
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }

      console.log('GET - Extracting user ID from JWT token...')
      const userId = getUserIdFromToken(token)
      if (!userId) {
        console.error('GET - Failed to extract user ID from token')
        return res.status(401).json({ error: 'Invalid token' })
      }
      console.log('GET - User authenticated:', userId)

      const { data, error } = await authenticatedSupabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id)
        .eq('creator_id', userId)
        .single()

      if (error) {
        console.error('GET - Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
        })
        return res.status(404).json({ error: 'Campaign not found' })
      }

      console.log('GET - Campaign found successfully')
      res.status(200).json(data)
    } catch (error) {
      console.error('GET - Unexpected error:', {
        error: (error as any).message,
        stack: (error as any).stack,
      })
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // PUT: Update campaign
  else if (req.method === 'PUT') {
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

      const userId = getUserIdFromToken(token)
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Verify ownership
      const { data: campaign, error: fetchError } = await authenticatedSupabase
        .from('marketing_campaigns')
        .select('creator_id')
        .eq('id', id)
        .single()

      if (fetchError || !campaign || campaign.creator_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to update this campaign' })
      }

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await authenticatedSupabase
        .from('marketing_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Database error:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json(data?.[0])
    } catch (error) {
      console.error('Error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // DELETE: Delete campaign
  else if (req.method === 'DELETE') {
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

      const userId = getUserIdFromToken(token)
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Verify ownership
      const { data: campaign, error: fetchError } = await authenticatedSupabase
        .from('marketing_campaigns')
        .select('creator_id')
        .eq('id', id)
        .single()

      if (fetchError || !campaign || campaign.creator_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to delete this campaign' })
      }

      const { error } = await authenticatedSupabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return res.status(400).json({ error: error.message })
      }

      res.status(200).json({ success: true, id })
    } catch (error) {
      console.error('Error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
