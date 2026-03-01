import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database not configured' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Discussion ID is required' })
  }

  // GET: Fetch single discussion
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hub_discussions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Discussion not found' })

      res.status(200).json(data)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // PUT: Update a discussion
  else if (req.method === 'PUT') {
    try {
      // Get auth token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)

      // Verify the token and get user ID
      let userId: string | null = null
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (user && !authError) {
          userId = user.id
        }
      } catch (err) {
        console.error('Error verifying token with getUser:', err)
      }

      // If that failed, try to decode the JWT for the user ID
      if (!userId) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            userId = decoded.sub
          }
        } catch (err) {
          console.error('Error decoding token:', err)
        }
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get discussion to verify creator
      const { data: discussion, error: getError } = await supabase
        .from('hub_discussions')
        .select('creator_id')
        .eq('id', id)
        .single()

      if (getError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' })
      }

      // Verify user is the creator
      if (discussion.creator_id !== userId) {
        return res.status(403).json({ error: 'Only the discussion creator can edit' })
      }

      // Validate required fields
      const { title, description } = req.body

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' })
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ error: 'Description is required' })
      }

      // Build update object - only include fields that are present in request
      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        updated_at: new Date().toISOString()
      }

      // Optional fields
      if ('type' in req.body && req.body.type) {
        const validTypes = ['question', 'issue', 'idea', 'solution', 'resource']
        if (!validTypes.includes(req.body.type)) {
          return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` })
        }
        updateData.type = req.body.type
      }

      if ('category' in req.body && req.body.category) {
        updateData.category = req.body.category
      }

      if ('status' in req.body && req.body.status) {
        const validStatus = ['open', 'in_progress', 'resolved', 'closed']
        if (!validStatus.includes(req.body.status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatus.join(', ')}` })
        }
        updateData.status = req.body.status
      }

      if ('tags' in req.body) {
        if (!Array.isArray(req.body.tags)) {
          return res.status(400).json({ error: 'Tags must be an array' })
        }
        updateData.tags = req.body.tags
      }

      if ('ai_related' in req.body) {
        updateData.ai_related = Boolean(req.body.ai_related)
      }

      // Perform update
      const { data, error } = await supabase
        .from('hub_discussions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json(data)
    } catch (error) {
      console.error('Error updating discussion:', error)
      return res.status(500).json({ error: 'Failed to update discussion' })
    }
  }

  // DELETE: Delete a discussion
  else if (req.method === 'DELETE') {
    try {
      // Get auth token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)

      // Verify the token and get user ID
      let userId: string | null = null
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (user && !authError) {
          userId = user.id
        }
      } catch (err) {
        console.error('Error verifying token with getUser:', err)
      }

      // If that failed, try to decode the JWT for the user ID
      if (!userId) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            userId = decoded.sub
          }
        } catch (err) {
          console.error('Error decoding token:', err)
        }
      }

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get discussion to verify creator
      const { data: discussion, error: getError } = await supabase
        .from('hub_discussions')
        .select('creator_id')
        .eq('id', id)
        .single()

      if (getError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' })
      }

      // Verify user is the creator
      if (discussion.creator_id !== userId) {
        return res.status(403).json({ error: 'Only the discussion creator can delete' })
      }

      // Delete all comments first (cascade would handle this, but doing it explicitly for clarity)
      const { error: commentsError } = await supabase
        .from('hub_discussion_comments')
        .delete()
        .eq('discussion_id', id)

      if (commentsError) {
        console.error('Error deleting comments:', commentsError)
        return res.status(500).json({ error: 'Failed to delete discussion' })
      }

      // Delete the discussion
      const { error: deleteError } = await supabase
        .from('hub_discussions')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting discussion:', deleteError)
        return res.status(500).json({ error: 'Failed to delete discussion' })
      }

      return res.status(200).json({ success: true, message: 'Discussion deleted successfully' })
    } catch (error) {
      console.error('Error deleting discussion:', error)
      return res.status(500).json({ error: 'Failed to delete discussion' })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
