import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch discussions
  if (req.method === 'GET') {
    try {
      const { type, category, status, search, project_id, limit, offset } = req.query
      
      // Convert to numbers with defaults
      const limitNum = Math.min(Number(limit) || 20, 100) // Max 100
      const offsetNum = Number(offset) || 0

      let query = supabase
        .from('hub_discussions')
        .select('*')

      if (type) {
        query = query.eq('type', type)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (project_id) {
        query = query.eq('project_id', project_id)
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

  // POST: Create discussion
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
        type,
        category,
        project_id,
        tags,
        ai_related,
      } = req.body

      const { data, error } = await authenticatedSupabase
        .from('hub_discussions')
        .insert({
          title,
          description,
          type,
          category,
          creator_id: user.id,
          project_id: project_id || null,
          tags: tags || [],
          ai_related: ai_related !== false,
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
