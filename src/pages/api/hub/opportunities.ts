import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch opportunities
  if (req.method === 'GET') {
    try {
      const {
        opportunity_type,
        status,
        is_ai_focused,
        search,
        skills,
        limit,
        offset,
      } = req.query
      
      // Convert to numbers with defaults
      const limitNum = Math.min(Number(limit) || 20, 100) // Max 100
      const offsetNum = Number(offset) || 0
      const statusStr = (status as string) || 'open'
      const isAiFocused = (is_ai_focused as string) === 'false' ? false : true

      let query = supabase
        .from('hub_opportunities')
        .select('*')

      // Only show non-expired opportunities
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      if (statusStr) {
        query = query.eq('status', statusStr)
      }

      if (opportunity_type) {
        query = query.eq('opportunity_type', opportunity_type)
      }

      if (isAiFocused) {
        query = query.eq('is_ai_focused', true)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1)

      if (error) throw error

      res.status(200).json({ data, count, limit: limitNum, offset: offsetNum })
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // POST: Create opportunity
  else if (req.method === 'POST') {
    try {
      // Get auth token from request headers
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)

      // Create authenticated Supabase client with the user's token
      const { createClient } = require('@supabase/supabase-js')
      const authenticatedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      )

      // Get authenticated user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser()
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        title,
        description,
        company_name,
        opportunity_type,
        skills_required,
        expires_at,
        is_ai_focused,
      } = req.body

      const { data, error } = await authenticatedSupabase
        .from('hub_opportunities')
        .insert({
          title,
          description,
          company_name,
          opportunity_type,
          skills_required: skills_required || [],
          posted_by: user.id,
          expires_at: expires_at || null,
          is_ai_focused: is_ai_focused !== false,
          status: 'open',
        })
        .select()

      if (error) throw error

      res.status(201).json(data[0])
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
