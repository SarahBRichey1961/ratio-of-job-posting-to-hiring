import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface HubDiscussionComment {
  id: string
  discussion_id: string
  author_id: string
  author?: {
    username: string
    avatar_url: string | null
  }
  content: string
  is_solution: boolean
  upvotes: number
  created_at: string
  updated_at: string
}

interface CommentsResponse {
  data: HubDiscussionComment[]
  count: number
  limit: number
  offset: number
}

// Helper to decode JWT and get user ID
function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return decoded.sub || null
  } catch (err) {
    console.error('Error decoding token:', err)
    return null
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CommentsResponse | { error: string }>
) {
  try {
    const { id } = req.query
    
    // Ensure id is a string, not an array
    const discussionId = Array.isArray(id) ? id[0] : id
    
    if (!discussionId) {
      return res.status(400).json({ error: 'Discussion ID is required' })
    }
    
    // Create Supabase client with anon key (for public access and RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing Supabase configuration')
      return res.status(500).json({ error: 'Database not configured' })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, anonKey)

    // GET - Fetch comments for a discussion
    if (req.method === 'GET') {
      try {
        console.log('GET /comments - starting', { discussionId })
        
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        const offset = parseInt(req.query.offset as string) || 0
        
        console.log('GET /comments - limits', { limit, offset })

        // Fetch comments - simplified query without count to debug
        const commentsQuery = supabase
          .from('hub_discussion_comments')
          .select('id, discussion_id, author_id, content, is_solution, upvotes, created_at, updated_at')
          .eq('discussion_id', discussionId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        const { data: comments, error: commentsError } = await commentsQuery

        console.log('GET /comments - query result', {
          hasError: !!commentsError,
          errorCode: (commentsError as any)?.code,
          errorMessage: (commentsError as any)?.message,
          commentCount: (comments || []).length
        })

        if (commentsError) {
          console.error('GET /comments - Error fetching comments:', {
            error: JSON.stringify(commentsError),
            code: (commentsError as any).code,
            message: (commentsError as any).message,
            details: (commentsError as any).details
          })
          return res.status(500).json({ error: 'Failed to fetch comments' })
        }

        if (!comments || comments.length === 0) {
          console.log('GET /comments - no comments found')
          return res.status(200).json({
            data: [],
            count: 0,
            limit,
            offset
          })
        }

        console.log('GET /comments - fetching authors', { commentCount: comments.length })

        // Get unique author IDs
        const authorIds = [...new Set((comments || []).map((c: any) => c.author_id))]
        console.log('GET /comments - unique authors', { authorIds })

        // Fetch author info from hub_members
        const { data: authors, error: authorsError } = await supabase
          .from('hub_members')
          .select('id, username, avatar_url')
          .in('id', authorIds)

        console.log('GET /comments - authors query result', {
          hasError: !!authorsError,
          authorCount: (authors || []).length,
          errorMessage: (authorsError as any)?.message
        })

        if (authorsError) {
          console.error('GET /comments - Error fetching authors:', authorsError)
          // Continue without author info rather than failing
        }

        // Create a map of authors by ID
        const authorMap = (authors || []).reduce((acc: any, author: any) => {
          acc[author.id] = author
          return acc
        }, {})

        // Merge comments with author info
        const commentsWithAuthors = (comments || []).map((comment: any) => ({
          ...comment,
          author: authorMap[comment.author_id] || { username: 'Unknown', avatar_url: null }
        }))

        console.log('GET /comments - success', { returnCount: commentsWithAuthors.length })

        return res.status(200).json({
          data: commentsWithAuthors,
          count: comments.length,
          limit,
          offset
        })
      } catch (error) {
        console.error('GET /comments - Caught exception:', error)
        return res.status(500).json({ error: 'Internal server error' })
      }
    }

  // POST - Create a new comment
  if (req.method === 'POST') {
    try {
      console.log('POST /comments - starting')
      
      // Get auth token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('POST /comments - no auth header')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)
      const userIdFromToken = getUserIdFromToken(token)

      if (!userIdFromToken) {
        console.log('POST /comments - could not extract user ID from token')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      console.log('POST /comments - userId extracted', { userId: userIdFromToken })

      // Create an authenticated Supabase client by passing the token in headers
      // This allows RLS policies to check auth.uid() correctly
      const authenticatedSupabase = createClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })

      // Validate discussion exists
      const { data: discussionExists, error: discussionError } = await supabase
        .from('hub_discussions')
        .select('id')
        .eq('id', discussionId)
        .single()

      if (discussionError) {
        console.error('POST /comments - Error checking discussion:', discussionError)
        return res.status(404).json({ error: 'Discussion not found' })
      }

      if (!discussionExists) {
        console.log('POST /comments - discussion not found')
        return res.status(404).json({ error: 'Discussion not found' })
      }

      // Validate content
      const { content } = req.body

      if (!content || typeof content !== 'string') {
        console.log('POST /comments - content missing or not string')
        return res.status(400).json({ error: 'Comment content is required' })
      }

      const trimmed = content.trim()

      if (trimmed.length === 0) {
        console.log('POST /comments - content empty')
        return res.status(400).json({ error: 'Comment cannot be empty' })
      }

      if (trimmed.length > 10000) {
        console.log('POST /comments - content too long')
        return res.status(400).json({ error: 'Comment must be 10000 characters or less' })
      }

      console.log('POST /comments - validation passed, creating comment')

      // Create comment using authenticated client so RLS policy checks auth.uid()
      // The RLS policy requires: auth.uid() = author_id
      const { data: newComment, error: createError } = await authenticatedSupabase
        .from('hub_discussion_comments')
        .insert({
          discussion_id: discussionId,
          author_id: userIdFromToken,
          content: trimmed,
          is_solution: false,
          upvotes: 0
        })
        .select('*')
        .single()

      if (createError) {
        console.error('POST /comments - Error creating comment:', {
          code: (createError as any).code,
          message: (createError as any).message,
          details: (createError as any).details
        })
        return res.status(500).json({ error: 'Failed to create comment' })
      }

      console.log('POST /comments - comment created', { id: newComment?.id })

      // Fetch author info
      const { data: authorData, error: authorError } = await supabase
        .from('hub_members')
        .select('id, username, avatar_url')
        .eq('id', userIdFromToken)
        .single()

      if (authorError) {
        console.error('POST /comments - Error fetching author:', authorError)
      }

      const commentWithAuthor = {
        ...newComment,
        author: authorData ? { username: authorData.username, avatar_url: authorData.avatar_url } : { username: 'Unknown', avatar_url: null }
      }

      console.log('POST /comments - success')

      return res.status(201).json({
        data: [commentWithAuthor],
        count: 1,
        limit: 1,
        offset: 0
      })
    } catch (error) {
      console.error('POST /comments - Caught exception:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // DELETE - Delete a comment
  if (req.method === 'DELETE') {
    try {
      console.log('DELETE /comments - starting')

      // Get comment ID from query parameter
      const { commentId } = req.query

      if (!commentId || typeof commentId !== 'string') {
        console.log('DELETE /comments - commentId missing or invalid')
        return res.status(400).json({ error: 'Comment ID is required' })
      }

      // Get auth token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('DELETE /comments - no auth header')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)
      const userIdFromToken = getUserIdFromToken(token)

      if (!userIdFromToken) {
        console.log('DELETE /comments - could not extract user ID from token')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Fetch the comment to verify ownership and existence
      const { data: comment, error: fetchError } = await supabase
        .from('hub_discussion_comments')
        .select('id, author_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !comment) {
        console.log('DELETE /comments - comment not found', { fetchError })
        return res.status(404).json({ error: 'Comment not found' })
      }

      // Verify the user is the comment author
      if (comment.author_id !== userIdFromToken) {
        console.log('DELETE /comments - user is not comment author')
        return res.status(403).json({ error: 'Only the comment author can delete' })
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from('hub_discussion_comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) {
        console.error('DELETE /comments - Error deleting comment:', deleteError)
        return res.status(500).json({ error: 'Failed to delete comment' })
      }

      console.log('DELETE /comments - success', { commentId })

      return res.status(200).json({ message: 'Comment deleted successfully' } as any)
    } catch (error) {
      console.error('DELETE /comments - Caught exception:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
