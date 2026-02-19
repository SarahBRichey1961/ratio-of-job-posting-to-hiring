#!/usr/bin/env node

/**
 * Day 10 Repost Frequency Script
 * Compute and analyze reposting statistics
 * 
 * Usage:
 *   npx ts-node scripts/computeRepostFrequency.ts
 */

import {
  getAllBoardsRepostFrequency,
  getRankedBoardsByRepostFrequency,
  getRepostFrequencyByRoleFamily,
  getRepostSeverity,
} from '@/lib/repostFrequency'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function computeMetrics() {
  logger.info('Starting repost frequency computation...')
  console.log('\n' + '='.repeat(80))
  console.log('REPOST FREQUENCY METRICS ANALYSIS')
  console.log('='.repeat(80) + '\n')

  try {
    // Get all metrics
    logger.info('Computing metrics for all boards...')
    const allMetrics = await getAllBoardsRepostFrequency()

    if (allMetrics.length === 0) {
      console.log('No posting data available yet.')
      return
    }

    // Overall statistics
    const totalPostings = allMetrics.reduce((sum, m) => sum + m.totalPostings, 0)
    const totalReposts = allMetrics.reduce((sum, m) => sum + m.totalReposts, 0)
    const avgRepostRate =
      allMetrics.reduce((sum, m) => sum + m.repostRate, 0) / allMetrics.length
    const totalRepostedCount = allMetrics.reduce(
      (sum, m) => sum + m.uniqueRepostedPostings,
      0
    )

    console.log('📊 OVERALL STATISTICS')
    console.log('-'.repeat(80))
    console.log(`Total Job Boards: ${allMetrics.length}`)
    console.log(`Total Postings Analyzed: ${totalPostings}`)
    console.log(`Total Repost Events: ${totalReposts}`)
    console.log(`Postings with Reposts: ${totalRepostedCount}`)
    console.log()
    console.log(
      `Average Repost Rate (Across All Boards): ${avgRepostRate.toFixed(1)}%`
    )
    console.log(`Global Repost Rate: ${((totalReposts / totalPostings) * 100).toFixed(1)}%`)
    console.log()

    // Ranked boards
    console.log('🏆 CLEANEST BOARDS (Lowest Repost Rate)')
    console.log('-'.repeat(80))

    const ranked = await getRankedBoardsByRepostFrequency()

    ranked.slice(0, 10).forEach((board, idx) => {
      const indicator = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '
      console.log(
        `${indicator} ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.repostRate.toFixed(1).padStart(6)}% (${board.totalPostings} postings) [Health: ${board.healthScore}]`
      )
    })

    console.log()
    console.log('⚠️  DIRTIEST BOARDS (Highest Repost Rate)')
    console.log('-'.repeat(80))

    ranked.slice(-5).reverse().forEach((board) => {
      console.log(
        `    ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.repostRate.toFixed(1).padStart(6)}% (${board.totalPostings} postings) [Health: ${board.healthScore}]`
      )
    })

    console.log()

    // By role family
    console.log('👔 REPOST FREQUENCY BY ROLE FAMILY (Top 10)')
    console.log('-'.repeat(80))

    const roleMetrics = await getRepostFrequencyByRoleFamily(10)

    roleMetrics.forEach((role) => {
      console.log(
        `${role.roleFamily.padEnd(30)} ${role.repostRate.toFixed(1).padStart(6)}% | ${role.repostedCount.toString().padStart(3)} of ${role.totalPostings.toString().padStart(4)} | Avg: ${role.avgRepostsPerPosting.toFixed(2).padStart(5)}x | ${role.distinctBoards} boards`
      )
    })

    console.log()

    // Severity analysis
    console.log('🔍 DATA QUALITY ASSESSMENT')
    console.log('-'.repeat(80))

    const severityMap: Record<string, number> = {}
    for (const board of ranked.slice(0, 10)) {
      const severity = await getRepostSeverity(board.boardId)
      severityMap[severity.severity] = (severityMap[severity.severity] || 0) + 1
    }

    console.log('Top performers severity distribution:')
    Object.entries(severityMap).forEach(([severity, count]) => {
      console.log(`  ${severity.toUpperCase()}: ${count} boards`)
    })

    console.log()

    // Interpretation
    console.log('='.repeat(80))
    console.log('💡 INTERPRETATION GUIDE')
    console.log('-'.repeat(80))

    const excellent = ranked.filter((b) => b.repostRate < 5)
    const dirty = ranked.filter((b) => b.repostRate > 30)

    if (excellent.length > 0) {
      console.log(`\n✅ EXCELLENT BOARDS (<5% repost rate):`)
      console.log(
        `   ${excellent.map((b) => b.boardName).join(', ')}`
      )
      console.log(`   These boards have exceptional data quality.`)
      console.log(`   Suitable for detailed analysis and reporting.`)
    }

    if (dirty.length > 0) {
      console.log(`\n🚨 PROBLEMATIC BOARDS (>30% repost rate):`)
      console.log(
        `   ${dirty.map((b) => b.boardName).join(', ')}`
      )
      console.log(`   High duplication suggests scraping frequency issues.`)
      console.log(`   Consider:`)
      console.log(`   • Reducing scraping frequency`)
      console.log(`   • Improving deduplication logic`)
      console.log(`   • Temporarily disabling if >50%`)
    }

    if (avgRepostRate > 20) {
      console.log(`\n⚠️  NETWORK-WIDE CONCERN:`)
      console.log(`   Average repost rate of ${avgRepostRate.toFixed(1)}% is elevated.`)
      console.log(`   Recommend audit of scraping strategy and frequencies.`)
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
