/**
 * Script to populate industry_metrics table with data from job_boards
 * Run with: npx ts-node scripts/populateIndustryMetrics.ts
 */

import { updateIndustryMetrics } from '@/lib/industryInsights'

async function main() {
  try {
    console.log('🚀 Starting industry metrics population...')
    const result = await updateIndustryMetrics()
    
    if (result.success) {
      console.log(`✅ Successfully updated ${result.industriesUpdated} industries`)
    } else {
      console.error(`❌ Failed to update metrics: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
