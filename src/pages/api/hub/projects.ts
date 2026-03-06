import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure request body is parsed as JSON
  if (req.method !== 'GET' && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body)
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON in request body' })
    }
  }

  const supabase = getSupabase()

  // GET: Fetch projects
  if (req.method === 'GET') {
    try {
      console.log('=== GET /api/hub/projects ===')
      const { status, category, difficulty, search, limit, offset, creatorId, myProjects } = req.query
      
      // Convert to numbers with defaults
      const limitNum = Math.min(Number(limit) || 20, 100) // Max 100
      const offsetNum = Number(offset) || 0
      
      console.log('Filters:', { status, category, difficulty, search, limitNum, offsetNum, creatorId, myProjects })

      let query = supabase
        .from('hub_projects')
        .select('*')

      // Filter by creator if myProjects is true
      if (myProjects === 'true') {
        // Get auth token from headers to identify current user
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const authenticatedSupabase = getAuthenticatedSupabase(token)
          if (authenticatedSupabase) {
            const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser()
            if (user) {
              console.log('Filtering by creator:', user.id)
              query = query.eq('creator_id', user.id)
            }
          }
        }
      } else if (creatorId) {
        console.log('Filtering by creatorId:', creatorId)
        query = query.eq('creator_id', creatorId)
      }

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
      // CRITICAL: Parse body if it's a string BEFORE doing anything else
      let body = req.body
      if (typeof body === 'string') {
        console.log('⚠️  Request body is a string, parsing...')
        try {
          body = JSON.parse(body)
        } catch (parseError) {
          console.error('Failed to parse body:', parseError)
          return res.status(400).json({ error: 'Invalid JSON in request body', details: parseError })
        }
      }

      console.log('✅ Parsed body:', body)
      console.log('Body type:', typeof body)
      console.log('Body keys:', Object.keys(body))

      // Get auth token from request headers
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' })
      }

      const token = authHeader.substring(7)
      
      // Create authenticated Supabase client with the user's token
      const authenticatedSupabase = getAuthenticatedSupabase(token)
      if (!authenticatedSupabase) {
        return res.status(500).json({ error: 'Failed to initialize Supabase client' })
      }

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
      } = body

      // CRITICAL: Validate required fields
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' })
      }

      console.log('=== POST /api/hub/projects ===')
      console.log('✅ Received fields: title, description, category, difficulty_level')
      console.log('Title:', title)
      console.log('Description:', description)
      console.log('Category:', category)
      console.log('---')

      // Parse arrays if they come as strings (form data issue)
      let finalLearningGoals: string[] = []
      let finalTechnologies: string[] = []

      if (learning_goals) {
        if (typeof learning_goals === 'string') {
          try {
            finalLearningGoals = JSON.parse(learning_goals)
          } catch {
            finalLearningGoals = [learning_goals]
          }
        } else if (Array.isArray(learning_goals)) {
          finalLearningGoals = learning_goals
        }
      }

      if (technologies_used) {
        if (typeof technologies_used === 'string') {
          try {
            finalTechnologies = JSON.parse(technologies_used)
          } catch {
            finalTechnologies = [technologies_used]
          }
        } else if (Array.isArray(technologies_used)) {
          finalTechnologies = technologies_used
        }
      }

      console.log('Final learning_goals:', finalLearningGoals)
      console.log('Final technologies_used:', finalTechnologies)

      // Build insert data - only include defined fields
      const insertData: any = {
        title: title || '',
        description: description || '',
        category: category || 'general',
        difficulty_level: difficulty_level || 'beginner',
        creator_id: user.id,
        status: 'active',
      }

      // Only add optional fields if they have values
      if (problem_statement) insertData.problem_statement = problem_statement
      if (start_date) insertData.start_date = start_date
      if (target_completion_date) insertData.target_completion_date = target_completion_date
      if (finalLearningGoals.length > 0) insertData.learning_goals = finalLearningGoals
      if (finalTechnologies.length > 0) insertData.technologies_used = finalTechnologies

      console.log('✅ Building insert object...')
      console.log('Insert data structure:', insertData)
      console.log('Insert data JSON:', JSON.stringify(insertData, null, 2))
      console.log('About to execute: authenticatedSupabase.from("hub_projects").insert(insertData)')

      // SAFETY CHECK: Ensure we're not sending stringified data
      if (typeof insertData !== 'object' || insertData === null) {
        console.error('❌ insertData is not an object!', typeof insertData)
        return res.status(500).json({ error: 'Internal error: insertData is not an object' })
      }

      // Verify field types before insert
      console.log('Field types:')
      console.log('  title:', typeof insertData.title, '=', insertData.title)
      console.log('  description:', typeof insertData.description, '=', insertData.description)
      console.log('  category:', typeof insertData.category, '=', insertData.category)
      console.log('  learning_goals:', Array.isArray(insertData.learning_goals), insertData.learning_goals)
      console.log('  technologies_used:', Array.isArray(insertData.technologies_used), insertData.technologies_used)

      const { data, error } = await authenticatedSupabase
        .from('hub_projects')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ Database error:', error)
        console.error('Error code:', (error as any).code)
        console.error('Error message:', error.message)
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
