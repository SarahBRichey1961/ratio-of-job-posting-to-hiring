#!/usr/bin/env node

/**
 * Day 4 Scraper Runner
 * Run this script to test the scraper framework and collect job listings
 * 
 * Usage:
 *   npx ts-node scripts/scrapers/runScrapers.ts
 *   npx ts-node scripts/scrapers/runScrapers.ts --board "Indeed"
 *   npx ts-node scripts/scrapers/runScrapers.ts --all
 */

import { IndeedScraper, LinkedInScraper, ZipRecruiterScraper, StackOverflowScraper } from '@/scrapers/implementations'
import { Logger, LogLevel } from '@/lib/logging/logger'
import { getEnabledScrapers } from '@/scrapers/config'

const logger = new Logger('logs', LogLevel.INFO)

async function runAllScrapers() {
  logger.info('Starting all enabled scrapers...')

  const scrapers = [
    new IndeedScraper(),
    new ZipRecruiterScraper(),
    new StackOverflowScraper(),
  ]

  const results = []

  for (const scraper of scrapers) {
    try {
      logger.info(`Running ${scraper['jobBoardName']}...`)
      const result = await scraper.run()
      results.push(result)
      logger.info(`${scraper['jobBoardName']} completed`, result)
    } catch (error) {
      logger.error(`Failed to run scraper`, error as Error)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SCRAPING SUMMARY')
  console.log('='.repeat(60))

  let totalScraped = 0
  let totalNew = 0
  let totalErrors = 0

  results.forEach((result) => {
    console.log(
      `\n${result.jobBoardName}:`
    )
    console.log(`  Jobs Scraped: ${result.jobsScraped}`)
    console.log(`  New Jobs: ${result.newJobs}`)
    console.log(`  Duration: ${result.duration}ms`)
    console.log(`  Errors: ${result.errors.length}`)

    totalScraped += result.jobsScraped
    totalNew += result.newJobs
    totalErrors += result.errors.length
  })

  console.log('\n' + '-'.repeat(60))
  console.log(`TOTAL JOBS SCRAPED: ${totalScraped}`)
  console.log(`TOTAL NEW JOBS: ${totalNew}`)
  console.log(`TOTAL ERRORS: ${totalErrors}`)
  console.log('-'.repeat(60))
  console.log(`\nLog file: ${logger.getLogFile()}`)
}

async function runSingleScraper(boardName: string) {
  logger.info(`Running scraper for ${boardName}...`)

  let scraper

  switch (boardName.toLowerCase()) {
    case 'indeed':
      scraper = new IndeedScraper()
      break
    case 'ziprecruiter':
      scraper = new ZipRecruiterScraper()
      break
    case 'stackoverflow':
      scraper = new StackOverflowScraper()
      break
    default:
      logger.error(`Scraper not found for board: ${boardName}`, new Error('Board not found'))
      return
  }

  const result = await scraper.run()
  logger.info(`${boardName} scraping complete`, result)
}

// Main
const args = process.argv.slice(2)
const boardArg = args.find((arg) => arg.startsWith('--board='))?.split('=')[1] || null

if (boardArg) {
  runSingleScraper(boardArg).catch((error) =>
    logger.error('Fatal error', error)
  )
} else {
  runAllScrapers().catch((error) => logger.error('Fatal error', error))
}
