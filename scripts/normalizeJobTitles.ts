#!/usr/bin/env node

/**
 * Day 5 Title Normalization Script
 * Normalize all job posting titles in the database
 * 
 * Usage:
 *   npx ts-node scripts/normalizeJobTitles.ts
 */

import { supabase } from '@/lib/supabase'
import { normalizeJobTitle, getRoleFamilyStats } from '@/lib/titleNormalization'
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)

async function normalizeAllJobTitles() {
  logger.info('Starting job title normalization...')

  try {
    // Get all job postings
    const { data: postings, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title')

    if (fetchError) throw fetchError

    if (!postings || postings.length === 0) {
      logger.info('No job postings found')
      return
    }

    logger.info(`Found ${postings.length} job postings to normalize`)

    // Normalize titles and prepare updates
    const updates = postings.map((posting) => ({
      id: posting.id,
      normalized_title: normalizeJobTitle(posting.title),
    }))

    // Update in batches
    const batchSize = 100
    let totalUpdated = 0

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      const { error: updateError, count } = await supabase
        .from('job_postings')
        .upsert(batch)

      if (updateError) {
        logger.error('Batch update error:', updateError as Error)
      } else {
        totalUpdated += count || batch.length
        logger.info(`Updated batch ${Math.floor(i / batchSize) + 1}`, {
          count: count || batch.length,
        })
      }
    }

    logger.info(`✅ Successfully normalized ${totalUpdated} job titles`)

    // Get statistics
    const { data: allPostings } = await supabase
      .from('job_postings')
      .select('normalized_title')

    if (allPostings && allPostings.length > 0) {
      const titles = allPostings.map((p) => p.normalized_title || 'unknown')
      const stats = getRoleFamilyStats(titles)

      console.log('\n📊 ROLE FAMILY DISTRIBUTION')
      console.log('='.repeat(60))

      Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([family, count]) => {
          const percentage = ((count / titles.length) * 100).toFixed(1)
          console.log(`${family.padEnd(25)} : ${count.toString().padStart(5)} (${percentage}%)`)
        })

      console.log('='.repeat(60))
      console.log(`Total job postings: ${titles.length}`)
    }
  } catch (error) {
    logger.error('Fatal error during normalization', error as Error)
    process.exit(1)
  }
}

normalizeAllJobTitles()
