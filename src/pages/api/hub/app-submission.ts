import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/hub/app-submission/[id]
 * Retrieves the full content of a submission
 * 
 * Response: { 
 *   success: true, 
 *   submission: {
 *     id: uuid,
 *     appName: string,
 *     name: string,
 *     location: string,
 *     submissionType: string,
 *     content: string,
 *     createdAt: ISO string
 *   }
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid submission ID',
      })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase credentials missing')
      return res.status(500).json({
        success: false,
        error: 'Database not configured',
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch submission
    const { data, error } = await supabase
      .from('app_submissions')
      .select('id, app_name, name, location, submission_type, content, created_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Submission not found',
        })
      }
      console.error('❌ Supabase query error:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch submission',
      })
    }

    console.log(`✅ Submission retrieved: ${id}`)

    return res.status(200).json({
      success: true,
      submission: {
        id: data.id,
        appName: data.app_name,
        name: data.name,
        location: data.location || 'Not specified',
        submissionType: data.submission_type,
        content: data.content,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error('❌ Fetch error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
