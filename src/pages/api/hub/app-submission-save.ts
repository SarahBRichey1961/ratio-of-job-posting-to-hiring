import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/hub/app-submission-save
 * Saves a submission from a generated app to the database
 * 
 * Body: {
 *   appName: string,
 *   appIdea: string,
 *   name: string,
 *   location?: string,
 *   submissionType: string,  // "letter", "poem", "message", etc.
 *   content: string
 * }
 * 
 * Response: { success: true, id: uuid } or { success: false, error: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for generated apps on different domains
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      appName,
      appIdea,
      name,
      location,
      submissionType,
      content,
    } = req.body

    // Validate required fields
    if (!appName || !appIdea || !name || !submissionType || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appName, appIdea, name, submissionType, content',
      })
    }

    // Validate content length
    if (content.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Content is too long (max 50000 characters)',
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

    // Insert submission
    const { data, error } = await supabase
      .from('app_submissions')
      .insert([
        {
          app_name: appName,
          app_idea: appIdea,
          name: name,
          location: location || null,
          submission_type: submissionType,
          content: content,
        },
      ])
      .select('id')
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to save submission',
      })
    }

    console.log(`✅ Submission saved: ${data.id}`)

    return res.status(200).json({
      success: true,
      id: data.id,
      message: 'Submission saved successfully',
    })
  } catch (error) {
    console.error('❌ Save error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
