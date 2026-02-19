#!/usr/bin/env node

/**
 * Day 13 Trend Tracking Script
 * Analyze trends, snapshots, and anomalies across all boards
 * 
 * Usage:
 *   npx ts-node scripts/analyzeTrends.ts
 */

import {
  getAllBoardTrends,
  getWeeklyComparison,
  detectAnomalies,
  getRoleTrends,
} from '@/lib/trendTracking'
import { supabase } from '@/lib/supabase'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function analyzeTrends() {
  logger.info('Starting trend tracking analysis...')
  console.log('\n' + '='.repeat(80))
  console.log('TREND TRACKING ANALYSIS - HISTORICAL PERFORMANCE & ANOMALY DETECTION')
  console.log('='.repeat(80) + '\n')

  try {
    // Get all boards first
    const { data: boards } = await supabase.from('job_boards').select('id, name')

    if (!boards || boards.length === 0) {
      console.log('No boards found. Please seed boards first.')
      return
    }

    // Trend analysis
    console.log('📊 TREND ANALYSIS (30-DAY PERIOD)')
    console.log('-'.repeat(80))

    const allTrends = await getAllBoardTrends(30)

    if (allTrends.length === 0) {
      console.log('No trend data available yet. Snapshots will accumulate over time.')
    } else {
      console.log(`Boards with trend data: ${allTrends.length}\n`)

      const improving = allTrends.filter((t) => t.trend === 'up')
      const declining = allTrends.filter((t) => t.trend === 'down')
      const stable = allTrends.filter((t) => t.trend === 'stable')

      console.log(`✅ Improving (↑): ${improving.length}`)
      improving.slice(0, 5).forEach((t) => {
        const emoji = t.trendStrength === 'strong' ? '🚀' : t.trendStrength === 'moderate' ? '📈' : '→'
        console.log(
          `   ${emoji} ${t.boardName.padEnd(30)} +${t.scoreChange} (${t.scoreChangePercent > 0 ? '+' : ''}${t.scoreChangePercent.toFixed(1)}%)`
        )
      })

      console.log(`\n❌ Declining (↓): ${declining.length}`)
      declining.slice(0, 5).forEach((t) => {
        const emoji = t.trendStrength === 'strong' ? '📉' : t.trendStrength === 'moderate' ? '📉' : '→'
        console.log(
          `   ${emoji} ${t.boardName.padEnd(30)} ${t.scoreChange} (${t.scoreChangePercent.toFixed(1)}%)`
        )
      })

      console.log(`\n➡️  Stable (→): ${stable.length}`)
    }

    console.log()

    // Weekly comparison
    console.log('📅 WEEKLY COMPARISON')
    console.log('-'.repeat(80))

    const weeklyData: Array<any> = []
    for (const board of boards.slice(0, 10)) {
      const weekly = await getWeeklyComparison(board.id)
      if (weekly) {
        weeklyData.push(weekly)
      }
    }

    if (weeklyData.length === 0) {
      console.log('Insufficient weekly snapshot data. This will populate after 7+ days of snapshots.')
    } else {
      console.log(`Weekly data for ${weeklyData.length} boards:\n`)

      weeklyData.slice(0, 5).forEach((w) => {
        const icon = w.weekTrend === 'up' ? '📈' : w.weekTrend === 'down' ? '📉' : '→'
        const direction = w.weekTrend === 'up' ? 'Improving' : w.weekTrend === 'down' ? 'Declining' : 'Stable'
        console.log(`\n${w.boardName}:`)
        console.log(`  This Week: ${w.thisWeekScore} | Last Week: ${w.lastWeekScore}`)
        console.log(`  Change: ${icon} ${w.weekChange > 0 ? '+' : ''}${w.weekChange} (${direction})`)
        console.log(`  Trend Duration: ${w.trendDuration} consecutive weeks`)
        console.log(`  Volatility: ${w.volatility} (measure of score fluctuation)`)
      })
    }

    console.log()

    // Anomalies
    console.log('⚠️  ANOMALY DETECTION')
    console.log('-'.repeat(80))

    const allAnomalies: Array<any> = []
    for (const board of boards.slice(0, 10)) {
      const anomalies = await detectAnomalies(board.id)
      allAnomalies.push(...anomalies)
    }

    if (allAnomalies.length === 0) {
      console.log('✅ No anomalies detected across sampled boards.')
    } else {
      console.log(`Found ${allAnomalies.length} anomalies:\n`)

      const byBoardName = (boardName: string): typeof allAnomalies[0][] =>
        allAnomalies.filter((a) => a.boardName === boardName)

      const uniqueBoards = [...new Set(allAnomalies.map((a) => a.boardName))]

      uniqueBoards.forEach((boardName) => {
        const boardAnomalies = byBoardName(boardName)
        console.log(`\n${boardName}:`)

        boardAnomalies.forEach((a) => {
          const icon = a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟠' : '🟡'
          console.log(`  ${icon} ${a.metric}: ${a.description}`)
          console.log(`     Current: ${Math.round(a.currentValue)} | Expected: ${a.expectedValue} | Deviation: ${a.deviation.toFixed(1)}σ`)
        })
      })
    }

    console.log()

    // Role trends
    console.log('🎯 ROLE TRENDS (THIS WEEK)')
    console.log('-'.repeat(80))

    const roleTrends = await getRoleTrends(20)

    if (roleTrends.length === 0) {
      console.log('No role posting data yet.')
    } else {
      const risingRoles = roleTrends.filter((r) => r.demandChange > 0)
      const decliningRoles = roleTrends.filter((r) => r.demandChange < 0)
      const stableRoles = roleTrends.filter((r) => r.demandChange === 0)

      console.log(`\n🚀 Rising Demand (${risingRoles.length} roles):`)
      risingRoles.slice(0, 5).forEach((r) => {
        console.log(
          `   ${r.roleFamily.padEnd(30)} +${r.demandChange} new jobs/week | Score: ${r.currentScore}`
        )
      })

      console.log(`\n📉 Declining Demand (${decliningRoles.length} roles):`)
      decliningRoles.slice(0, 5).forEach((r) => {
        console.log(
          `   ${r.roleFamily.padEnd(30)} ${r.demandChange} jobs/week | Score: ${r.currentScore}`
        )
      })

      console.log(`\n→ Stable Demand (${stableRoles.length} roles)`)

      console.log(`\n🔥 Hottest Roles (highest percentile):`)
      const hottest = roleTrends.sort((a, b) => b.hotness - a.hotness).slice(0, 5)
      hottest.forEach((r) => {
        console.log(`   ${r.roleFamily.padEnd(30)} ${r.hotness}th percentile`)
      })
    }

    console.log()
    console.log('='.repeat(80))
    console.log('📊 KEY METRICS')
    console.log('-'.repeat(80))

    const totalSnapshots = await supabase.from('trend_snapshots').select('*', { count: 'exact' })
    console.log(`\n✅ Snapshot accumulation:`)
    console.log(`   • Total snapshots: ${totalSnapshots.count || 0}`)
    console.log(`   • Boards tracked: ${boards.length}`)
    console.log(`   • Suggested frequency: Daily (each board gets 1 snapshot/day)`)

    if (allTrends.length > 0) {
      const strongUpTrends = allTrends.filter((t) => t.trend === 'up' && t.trendStrength === 'strong')
      const strongDownTrends = allTrends.filter((t) => t.trend === 'down' && t.trendStrength === 'strong')

      console.log(`\n⚡ Momentum breakdown:`)
      console.log(`   • Strong uptrend: ${strongUpTrends.length} boards`)
      console.log(`   • Strong downtrend: ${strongDownTrends.length} boards`)
      console.log(`   • Stable/Weak trends: ${allTrends.length - strongUpTrends.length - strongDownTrends.length} boards`)
    }

    console.log(`\n💡 Trend interpretation:`)
    console.log(`   • ↑ Up trend: Score increasing over period (positive momentum)`)
    console.log(`   • ↓ Down trend: Score decreasing over period (negative momentum)`)
    console.log(`   • → Stable: Score relatively flat (±2% change threshold)`)
    console.log(`   • Strong trend: >5% change over period`)
    console.log(`   • Moderate trend: 2-5% change`)
    console.log(`   • Weak trend: <2% change`)

    console.log()
    console.log('='.repeat(80))
    console.log('✅ Trend analysis complete!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal error during analysis', error as Error)
    process.exit(1)
  }
}

analyzeTrends()
