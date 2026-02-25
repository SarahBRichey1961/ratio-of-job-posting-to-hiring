/**
 * Test script to check if industry_metrics table has data
 * Run with: node scripts/testIndustryMetrics.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIndustryMetrics() {
  try {
    console.log('🔍 Testing industry_metrics table...');

    // Test 1: Get all industries
    const { data: industries, error: industriesError } = await supabase
      .from('industry_metrics')
      .select('*')
      .order('avg_score', { ascending: false });

    if (industriesError) {
      console.error('❌ Error fetching industries:', industriesError);
      return;
    }

    console.log(`✅ Found ${industries?.length || 0} industries`);

    if (industries && industries.length > 0) {
      console.log('\n📊 Sample industries:');
      industries.slice(0, 5).forEach((ind) => {
        console.log(
          `  - ${ind.industry}: ${ind.total_boards} boards, score=${ind.avg_score}, trend=${ind.trend}`
        );
      });
    } else {
      console.warn('⚠️  No industries found in database!');
      console.log('\n📝 The industry_metrics table is empty.');
      console.log('Run the SQL query from POPULATE_INDUSTRY_METRICS.sql in Supabase SQL Editor.');
    }

    // Test 2: Check job_boards table  
    const { data: boards, error: boardsError, count } = await supabase
      .from('job_boards')
      .select('*', { count: 'exact' })
      .limit(1);

    if (boardsError) {
      console.error('❌ Error accessing job_boards:', boardsError);
      return;
    }

    console.log(`\n✅ job_boards table has ${count} records`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testIndustryMetrics();
