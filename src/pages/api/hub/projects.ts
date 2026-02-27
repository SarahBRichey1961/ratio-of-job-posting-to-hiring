import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()

  // GET: Fetch projects
  if (req.method === 'GET') {
    try {
      console.log('=== GET /api/hub/projects ===')
      const { status, category, difficulty, search, limit, offset } = req.query
      
      // Convert to numbers with defaults
      const limitNum = Math.min(Number(limit) || 20, 100) // Max 100
      const offsetNum = Number(offset) || 0
      
      console.log('Filters:', { status, category, difficulty, search, limitNum, offsetNum })

      let query = supabase
        .from('hub_projects')
        .select('*')

      if (status) {
        console.log('Filtering by status:', status)
        query = query.eq('status', status)
      }

      if (category) {
        console.log('Filtering by category:', category)
        query = query.eq('category', category)
      }

      if (difficulty) {
        console.log('Filtering by difficulty:', difficulty)
        query = query.eq('difficulty_level', difficulty)
      }

      if (search) {
        console.log('Filtering by search:', search)
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1)

      if (error) {
        console.error('Query error:', error)
        console.error('Error message:', error.message)
        console.error('Error code:', (error as any).code)
        throw error
      }

      console.log('Query successful!')
      console.log('Data count:', data?.length || 0)
      console.log('Total count:', count)
      console.log('Sample data:', data?.[0])

      res.status(200).json({ data, count, limit: limitNum, offset: offsetNum })
    } catch (error) {
      console.error('API Error caught:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Error message:', errorMsg)
      res.status(400).json({ error: errorMsg })
    }
  }

  // POST: Create new project
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
        problem_statement,
        category,
        difficulty_level,
        learning_goals,
        technologies_used,
        start_date,
        target_completion_date,
      } = req.body

      console.log('=== POST /api/hub/projects ===')
      console.log('FULL Raw body:', JSON.stringify(req.body, null, 2))
      console.log('---')
      console.log('Raw learning_goals value:', learning_goals)
      console.log('Raw learning_goals type:', typeof learning_goals)
      console.log('Is learning_goals array?', Array.isArray(learning_goals))
      console.log('learning_goals length:', Array.isArray(learning_goals) ? learning_goals.length : 'N/A')
      console.log('---')
      console.log('Raw technologies_used value:', technologies_used)
      console.log('Raw technologies_used type:', typeof technologies_used)
      console.log('Is technologies_used array?', Array.isArray(technologies_used))
      console.log('technologies_used length:', Array.isArray(technologies_used) ? technologies_used.length : 'N/A')
      console.log('---')

      // Ensure arrays are properly formatted - VERY EXPLICIT
      let finalLearningGoals: string[] = Array.isArray(learning_goals) ? learning_goals : []
      let finalTechnologies: string[] = Array.isArray(technologies_used) ? technologies_used : []

      console.log('Final learning_goals to save:', finalLearningGoals)
      console.log('Final technologies_used to save:', finalTechnologies)

      const insertData = {
        title,
        description,
        problem_statement,
        category,
        difficulty_level,
        creator_id: user.id,
        learning_goals: finalLearningGoals,
        technologies_used: finalTechnologies,
        start_date,
        target_completion_date,
        status: 'active',
      }

      console.log('Inserting data:', JSON.stringify(insertData, null, 2))

      const { data, error } = await authenticatedSupabase
        .from('hub_projects')
        .insert(insertData)
        .select()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Inserted data:', JSON.stringify(data, null, 2))

      // Add creator as project owner
      if (data && data[0]) {
        await authenticatedSupabase.from('hub_project_members').insert({
          project_id: data[0].id,
          member_id: user.id,
          role: 'owner',
        })
      }

      console.log('Returning:', JSON.stringify(data[0], null, 2))
      res.status(201).json(data[0])
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
