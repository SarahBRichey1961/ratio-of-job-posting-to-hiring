import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Server-side API to fetch ads - uses SERVICE_ROLE_KEY to bypass RLS
// This ensures ads are always available without waiting for client auth
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Set cache headers - cache ads for 2 minutes
  res.setHeader('Cache-Control', 'public, max-age=120')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[api/ads] Missing Supabase credentials')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    // Use SERVICE_ROLE_KEY to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const now = new Date().toISOString()

    // Fetch active, non-expired ads
    const { data, error } = await supabase
      .from('advertisements')
      .select('id, title, description, banner_image_url, banner_height, click_url, alt_text, impressions, clicks, is_active, expires_at, created_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[api/ads] Supabase error:', error)
      return res.status(500).json({ 
        error: error.message,
        ads: []
      })
    }

    console.log(`[api/ads] ✅ Fetched ${data?.length || 0} active ads`)

    return res.status(200).json({
      ads: data || [],
      count: data?.length || 0,
      timestamp: now
    })
  } catch (err) {
    console.error('[api/ads] Failed to fetch ads:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch ads',
      ads: []
    })
  }
}
