import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch projects
  if (req.method === 'GET') {
    try {
      const { status, category, difficulty, search, limit = 20, offset = 0 } = req.query

      let query = supabase
        .from('hub_projects')
        .select(`
          *,
          creator:creator_id(username, avatar_url),
          members:hub_project_members(count)
        `)

      if (status) {
        query = query.eq('status', status)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (difficulty) {
        query = query.eq('difficulty_level', difficulty)
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

  // POST: Create new project
  else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        problem_statement,
        category,
        difficulty_level,
        learning_goals,
        technologies_used,
        creator_id,
        start_date,
        target_completion_date,
      } = req.body

      const { data, error } = await supabase
        .from('hub_projects')
        .insert({
          title,
          description,
          problem_statement,
          category,
          difficulty_level,
          creator_id,
          learning_goals: learning_goals || [],
          technologies_used: technologies_used || [],
          start_date,
          target_completion_date,
          status: 'active',
        })
        .select()

      if (error) throw error

      // Add creator as project owner
      if (data && data[0]) {
        await supabase.from('hub_project_members').insert({
          project_id: data[0].id,
          member_id: creator_id,
          role: 'owner',
        })
      }

      res.status(201).json(data[0])
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
