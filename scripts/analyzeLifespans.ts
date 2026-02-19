#!/usr/bin/env node

/**
 * Day 6 Lifespan Tracking Script
 * Analysis and update of posting lifespans based on scraping data
 * 
 * Usage:
 *   npx ts-node scripts/analyzeLifespans.ts
 *   npx ts-node scripts/analyzeLifespans.ts --board=1
 */

import { getAllBoardsLifespanStats, bulkUpdateAllLifespans } from '@/lib/lifespanTracking'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function analyzeAndReport() {
  logger.info('Starting lifespan analysis...')
  console.log('\n' + '='.repeat(80))
  console.log('POSTING LIFESPAN ANALYSIS')
  console.log('='.repeat(80) + '\n')

  try {
    // First, update all lifespans
    logger.info('Updating all lifespan calculations...')
    const updateResult = await bulkUpdateAllLifespans()
    console.log(`✓ Updated ${updateResult.updated} postings`)
    if (updateResult.failed > 0) {
      console.log(`⚠ Failed to update ${updateResult.failed} postings`)
    }

    // Get all statistics
    const allStats = await getAllBoardsLifespanStats()

    if (allStats.length === 0) {
      console.log('No posting data available yet.')
      return
    }

    // Overall statistics
    const totalPostings = allStats.reduce((sum, s) => sum + s.totalPostings, 0)
    const avgLifespanOverall =
      allStats.reduce((sum, s) => sum + s.averageLifespan * s.totalPostings, 0) /
      totalPostings
    const medianOverall = allStats[Math.floor(allStats.length / 2)]?.medianLifespan || 0

    console.log('📊 OVERALL STATISTICS')
    console.log('-'.repeat(80))
    console.log(`Total Postings Tracked: ${totalPostings}`)
    console.log(`Average Lifespan (All Boards): ${avgLifespanOverall.toFixed(1)} days`)
    console.log(`Median Lifespan (All Boards): ${medianOverall} days`)
    console.log()

    // Per-board statistics
    console.log('📋 PER-BOARD BREAKDOWN')
    console.log('-'.repeat(80))

    // Sort by average lifespan (longest first)
    const sorted = [...allStats].sort((a, b) => b.averageLifespan - a.averageLifespan)

    sorted.forEach((stat) => {
      console.log(`\n${stat.boardName}`)
      console.log(`  Total Postings: ${stat.totalPostings}`)
      console.log(`  Active: ${stat.activePostings} | Disappeared: ${stat.disappearedPostings}`)
      console.log(`  Avg Lifespan: ${stat.averageLifespan.toFixed(1)} days`)
      console.log(`  Median: ${stat.medianLifespan} days | Range: ${stat.minLifespan}-${stat.maxLifespan} days`)

      if (stat.byRoleFamily && Object.keys(stat.byRoleFamily).length > 0) {
        console.log(`  By Role Family:`)

        const familySorted = Object.entries(stat.byRoleFamily)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)

        familySorted.forEach(([family, data]) => {
          console.log(
            `    - ${family}: ${data.count} postings, ${data.avgLifespan.toFixed(1)} days avg`
          )
        })
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log('✅ Analysis complete!')
    console.log('='.repeat(80))
  } catch (error) {
    logger.error('Fatal error during analysis', error as Error)
    process.exit(1)
  }
}

analyzeAndReport()
