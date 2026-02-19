#!/usr/bin/env node

/**
 * Day 11 Scoring Algorithm Script
 * Compute and analyze efficiency scores
 * 
 * Usage:
 *   npx ts-node scripts/computeScores.ts
 */

import {
  calculateAllBoardScores,
  getRankedBoardsByScore,
  getScoresByRoleFamily,
  getScoreDistribution,
} from '@/lib/scoringEngine'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function computeScores() {
  logger.info('Starting efficiency score computation...')
  console.log('\n' + '='.repeat(80))
  console.log('EFFICIENCY SCORING ALGORITHM - COMPREHENSIVE ANALYSIS')
  console.log('='.repeat(80) + '\n')

  try {
    // Get all scores
    logger.info('Computing scores for all boards...')
    const allScores = await calculateAllBoardScores()

    if (allScores.length === 0) {
      console.log('No posting data available yet.')
      return
    }

    // Overall statistics
    const avgScore = allScores.reduce((sum, s) => sum + s.overallScore, 0) / allScores.length
    const medianScore = allScores.sort((a, b) => a.overallScore - b.overallScore)[
      Math.floor(allScores.length / 2)
    ].overallScore

    console.log('📊 OVERALL STATISTICS')
    console.log('-'.repeat(80))
    console.log(`Total Boards Scored: ${allScores.length}`)
    console.log(`Average Score: ${avgScore.toFixed(1)}/100`)
    console.log(`Median Score: ${medianScore}/100`)
    console.log()

    // Ranked boards
    console.log('🏆 TOP PERFORMERS (Highest Efficiency Scores)')
    console.log('-'.repeat(80))

    const ranked = await getRankedBoardsByScore()

    ranked.slice(0, 10).forEach((board) => {
      const indicator = board.rank === 1 ? '🥇' : board.rank === 2 ? '🥈' : board.rank === 3 ? '🥉' : '  '
      console.log(
        `${indicator} ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.overallScore.toString().padStart(3)}/100 [${board.grade}] | Lifespan: ${board.lifespanScore}, Reposts: ${board.repostScore}`
      )
    })

    console.log()
    console.log('⏱️  BOTTOM PERFORMERS (Lowest Efficiency Scores)')
    console.log('-'.repeat(80))

    ranked.slice(-5).reverse().forEach((board) => {
      console.log(
        `    ${board.rank.toString().padStart(2)}. ${board.boardName.padEnd(25)} ${board.overallScore.toString().padStart(3)}/100 [${board.grade}]`
      )
    })

    console.log()

    // Score distribution
    console.log('📈 SCORE DISTRIBUTION')
    console.log('-'.repeat(80))

    const distribution = await getScoreDistribution()

    distribution.forEach((bucket) => {
      if (bucket.count > 0) {
        const bar = '█'.repeat(bucket.count) + '░'.repeat(Math.max(0, 5 - bucket.count))
        console.log(
          `${bucket.range.padEnd(10)} ${bar} ${bucket.count.toString().padStart(2)} boards (${bucket.percentage.toString().padStart(3)}%)`
        )
      }
    })

    console.log()

    // By role family
    console.log('👔 SCORES BY ROLE FAMILY (Top 10)')
    console.log('-'.repeat(80))

    const roleMetrics = await getScoresByRoleFamily(10)

    roleMetrics.forEach((role) => {
      console.log(
        `${role.roleFamily.padEnd(30)} Avg: ${role.avgScore.toString().padStart(3)}/100 | Median: ${role.medianScore.toString().padStart(3)} | Jobs: ${role.jobCount.toString().padStart(4)} | Best: ${role.bestBoard}`
      )
    })

    // Score interpretation
    console.log()
    console.log('='.repeat(80))
    console.log('💡 SCORING INTERPRETATION')
    console.log('-'.repeat(80))

    const gradeA = ranked.filter((s) => s.overallScore >= 85).length
    const gradeB = ranked.filter((s) => s.overallScore >= 70 && s.overallScore < 85).length
    const gradeC = ranked.filter((s) => s.overallScore >= 50 && s.overallScore < 70).length
    const gradeF = ranked.filter((s) => s.overallScore < 50).length

    console.log(`\n📋 Grade Distribution:`)
    console.log(`   A+ to A (85-100): ${gradeA} boards - Elite efficiency`)
    console.log(`   B+ to B (70-84):  ${gradeB} boards - Good efficiency`)
    console.log(`   C+ to C (50-69):  ${gradeC} boards - Average to moderate efficiency`)
    console.log(`   D to F (0-49):    ${gradeF} boards - Poor efficiency`)

    if (gradeA > 0) {
      console.log(`\n✅ ELITE BOARDS (Score 85+):`)
      ranked
        .filter((s) => s.overallScore >= 85)
        .forEach((board) => {
          console.log(`   • ${board.boardName}: ${board.overallScore}/100 [${board.grade}]`)
        })
      console.log(`   These boards show excellent hiring efficiency and data quality.`)
    }

    if (gradeF > 0) {
      console.log(`\n🚨 PROBLEM BOARDS (Score < 50):`)
      ranked
        .filter((s) => s.overallScore < 50)
        .forEach((board) => {
          console.log(
            `   • ${board.boardName}: ${board.overallScore}/100 [${board.grade}] (Quality: ${(board.qualityAdjustment * 100).toFixed(0)}%)`
          )
        })
      console.log(`   Consider reducing scraping frequency or investigating data quality issues.`)
    }

    // Weighted formula explanation
    console.log()
    console.log('⚙️  SCORING FORMULA')
    console.log('-'.repeat(80))
    console.log(`Overall Score = Weighted Average with Quality Adjustment`)
    console.log(`  • 40% Lifespan Score (shorter = better)`)
    console.log(`  • 30% Repost Score (lower duplication = better)`)
    console.log(`  • 20% Employer Survey Score (higher ratings = better)`)
    console.log(`  • 10% Candidate Survey Score (higher visibility = better)`)
    console.log()
    console.log(`Quality Adjustment (based on repost rate):`)
    console.log(`  • < 5% repost: 100% multiplier (excellent data quality)`)
    console.log(`  • 5-15% repost: 95% multiplier (good quality)`)
    console.log(`  • 15-30% repost: 85% multiplier (moderate quality)`)
    console.log(`  • 30-50% repost: 70% multiplier (concerning quality)`)
    console.log(`  • > 50% repost: 0% (data unreliable, no score)`)

    console.log()
    console.log('='.repeat(80))
    console.log('✅ Scoring complete!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal error during scoring', error as Error)
    process.exit(1)
  }
}

computeScores()
