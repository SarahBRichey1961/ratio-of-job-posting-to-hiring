import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch discussions
  if (req.method === 'GET') {
    try {
      const { type, category, status, search, project_id, limit = 20, offset = 0 } = req.query

      let query = supabase
        .from('hub_discussions')
        .select(`
          *,
          creator:creator_id(username, avatar_url),
          comments:hub_discussion_comments(count)
        `)

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
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (error) throw error

      res.status(200).json({ data, count, limit, offset })
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // POST: Create discussion
  else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        type,
        category,
        creator_id,
        project_id,
        tags,
        ai_related,
      } = req.body

      const { data, error } = await supabase
        .from('hub_discussions')
        .insert({
          title,
          description,
          type,
          category,
          creator_id,
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
