import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/hub/app-submission-search
 * Searches submissions from a generated app
 * 
 * Query params:
 * - appName: string (required) - Filter by app
 * - name?: string - Search by name (partial match)
 * - location?: string - Search by location (partial match)
 * - type?: string - Filter by submission type (letter, poem, etc.)
 * - limit?: number - Max results (default 20, max 100)
 * 
 * Response: { 
 *   success: true, 
 *   results: [{
 *     id: uuid,
 *     name: string,
 *     location: string,
 *     submissionType: string,
 *     preview: string,  // First 100 chars of content
 *     createdAt: ISO string
 *   }],
 *   total: number
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { appName, name, location, type, limit = 20 } = req.query

    // Validate required fields
    if (!appName || typeof appName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: appName',
      })
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100)

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

    // Build query
    let query = supabase
      .from('app_submissions')
      .select('id, name, location, submission_type, content, created_at', { count: 'exact' })
      .eq('app_name', appName)

    // Filter by name (case-insensitive partial match)
    if (name && typeof name === 'string' && name.trim()) {
      const searchName = `%${name.toLowerCase().trim()}%`
      query = query.ilike('search_name', searchName)
    }

    // Filter by location (case-insensitive partial match)
    if (location && typeof location === 'string' && location.trim()) {
      const searchLocation = `%${location.toLowerCase().trim()}%`
      query = query.ilike('search_location', searchLocation)
    }

    // Filter by type
    if (type && typeof type === 'string' && type.trim()) {
      query = query.eq('submission_type', type.trim())
    }

    // Order by newest first and limit
    query = query.order('created_at', { ascending: false }).limit(limitNum)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Supabase query error:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Search failed',
      })
    }

    // Format response with preview
    const results = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      location: item.location || 'Not specified',
      submissionType: item.submission_type,
      preview: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
      createdAt: item.created_at,
    }))

    console.log(`✅ Search completed: ${results.length} results for app "${appName}"`)

    return res.status(200).json({
      success: true,
      results,
      total: count || 0,
    })
  } catch (error) {
    console.error('❌ Search error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
