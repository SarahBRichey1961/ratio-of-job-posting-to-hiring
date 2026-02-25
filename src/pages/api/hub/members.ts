import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch all hub members or search
  if (req.method === 'GET') {
    try {
      const { search, skills, limit = 20, offset = 0 } = req.query

      let query = supabase.from('hub_members').select('*')

      if (search) {
        query = query.ilike('username', `%${search}%`)
      }

      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills]
        query = query.contains('skills', skillsArray)
      }

      const { data, error, count } = await query
        .range(Number(offset), Number(offset) + Number(limit) - 1)
        .limit(Number(limit))

      if (error) throw error

      res.status(200).json({ data, count, limit, offset })
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // POST: Create/update hub member profile
  else if (req.method === 'POST') {
    try {
      const { id, username, bio, avatar_url, skills, expertise_areas } = req.body

      // Verify user is authenticated
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { data, error } = await supabase
        .from('hub_members')
        .upsert({
          id,
          username,
          bio,
          avatar_url,
          skills: skills || [],
          expertise_areas: expertise_areas || [],
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      res.status(200).json(data[0])
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
