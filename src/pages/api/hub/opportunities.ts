import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch opportunities
  if (req.method === 'GET') {
    try {
      const {
        opportunity_type,
        status = 'open',
        is_ai_focused = true,
        search,
        skills,
        limit = 20,
        offset = 0,
      } = req.query

      let query = supabase
        .from('hub_opportunities')
        .select(`
          *,
          posted_by:posted_by(username, avatar_url),
          applications:hub_opportunity_applications(count)
        `)

      // Only show non-expired opportunities
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      if (status) {
        query = query.eq('status', status)
      }

      if (opportunity_type) {
        query = query.eq('opportunity_type', opportunity_type)
      }

      if (is_ai_focused === 'true') {
        query = query.eq('is_ai_focused', true)
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

  // POST: Create opportunity
  else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        company_name,
        opportunity_type,
        skills_required,
        posted_by,
        expires_at,
        is_ai_focused,
      } = req.body

      const { data, error } = await supabase
        .from('hub_opportunities')
        .insert({
          title,
          description,
          company_name,
          opportunity_type,
          skills_required: skills_required || [],
          posted_by,
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
