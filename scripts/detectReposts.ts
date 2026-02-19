#!/usr/bin/env node

/**
 * Day 7 Repost Detection Script
 * Detect and analyze job posting reposts across all boards
 * 
 * Usage:
 *   npx ts-node scripts/detectReposts.ts
 *   npx ts-node scripts/detectReposts.ts --board=5
 */

import {
  bulkDetectAllReposts,
  getAllRepostStats,
  bulkDetectRepostsForBoard,
  getRepostStatsForBoard,
} from '@/lib/repostDetection'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function detectAndReport() {
  logger.info('Starting repost detection...')
  console.log('\n' + '='.repeat(80))
  console.log('REPOST DETECTION & ANALYSIS')
  console.log('='.repeat(80) + '\n')

  try {
    // Detect reposts across all boards
    logger.info('Detecting reposts across all boards...')
    const detectionResult = await bulkDetectAllReposts()
    console.log(`✓ Detected ${detectionResult.totalDetected} repost clusters`)
    console.log(`✓ Updated ${detectionResult.totalUpdated} postings with repost counts`)
    if (detectionResult.totalFailed > 0) {
      console.log(`⚠ Failed to update ${detectionResult.totalFailed} postings`)
    }

    console.log()

    // Get all statistics
    const allStats = await getAllRepostStats()

    if (allStats.length === 0) {
      console.log('No data available yet.')
      return
    }

    // Overall statistics
    const boardsWithReposts = allStats.filter((s) => s.totalRepostEvents > 0)
    const totalReposts = allStats.reduce((sum, s) => sum + s.totalRepostEvents, 0)
    const avgRepostRate =
      allStats.length > 0
        ? Math.round(
            allStats.reduce((sum, s) => sum + s.repostPercentage, 0) /
              allStats.length
          )
        : 0

    console.log('📊 OVERALL STATISTICS')
    console.log('-'.repeat(80))
    console.log(`Total Job Boards: ${allStats.length}`)
    console.log(`Boards with Reposts: ${boardsWithReposts.length}`)
    console.log(`Total Repost Events: ${totalReposts}`)
    console.log(`Average Repost Rate: ${avgRepostRate}%`)
    console.log()

    // Per-board statistics
    console.log('📋 PER-BOARD BREAKDOWN')
    console.log('-'.repeat(80))

    // Sort by repost percentage (highest first)
    const sorted = [...allStats]
      .filter((s) => s.totalRepostEvents > 0)
      .sort((a, b) => b.repostPercentage - a.repostPercentage)

    if (sorted.length === 0) {
      console.log('No boards with repost activity detected.')
    } else {
      sorted.forEach((stat, idx) => {
        console.log(
          `\n${idx + 1}. ${stat.boardName} (${stat.repostPercentage}% repost rate)`
        )
        console.log(
          `   Total Postings: ${stat.totalPostings} | With Reposts: ${stat.postingsWithReposts}`
        )
        console.log(`   Total Repost Events: ${stat.totalRepostEvents}`)
        console.log(
          `   Avg Reposts/Posting: ${stat.averageRepostsPerPosting} | Avg Gap: ${stat.averageGapBetweenReposts} days`
        )
      })
    }

    // Interpretation
    console.log('\n' + '='.repeat(80))
    console.log('💡 INTERPRETATION GUIDE')
    console.log('-'.repeat(80))
    console.log('High Repost Rate (>30%):')
    console.log('  → Jobs are frequently reposted after disappearing')
    console.log('  → May indicate difficulty filling positions or high turnover')
    console.log('  → Negative signal for hiring efficiency')
    console.log()
    console.log('Medium Repost Rate (10-30%):')
    console.log('  → Normal hiring cycle with some positions requiring multiple attempts')
    console.log('  → Common for specialized or remote roles')
    console.log()
    console.log('Low Repost Rate (<10%):')
    console.log('  → Jobs filled quickly without need for reposting')
    console.log('  → Positive signal for hiring efficiency')
    console.log()
    console.log('Long Average Gap (>60 days):')
    console.log('  → Significant time between reposts')
    console.log('  → May indicate business closure or role on hold')
    console.log()
    console.log('Short Average Gap (<7 days):')
    console.log('  → Rapid reposting cycle')
    console.log('  → May indicate difficulty in candidate quality or role mismatch')
    console.log()

    console.log('='.repeat(80))
    console.log('✅ Analysis complete!')
    console.log('='.repeat(80))
  } catch (error) {
    logger.error('Fatal error during analysis', error as Error)
    process.exit(1)
  }
}

detectAndReport()
