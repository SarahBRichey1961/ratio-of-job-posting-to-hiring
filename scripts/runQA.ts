#!/usr/bin/env node

/**
 * Day 14 QA Validation Script
 * Comprehensive data validation and anomaly checking
 * 
 * Usage:
 *   npx ts-node scripts/runQA.ts
 */

import {
  runAllQAChecks,
  validateSchema,
  validateDataConsistency,
  validateScoring,
  validatePipeline,
  validateLifespanMetrics,
  validateRepostDetection,
} from '@/lib/qaValidator'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function runQA() {
  logger.info('Starting comprehensive QA validation...')
  console.log('\n' + '='.repeat(80))
  console.log('COMPREHENSIVE QA VALIDATION - END-TO-END SYSTEM CHECK')
  console.log('='.repeat(80) + '\n')

  try {
    // Run all QA checks
    const summary = await runAllQAChecks()

    // Display summary
    console.log('📊 QA SUMMARY')
    console.log('-'.repeat(80))
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`✅ Passed:   ${summary.passed} (${(summary.passed / summary.totalTests * 100).toFixed(1)}%)`)
    console.log(`❌ Failed:   ${summary.failed}`)
    console.log(`⚠️  Warnings: ${summary.warnings}`)
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%\n`)

    // Display by severity
    const critical = summary.results.filter((r) => r.severity === 'critical' && r.status !== 'pass')
    const major = summary.results.filter((r) => r.severity === 'major' && r.status !== 'pass')
    const minor = summary.results.filter((r) => r.severity === 'minor' && r.status !== 'pass')

    if (critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES (MUST FIX):')
      critical.forEach((r) => {
        console.log(`   ❌ ${r.test}: ${r.message}`)
      })
      console.log()
    }

    if (major.length > 0) {
      console.log('🟠 MAJOR ISSUES (SHOULD FIX):')
      major.forEach((r) => {
        const icon = r.status === 'fail' ? '❌' : '⚠️'
        console.log(`   ${icon} ${r.test}: ${r.message}`)
      })
      console.log()
    }

    if (minor.length > 0) {
      console.log('🟡 MINOR ISSUES (NICE TO FIX):')
      minor.slice(0, 5).forEach((r) => {
        const icon = r.status === 'fail' ? '❌' : '⚠️'
        console.log(`   ${icon} ${r.test}: ${r.message}`)
      })
      if (minor.length > 5) {
        console.log(`   ... and ${minor.length - 5} more minor issues`)
      }
      console.log()
    }

    // Display detailed results by category
    console.log('='.repeat(80))
    console.log('DETAILED RESULTS BY CATEGORY')
    console.log('='.repeat(80) + '\n')

    const categories: Record<string, typeof summary.results> = {}
    summary.results.forEach((r) => {
      const category = r.test.split(':')[0].split('(')[0].trim()
      if (!categories[category]) categories[category] = []
      categories[category].push(r)
    })

    Object.entries(categories).forEach(([category, results]) => {
      const passed = results.filter((r) => r.status === 'pass').length
      const failed = results.filter((r) => r.status === 'fail').length
      const warned = results.filter((r) => r.status === 'warning').length
      const total = results.length

      console.log(`📋 ${category} (${passed}/${total} passed)`)
      results.forEach((r) => {
        const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️'
        console.log(`   ${icon} ${r.test}`)
        if (r.status !== 'pass') {
          console.log(`      → ${r.message}`)
        }
      })
      console.log()
    })

    // Final assessment
    console.log('='.repeat(80))
    console.log('🎯 FINAL ASSESSMENT')
    console.log('-'.repeat(80))

    if (summary.criticalIssues === 0 && summary.failed === 0) {
      console.log('\n✅ SYSTEM READY FOR FRONTEND INTEGRATION')
      console.log('\nAll critical and major issues resolved. System is stable and data integrity')
      console.log('is verified. You can proceed with Days 15-21 (Frontend Dashboard build).\n')
    } else if (summary.criticalIssues === 0) {
      console.log('\n⚠️  PROCEED WITH CAUTION TO FRONTEND')
      console.log(`\nNo critical issues found, but ${summary.failed} failures detected.`)
      console.log('Recommend addressing major issues before full frontend integration.\n')
    } else {
      console.log('\n🚫 SYSTEM NOT READY FOR FRONTEND')
      console.log(`\n${summary.criticalIssues} CRITICAL issue(s) must be fixed before proceeding.`)
      console.log('These issues could compromise data integrity or system reliability.\n')
    }

    // Readiness checklist
    console.log('📋 READINESS FOR DAY 15 (FRONTEND DASHBOARD):')
    console.log('-'.repeat(80))
    console.log(`   [${summary.criticalIssues === 0 ? '✓' : '✗'}] No critical data integrity issues`)
    console.log(`   [${summary.failed === 0 ? '✓' : '✗'}] All scoring calculations validated`)
    console.log(`   [${summary.results.filter((r) => r.test.includes('Pipeline')).some((r) => r.status === 'pass') ? '✓' : '✗'}] Pipeline working or mockable`)
    console.log(`   [${summary.results.filter((r) => r.test.includes('Lifespan')).some((r) => r.status === 'pass') ? '✓' : '✗'}] Lifespan metrics calculated`)
    console.log(`   [${summary.results.filter((r) => r.test.includes('Repost')).some((r) => r.status === 'pass') ? '✓' : '✗'}] Repost detection working`)

    console.log()
    console.log('='.repeat(80))
    console.log('✅ QA validation complete!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal error during QA validation', error as Error)
    console.error('\n❌ QA validation failed with error:', error)
    process.exit(1)
  }
}

runQA()
