import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create Supabase client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing Supabase environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    console.log('[debug/ad-fetch-test] Starting ad fetch test...')

    // Test 1: Fetch all advertisements (no filter)
    const { data: allAds, error: allAdsError } = await supabase
      .from('advertisements')
      .select('*')
      .limit(100)

    // Test 2: Fetch active ads only
    const { data: activeAds, error: activeAdsError } = await supabase
      .from('advertisements')
      .select('id, title, is_active, expires_at, created_at')
      .eq('is_active', true)
      .limit(100)

    // Test 3: Fetch with detailed filters
    const now = new Date().toISOString()
    const { data: validAds, error: validAdsError } = await supabase
      .from('advertisements')
      .select('id, title, is_active, expires_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(100)

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      tests: {
        allAds: {
          count: allAds?.length || 0,
          error: allAdsError?.message,
          data: allAds?.slice(0, 3) // Show first 3
        },
        activeAds: {
          count: activeAds?.length || 0,
          error: activeAdsError?.message,
          data: activeAds?.slice(0, 3)
        },
        validAds: {
          count: validAds?.length || 0,
          error: validAdsError?.message,
          data: validAds?.slice(0, 3)
        }
      },
      summary: {
        totalAdsInDb: allAds?.length || 0,
        activeAdsCount: activeAds?.length || 0,
        adsNotExpired: validAds?.length || 0
      }
    })
  } catch (err) {
    console.error('[debug/ad-fetch-test] Error:', err)
    return res.status(500).json({
      error: 'Debug test failed',
      details: err instanceof Error ? err.message : String(err)
    })
  }
}
