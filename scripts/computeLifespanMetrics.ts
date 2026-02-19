#!/usr/bin/env node

/**
 * Day 9 Lifespan Metrics Script
 * Compute and analyze posting lifespan statistics
 * 
 * Usage:
 *   npx ts-node scripts/computeLifespanMetrics.ts
 *   npx ts-node scripts/computeLifespanMetrics.ts --board=5
 */

import {
  getAllBoardsLifespanMetrics,
  getRankedBoardsByLifespan,
  getLifespanByRoleFamily,
} from '@/lib/lifespanMetrics'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function computeMetrics() {
  logger.info('Starting lifespan metrics computation...')
  console.log('\n' + '='.repeat(80))
  console.log('POSTING LIFESPAN METRICS ANALYSIS')
  console.log('='.repeat(80) + '\n')

  try {
    // Get all metrics
    logger.info('Computing metrics for all boards...')
    const allMetrics = await getAllBoardsLifespanMetrics()

    if (allMetrics.length === 0) {
      console.log('No posting data available yet.')
      return
    }

    // Overall statistics
    const avgAcrossBoards =
      allMetrics.reduce((sum, m) => sum + m.avgLifespan, 0) / allMetrics.length
    const avgMedian =
      allMetrics.reduce((sum, m) => sum + m.medianLifespan, 0) / allMetrics.length
    const totalPostings = allMetrics.reduce((sum, m) => sum + m.totalPostings, 0)

    console.log('📊 OVERALL STATISTICS')
    console.log('-'.repeat(80))
    console.log(`Total Job Boards: ${allMetrics.length}`)
    console.log(`Total Postings Analyzed: ${totalPostings}`)
    console.log()
    console.log(`Average Lifespan (Across All Boards): ${avgAcrossBoards.toFixed(1)} days`)
    console.log(`Average Median Lifespan: ${avgMedian.toFixed(1)} days`)
    console.log()

    // Ranked boards
    console.log('🏆 TOP PERFORMERS (Longest Average Lifespan)')
    console.log('-'.repeat(80))

    const ranked = await getRankedBoardsByLifespan()

    ranked.slice(0, 10).forEach((board, idx) => {
      const indicator = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '
      console.log(
        `${indicator} ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.avgLifespan.toFixed(1).padStart(6)}d avg (${board.totalPostings} postings)`
      )
    })

    console.log()
    console.log('⏱️  SLOWEST BOARDS (Shortest Average Lifespan)')
    console.log('-'.repeat(80))

    ranked.slice(-5).reverse().forEach((board) => {
      console.log(
        `    ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.avgLifespan.toFixed(1).padStart(6)}d avg (${board.totalPostings} postings)`
      )
    })

    console.log()

    // By role family
    console.log('👔 ROLE FAMILY ANALYSIS (Top 10)')
    console.log('-'.repeat(80))

    const roleMetrics = await getLifespanByRoleFamily(10)

    roleMetrics.forEach((role) => {
      console.log(
        `${role.roleFamily.padEnd(30)} ${role.avgLifespan.toFixed(1).padStart(6)}d avg | ${role.medianLifespan.toString().padStart(3)}d median | ${role.totalPostings.toString().padStart(4)} postings | ${role.distinctBoards} boards`
      )
    })

    // Interpretation
    console.log()
    console.log('='.repeat(80))
    console.log('💡 INTERPRETATION GUIDE')
    console.log('-'.repeat(80))

    const longLiving = allMetrics.filter((m) => m.avgLifespan > 45)
    const shortLiving = allMetrics.filter((m) => m.avgLifespan < 15)

    if (longLiving.length > 0) {
      console.log(`\n🔴 HIGH LIFESPAN BOARDS (>45 days avg):`)
      console.log(
        `   ${longLiving.map((m) => m.boardName).join(', ')}`
      )
      console.log(`   ⚠️  Long posting lifecycles may indicate:`)
      console.log(`   • Difficulty filling positions`)
      console.log(`   • High standards/niche roles`)
      console.log(`   • Low hiring frequency`)
    }

    if (shortLiving.length > 0) {
      console.log(`\n🟢 LOW LIFESPAN BOARDS (<15 days avg):`)
      console.log(
        `   ${shortLiving.map((m) => m.boardName).join(', ')}`
      )
      console.log(`   ✅ Quick hiring cycles indicate:`)
      console.log(`   • Strong job-candidate fit`)
      console.log(`   • Efficient hiring process`)
      console.log(`   • High quality output`)
    }

    console.log()
    console.log('='.repeat(80))
    console.log('✅ Analysis complete!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal error during analysis', error as Error)
    process.exit(1)
  }
}

computeMetrics()
