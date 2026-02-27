import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' })
  }

  // GET: Fetch single project
  if (req.method === 'GET') {
    try {
      console.log('=== GET /api/hub/projects/[id] ===')
      console.log('Fetching project with id:', id)

      const { data, error } = await supabase
        .from('hub_projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Query error:', error)
        throw error
      }
      
      if (!data) {
        console.warn('No data returned for id:', id)
        return res.status(404).json({ error: 'Project not found' })
      }

      console.log('Retrieved project:')
      console.log('  ID:', data.id)
      console.log('  Title:', data.title)
      console.log('  learning_goals:', data.learning_goals, '| Type:', typeof data.learning_goals, '| isArray:', Array.isArray(data.learning_goals))
      console.log('  technologies_used:', data.technologies_used, '| Type:', typeof data.technologies_used, '| isArray:', Array.isArray(data.technologies_used))

      res.status(200).json(data)
    } catch (error) {
      console.error('Error:', error)
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // PUT/PATCH: Update project
  else if (req.method === 'PUT' || req.method === 'PATCH') {
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

      // Verify user is the project creator
      const { data: project, error: fetchError } = await authenticatedSupabase
        .from('hub_projects')
        .select('creator_id')
        .eq('id', id)
        .single()

      if (fetchError || !project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      if (project.creator_id !== user.id) {
        return res.status(403).json({ error: 'You do not have permission to update this project' })
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
        repository_url,
      } = req.body

      // Ensure arrays are properly formatted
      let parsedLearningGoals = []
      let parsedTechnologies = []

      if (learning_goals) {
        if (typeof learning_goals === 'string') {
          try {
            parsedLearningGoals = JSON.parse(learning_goals)
          } catch {
            parsedLearningGoals = learning_goals.split(',').map((g: string) => g.trim()).filter(Boolean)
          }
        } else if (Array.isArray(learning_goals)) {
          parsedLearningGoals = learning_goals
        }
      }

      if (technologies_used) {
        if (typeof technologies_used === 'string') {
          try {
            parsedTechnologies = JSON.parse(technologies_used)
          } catch {
            parsedTechnologies = technologies_used.split(',').map((t: string) => t.trim()).filter(Boolean)
          }
        } else if (Array.isArray(technologies_used)) {
          parsedTechnologies = technologies_used
        }
      }

      const { data, error } = await authenticatedSupabase
        .from('hub_projects')
        .update({
          title,
          description,
          problem_statement,
          category,
          difficulty_level,
          learning_goals: parsedLearningGoals,
          technologies_used: parsedTechnologies,
          start_date,
          target_completion_date,
          repository_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
