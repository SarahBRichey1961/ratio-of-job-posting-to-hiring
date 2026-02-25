/**
 * Test script to check if industry_metrics table has data
 * Run with: npx ts-node scripts/testIndustryMetrics.ts
 */

import { supabase } from '@/lib/supabase'

async function testIndustryMetrics() {
  try {
    console.log('🔍 Testing industry_metrics table...')

    // Test 1: Get all industries
    const { data: industries, error: industriesError } = await supabase
      .from('industry_metrics')
      .select('*')
      .order('avg_score', { ascending: false })

    if (industriesError) {
      console.error('❌ Error fetching industries:', industriesError)
      return
    }

    console.log(`✅ Found ${industries?.length || 0} industries`)

    if (industries && industries.length > 0) {
      console.log('\n📊 Sample industries:')
      industries.slice(0, 5).forEach((ind) => {
        console.log(
          `  - ${ind.industry}: ${ind.total_boards} boards, score=${ind.avg_score}, trend=${ind.trend}`
        )
      })
    } else {
      console.warn('⚠️  No industries found in database')
      console.log('\n📝 Run this SQL in Supabase to populate:')
      console.log(`
INSERT INTO industry_metrics (industry, total_boards, avg_score, median_lifespan, avg_repost_rate, top_board, top_role, trend, updated_at)
SELECT 
  industry,
  COUNT(*) as total_boards,
  65 as avg_score,
  20 as median_lifespan,
  12.5 as avg_repost_rate,
  (ARRAY_AGG(name ORDER BY name ASC))[1] as top_board,
  'Technology' as top_role,
  'stable' as trend,
  NOW() as updated_at
FROM job_boards
GROUP BY industry
ON CONFLICT (industry) 
DO UPDATE SET updated_at = NOW();
      `)
    }

    // Test 2: Check job_boards table
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('industry')
      .limit(1)

    if (boardsError) {
      console.error('❌ Error accessing job_boards:', boardsError)
      return
    }

    console.log('\n✅ job_boards table is accessible')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testIndustryMetrics()
