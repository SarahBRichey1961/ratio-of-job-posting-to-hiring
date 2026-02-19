#!/usr/bin/env node

/**
 * Day 12 Dimensional Scoring Script
 * Analyze efficiency scores by role family and industry
 * 
 * Usage:
 *   npx ts-node scripts/analyzeDimensionalScores.ts
 */

import {
  getRoleScores,
  getIndustryScores,
  getRoleHiringVelocity,
  getRoleRecommendations,
} from '@/lib/dimensionalScoring'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function analyzeDimensions() {
  logger.info('Starting dimensional scoring analysis...')
  console.log('\n' + '='.repeat(80))
  console.log('DIMENSIONAL SCORING ANALYSIS - ROLE & INDUSTRY BREAKDOWN')
  console.log('='.repeat(80) + '\n')

  try {
    // Role analysis
    console.log('👔 ROLE FAMILY ANALYSIS')
    console.log('-'.repeat(80))

    const roles = await getRoleScores()

    if (roles.length === 0) {
      console.log('No role data available yet.')
      return
    }

    console.log(`Total Role Families: ${roles.length}`)
    console.log()
    console.log('Top 10 Roles by Average Score:')

    roles.slice(0, 10).forEach((role, idx) => {
      const indicator = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '
      console.log(
        `${indicator} ${(idx + 1).toString().padStart(2)}. ${role.roleFamily.padEnd(30)} Avg: ${role.avgScore.toString().padStart(3)} | Jobs: ${role.jobCount.toString().padStart(5)} | Boards: ${role.boards}`
      )
    })

    console.log()
    console.log('Bottom 5 Roles by Average Score:')
    roles.slice(-5).reverse().forEach((role) => {
      console.log(
        `    ${role.roleFamily.padEnd(30)} Avg: ${role.avgScore.toString().padStart(3)} | Jobs: ${role.jobCount.toString().padStart(5)} | Boards: ${role.boards}`
      )
    })

    console.log()

    // Industry analysis
    console.log('🏭 INDUSTRY ANALYSIS')
    console.log('-'.repeat(80))

    const industries = await getIndustryScores()

    industries.forEach((industry) => {
      console.log(`\n${industry.industry} (${industry.description})`)
      console.log(`  Avg Score: ${industry.avgScore}/100`)
      console.log(`  Boards: ${industry.boardCount}`)
      console.log(`  Jobs: ${industry.jobCount}`)
      console.log(`  Top Role: ${industry.topRole}`)
      console.log(`  Top Boards:`)
      industry.boards.slice(0, 3).forEach((board) => {
        console.log(`    • ${board.name}: ${board.score}`)
      })
    })

    console.log()

    // Hiring velocity
    console.log('⚡ HIRING VELOCITY & DEMAND')
    console.log('-'.repeat(80))

    const velocity = await getRoleHiringVelocity()

    const highDemand = velocity.filter((r) => r.demandLevel === 'High')
    const mediumDemand = velocity.filter((r) => r.demandLevel === 'Medium')
    const lowDemand = velocity.filter((r) => r.demandLevel === 'Low')

    console.log(`\nHigh Demand Roles (${highDemand.length}):`)
    highDemand.slice(0, 5).forEach((role) => {
      console.log(
        `  • ${role.roleFamily}: ${role.jobCount} jobs, ${role.newJobsPerDay.toFixed(1)}/day`
      )
    })

    console.log(`\nMedium Demand Roles (${mediumDemand.length}):`)
    mediumDemand.slice(0, 5).forEach((role) => {
      console.log(
        `  • ${role.roleFamily}: ${role.jobCount} jobs, ${role.newJobsPerDay.toFixed(1)}/day`
      )
    })

    console.log()

    // Recommendations
    console.log('💡 ROLE-SPECIFIC RECOMMENDATIONS')
    console.log('-'.repeat(80))

    const recommendations = await getRoleRecommendations()

    recommendations.slice(0, 5).forEach((rec) => {
      console.log(`\n${rec.role}:`)
      console.log(`  Avg Score: ${rec.avgScore}/100`)
      console.log(`  Recommendation: ${rec.recommendation}`)
    })

    // Summary insights
    console.log()
    console.log('='.repeat(80))
    console.log('📊 KEY INSIGHTS')
    console.log('-'.repeat(80))

    const avgRoleScore = roles.reduce((sum, r) => sum + r.avgScore, 0) / roles.length
    const bestRole = roles[0]
    const worstRole = roles[roles.length - 1]

    console.log(`\n✅ Role-based insights:`)
    console.log(`   • Average role score across all families: ${Math.round(avgRoleScore)}`)
    console.log(`   • Best role: ${bestRole.roleFamily} (${bestRole.avgScore}, ${bestRole.jobCount} jobs)`)
    console.log(`   • Most challenging role: ${worstRole.roleFamily} (${worstRole.avgScore}, ${worstRole.jobCount} jobs)`)

    const avgIndustryScore =
      industries.reduce((sum, i) => sum + i.avgScore, 0) / industries.length
    const bestIndustry = industries[0]

    console.log(`\n🏭 Industry-based insights:`)
    console.log(`   • Average industry score: ${Math.round(avgIndustryScore)}`)
    console.log(`   • Best performing industry: ${bestIndustry.industry} (${bestIndustry.avgScore})`)
    console.log(`   • Total industries tracked: ${industries.length}`)

    const totalJobs = roles.reduce((sum, r) => sum + r.jobCount, 0)
    const avgJobsPerRole = Math.round(totalJobs / roles.length)

    console.log(`\n📈 Market dynamics:`)
    console.log(`   • Total jobs listed: ${totalJobs}`)
    console.log(`   • Average jobs per role: ${avgJobsPerRole}`)
    console.log(`   • High demand roles: ${highDemand.length}`)
    console.log(`   • Market concentration: Top 10 roles account for ${Math.round((roles.slice(0, 10).reduce((sum, r) => sum + r.jobCount, 0) / totalJobs) * 100)}% of jobs`)

    console.log()
    console.log('='.repeat(80))
    console.log('✅ Analysis complete!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal error during analysis', error as Error)
    process.exit(1)
  }
}

analyzeDimensions()
