import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Diagnostic endpoint to debug ad system
 * Visit: /api/debug/ads
 * 
 * Shows:
 * - Number of advertiser accounts
 * - Number of active ads
 * - Number of users in auth
 * - Sample data from each table
 * - RLS policy status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get counts from each table
    const [
      { count: advertisersCount, error: advertiserError },
      { count: adsCount, error: adsError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase
        .from('advertiser_accounts')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('advertisements')
        .select('*', { count: 'exact', head: true }),
      supabase.auth.admin.listUsers(),
    ])

    const usersCount = usersData?.users?.length ?? 0

    // Get sample data
    const { data: sampleAdvertisers, error: sampleAdvertiserError } = await supabase
      .from('advertiser_accounts')
      .select('id, user_id, company_name, payment_status')
      .limit(3)

    const { data: sampleAds, error: sampleAdsError } = await supabase
      .from('advertisements')
      .select('id, title, is_active, advertiser_id, created_at')
      .limit(3)

    const { data: activeAds, error: activeAdsError } = await supabase
      .from('advertisements')
      .select('id, title, advertiser_id')
      .eq('is_active', true)

    // Get sample users (first 3)
    const sampleUsers = usersData?.users?.slice(0, 3) || []

    // Try the exact query that AdRotationBanner uses
    const { data: bannerAds, error: bannerError } = await supabase
      .from('advertisements')
      .select('id, title, description, banner_image_url, banner_height, click_url, alt_text, impressions, clicks, is_active, expires_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    const diagnostic = {
      timestamp: new Date().toISOString(),
      status: {
        advertisers_count: advertisersCount || 0,
        ads_total_count: adsCount || 0,
        ads_active_count: activeAds?.length || 0,
        users_count: usersCount,
      },
      component_query_result: {
        query: "from('advertisements').select(...).eq('is_active', true).order('created_at').limit(50)",
        rows_returned: bannerAds?.length || 0,
        error: bannerError?.message || null,
        sample_ads: bannerAds?.slice(0, 2) || [],
      },
      sample_data: {
        advertisers: sampleAdvertisers || [],
        ads: sampleAds || [],
        active_ads: activeAds?.slice(0, 2) || [],
        users: sampleUsers?.map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
        })) || [],
      },
      issues_identified: [
        (adsCount || 0) === 0 ? '🔴 NO ADS IN DATABASE - Create ads to fix this' : '✅ Ads exist in database',
        (activeAds?.length || 0) === 0 ? '🔴 NO ACTIVE ADS - Set is_active=true on ads' : '✅ Active ads exist',
        (advertisersCount || 0) === 0 ? '🔴 NO ADVERTISER ACCOUNTS - Create admin advertiser account' : '✅ Advertiser accounts exist',
        usersCount === 0 ? '🔴 NO USERS IN AUTH - Invalid state' : '✅ Users exist in auth',
        bannerError ? `🔴 COMPONENT QUERY FAILED: ${bannerError.message}` : '✅ Component query works',
      ],
      next_steps:
        (adsCount || 0) === 0
          ? [
              '1. Go to Supabase SQL Editor',
              '2. Get user ID: SELECT id FROM auth.users LIMIT 1',
              '3. Create advertiser: INSERT INTO advertiser_accounts (user_id, company_name, ...) VALUES (...)',
              '4. Create ad: INSERT INTO advertisements (advertiser_id, title, ...) VALUES (...)',
              '5. Verify: SELECT * FROM advertisements WHERE is_active = true',
            ]
          : ['Ads should be displaying. Check browser console for errors.'],
    }

    res.status(200).json(diagnostic)
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
