#!/usr/bin/env node

/**
 * Day 8 Data Pipeline Script
 * Run the daily data pipeline manually for testing
 * 
 * Usage:
 *   npx ts-node scripts/runPipeline.ts
 *   npx ts-node scripts/runPipeline.ts --dry-run
 */

import { DataPipelineOrchestrator } from '@/lib/pipelineOrchestrator'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function runPipeline() {
  console.log('\n' + '='.repeat(80))
  console.log('DATA PIPELINE EXECUTION')
  console.log('='.repeat(80) + '\n')

  const startTime = Date.now()

  try {
    const orchestrator = new DataPipelineOrchestrator()
    const result = await orchestrator.runPipeline()

    console.log('\n' + '-'.repeat(80))
    console.log('PIPELINE RESULT')
    console.log('-'.repeat(80) + '\n')

    console.log(`Run ID: ${result.runId}`)
    console.log(`Status: ${result.status.toUpperCase()}`)
    console.log()

    console.log('📊 JOB SUMMARY')
    console.log(`  Total Jobs: ${result.totalJobs}`)
    console.log(`  Completed: ${result.completedJobs}`)
    console.log(`  Failed: ${result.failedJobs}`)
    console.log()

    if (result.completedJobs > 0) {
      const successRate =
        ((result.completedJobs / result.totalJobs) * 100).toFixed(1)
      console.log(`✅ Success Rate: ${successRate}%`)
    }

    if (result.errors.length > 0) {
      console.log('\n⚠️  ERRORS:')
      result.errors.forEach((error) => {
        console.log(`  • ${error}`)
      })
    }

    const duration = result.duration / 1000
    console.log(`\n⏱️  Duration: ${duration.toFixed(2)}s`)

    console.log('\n' + '='.repeat(80))
    if (result.status === 'completed') {
      console.log('✅ Pipeline completed successfully!')
    } else if (result.status === 'partial') {
      console.log('⚠️  Pipeline completed with errors')
    } else {
      console.log('❌ Pipeline failed')
    }
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    logger.error('Fatal pipeline error', error as Error)
    console.error('\n❌ Pipeline failed with fatal error')
    console.error((error as Error).message)
    process.exit(1)
  }
}

runPipeline()
