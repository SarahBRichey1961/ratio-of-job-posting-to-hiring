import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Browser client (with RLS)
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)

    // Service role client (bypasses RLS)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch with browser client (respects RLS)
    const { data: browserData, error: browserError } = await anonSupabase
      .from('advertisements')
      .select('id, title, is_active, banner_image_url, click_url, banner_height, expires_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch with service role (bypasses RLS)
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('advertisements')
      .select('id, title, is_active, banner_image_url, click_url, banner_height, expires_at, created_at, advertiser_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Also check RLS policies
    const { data: policiesData, error: policiesError } = await serviceSupabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'advertisements')

    return res.status(200).json({
      browser_client: {
        count: browserData?.length || 0,
        error: browserError?.message || null,
        data: browserData,
      },
      service_role: {
        count: serviceData?.length || 0,
        error: serviceError?.message || null,
        data: serviceData,
      },
      ad_details: serviceData?.map(ad => ({
        id: ad.id,
        title: ad.title,
        is_active: ad.is_active,
        has_banner_url: !!ad.banner_image_url,
        has_click_url: !!ad.click_url,
        banner_height: ad.banner_height,
        expires_at: ad.expires_at,
        created_at: ad.created_at,
      })),
      rls_policies: policiesData || [],
    })
  } catch (err) {
    console.error('Diagnostic error:', err)
    return res.status(500).json({
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
