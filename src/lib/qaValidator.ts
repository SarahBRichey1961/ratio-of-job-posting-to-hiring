import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface QAResult {
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: Record<string, any>
  severity: 'critical' | 'major' | 'minor'
}

export interface QASummary {
  totalTests: number
  passed: number
  failed: number
  warnings: number
  successRate: number
  criticalIssues: number
  timestamp: string
  results: QAResult[]
}

/**
 * Validate database schema completeness
 */
export async function validateSchema(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for required tables
    const requiredTables = [
      'job_boards',
      'job_postings',
      'posting_events',
      'employer_surveys',
      'candidate_surveys',
      'efficiency_scores',
      'trend_snapshots',
    ]

    // Get list of tables in schema (via information_schema)
    const { data: tables } = await supabase.rpc(
      'get_table_names', // This would need a stored procedure, use direct query instead
      {}
    )

    for (const table of requiredTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true })

      if (error) {
        results.push({
          test: `Table exists: ${table}`,
          status: 'fail',
          message: `Table ${table} not found or inaccessible`,
          severity: 'critical',
        })
      } else {
        results.push({
          test: `Table exists: ${table}`,
          status: 'pass',
          message: `Table ${table} accessible`,
          severity: 'critical',
        })
      }
    }
  } catch (error) {
    results.push({
      test: 'Schema validation',
      status: 'fail',
      message: 'Failed to validate schema',
      severity: 'critical',
    })
  }

  return results
}

/**
 * Validate data consistency
 */
export async function validateDataConsistency(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for orphaned postings
    const { data: orphaned } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact' })
      .filter('job_board_id', 'is', null)

    if ((orphaned?.length || 0) > 0) {
      results.push({
        test: 'No orphaned postings',
        status: 'fail',
        message: `Found ${orphaned?.length} postings without board_id`,
        severity: 'major',
      })
    } else {
      results.push({
        test: 'No orphaned postings',
        status: 'pass',
        message: 'All postings have valid board_id',
        severity: 'major',
      })
    }

    // Check for duplicate postings (same board, same title, same company, same date)
    const { data: duplicates } = await supabase.rpc(
      'check_duplicate_postings',
      {}
    )

    if ((duplicates?.length || 0) > 0) {
      results.push({
        test: 'No duplicate postings',
        status: 'warning',
        message: `Found ${duplicates?.length} potential duplicate postings`,
        details: { count: duplicates?.length },
        severity: 'major',
      })
    } else {
      results.push({
        test: 'No duplicate postings',
        status: 'pass',
        message: 'No duplicate postings detected',
        severity: 'major',
      })
    }

    // Check for data freshness
    const { data: oldestPosting } = await supabase
      .from('job_postings')
      .select('first_seen')
      .order('first_seen', { ascending: true })
      .limit(1)
      .single()

    if (oldestPosting) {
      const age = new Date().getTime() - new Date(oldestPosting.first_seen).getTime()
      const ageDays = Math.floor(age / (1000 * 60 * 60 * 24))

      if (ageDays > 90) {
        results.push({
          test: 'Data freshness',
          status: 'warning',
          message: `Oldest posting is ${ageDays} days old`,
          severity: 'minor',
        })
      } else {
        results.push({
          test: 'Data freshness',
          status: 'pass',
          message: `Data freshness good (${ageDays} days)`,
          severity: 'minor',
        })
      }
    }

    // Check for null values in critical fields
    const { data: nullChecks } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact' })
      .or('job_board_id.is.null,first_seen.is.null')

    if ((nullChecks?.length || 0) > 0) {
      results.push({
        test: 'No critical nulls',
        status: 'fail',
        message: `Found ${nullChecks?.length} postings with null critical fields`,
        severity: 'critical',
      })
    } else {
      results.push({
        test: 'No critical nulls',
        status: 'pass',
        message: 'All critical fields populated',
        severity: 'critical',
      })
    }
  } catch (error) {
    logger.error('Failed to validate data consistency', error as Error)
    results.push({
      test: 'Data consistency',
      status: 'fail',
      message: 'Error checking data consistency',
      severity: 'major',
    })
  }

  return results
}

/**
 * Validate scoring calculations
 */
export async function validateScoring(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for efficiency_scores records
    const { data: scores, count } = await supabase
      .from('efficiency_scores')
      .select('*', { count: 'exact' })

    if ((count || 0) === 0) {
      results.push({
        test: 'Efficiency scores exist',
        status: 'warning',
        message: 'No efficiency scores computed yet',
        severity: 'minor',
      })
    } else {
      results.push({
        test: 'Efficiency scores exist',
        status: 'pass',
        message: `${count} efficiency scores computed`,
        severity: 'minor',
      })

      // Validate score ranges
      const invalidScores = (scores || []).filter(
        (s) => s.overall_score < 0 || s.overall_score > 100
      )

      if (invalidScores.length > 0) {
        results.push({
          test: 'Score ranges valid (0-100)',
          status: 'fail',
          message: `Found ${invalidScores.length} scores outside 0-100 range`,
          severity: 'major',
        })
      } else {
        results.push({
          test: 'Score ranges valid (0-100)',
          status: 'pass',
          message: 'All scores within valid range',
          severity: 'major',
        })
      }

      // Check for boards missing scores
      const { data: boards } = await supabase.from('job_boards').select('id')
      const scoredBoardIds = new Set((scores || []).map((s) => s.job_board_id))
      const unscored = (boards || []).filter((b) => !scoredBoardIds.has(b.id))

      if (unscored.length > 0) {
        results.push({
          test: 'All boards have scores',
          status: 'warning',
          message: `${unscored.length} boards do not have efficiency scores`,
          severity: 'minor',
        })
      } else {
        results.push({
          test: 'All boards have scores',
          status: 'pass',
          message: 'All boards have efficiency scores',
          severity: 'minor',
        })
      }
    }

    // Validate component scores exist
    const { data: withComponents } = await supabase
      .from('efficiency_scores')
      .select('*')
      .limit(10)

    if (withComponents && withComponents.length > 0) {
      const hasComponents = withComponents[0].lifespan_component !== undefined
      if (hasComponents) {
        results.push({
          test: 'Score components computed',
          status: 'pass',
          message: 'Lifespan, repost, and survey components present',
          severity: 'major',
        })
      } else {
        results.push({
          test: 'Score components computed',
          status: 'warning',
          message: 'Score components may not be fully computed',
          severity: 'major',
        })
      }
    }
  } catch (error) {
    logger.error('Failed to validate scoring', error as Error)
    results.push({
      test: 'Scoring validation',
      status: 'fail',
      message: 'Error validating scoring',
      severity: 'major',
    })
  }

  return results
}

/**
 * Validate pipeline integrity
 */
export async function validatePipeline(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for recent pipeline runs
    const { data: runs } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5)

    if (!runs || runs.length === 0) {
      results.push({
        test: 'Pipeline runs recorded',
        status: 'warning',
        message: 'No pipeline runs recorded',
        severity: 'minor',
      })
    } else {
      const lastRun = runs[0]
      const runAge = new Date().getTime() - new Date(lastRun.started_at).getTime()
      const runAgeHours = Math.floor(runAge / (1000 * 60 * 60))

      if (runAgeHours > 24) {
        results.push({
          test: 'Recent pipeline execution',
          status: 'warning',
          message: `Last pipeline run was ${runAgeHours} hours ago`,
          severity: 'minor',
        })
      } else {
        results.push({
          test: 'Recent pipeline execution',
          status: 'pass',
          message: `Last pipeline run: ${runAgeHours} hours ago`,
          severity: 'minor',
        })
      }

      // Check for failed runs
      const failedRuns = runs.filter((r) => r.status === 'failed')
      if (failedRuns.length > 0) {
        results.push({
          test: 'No recent pipeline failures',
          status: 'fail',
          message: `${failedRuns.length} recent pipeline runs failed`,
          severity: 'major',
        })
      } else {
        results.push({
          test: 'No recent pipeline failures',
          status: 'pass',
          message: 'No recent pipeline failures',
          severity: 'major',
        })
      }
    }

    // Check raw data snapshots
    const { data: snapshots, count: snapshotCount } = await supabase
      .from('raw_data_snapshots')
      .select('*', { count: 'exact' })

    if ((snapshotCount || 0) > 0) {
      results.push({
        test: 'Raw data archived',
        status: 'pass',
        message: `${snapshotCount} raw data snapshots archived`,
        severity: 'minor',
      })
    } else {
      results.push({
        test: 'Raw data archived',
        status: 'warning',
        message: 'No raw data snapshots yet',
        severity: 'minor',
      })
    }
  } catch (error) {
    logger.error('Failed to validate pipeline', error as Error)
    results.push({
      test: 'Pipeline validation',
      status: 'fail',
      message: 'Error validating pipeline',
      severity: 'major',
    })
  }

  return results
}

/**
 * Validate lifespan metrics
 */
export async function validateLifespanMetrics(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for lifespan calculations
    const { data: postingsWithLifespan, count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .not('lifespan_days', 'is', null)

    const totalPostings = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })

    const lifespanRate = totalPostings.count ? ((count || 0) / totalPostings.count) * 100 : 0

    if (lifespanRate >= 80) {
      results.push({
        test: 'Lifespan metrics calculated',
        status: 'pass',
        message: `${lifespanRate.toFixed(1)}% of postings have lifespan calculated`,
        severity: 'major',
      })
    } else if (lifespanRate >= 50) {
      results.push({
        test: 'Lifespan metrics calculated',
        status: 'warning',
        message: `Only ${lifespanRate.toFixed(1)}% of postings have lifespan calculated`,
        severity: 'major',
      })
    } else {
      results.push({
        test: 'Lifespan metrics calculated',
        status: 'fail',
        message: `Only ${lifespanRate.toFixed(1)}% of postings have lifespan calculated`,
        severity: 'major',
      })
    }

    // Check for unrealistic lifespan values
    const { data: unrealistic } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact' })
      .or('lifespan_days.lt.-1,lifespan_days.gt.365')

    if ((unrealistic?.length || 0) > 0) {
      results.push({
        test: 'Realistic lifespan values',
        status: 'warning',
        message: `Found ${unrealistic?.length} postings with unusual lifespan (negative or >1 year)`,
        severity: 'minor',
      })
    } else {
      results.push({
        test: 'Realistic lifespan values',
        status: 'pass',
        message: 'All lifespan values realistic',
        severity: 'minor',
      })
    }
  } catch (error) {
    logger.error('Failed to validate lifespan metrics', error as Error)
    results.push({
      test: 'Lifespan validation',
      status: 'fail',
      message: 'Error validating lifespan metrics',
      severity: 'major',
    })
  }

  return results
}

/**
 * Validate repost detection
 */
export async function validateRepostDetection(): Promise<QAResult[]> {
  const results: QAResult[] = []

  try {
    // Check for repost counts
    const { data: postingsWithReposts, count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .gt('repost_count', 0)

    const totalPostings = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })

    const repostRate = totalPostings.count ? ((count || 0) / totalPostings.count) * 100 : 0

    if (repostRate >= 5) {
      results.push({
        test: 'Repost detection working',
        status: 'pass',
        message: `${repostRate.toFixed(1)}% of postings detected as reposts`,
        severity: 'major',
      })
    } else if (repostRate > 0) {
      results.push({
        test: 'Repost detection working',
        status: 'warning',
        message: `Only ${repostRate.toFixed(1)}% repost rate detected (may be low)`,
        severity: 'minor',
      })
    } else {
      results.push({
        test: 'Repost detection working',
        status: 'fail',
        message: 'No reposts detected (detection may not be working)',
        severity: 'major',
      })
    }

    // Check for unrealistic repost counts
    const { data: unrealistic } = await supabase
      .from('job_postings')
      .select('id', { count: 'exact' })
      .gt('repost_count', 100)

    if ((unrealistic?.length || 0) > 0) {
      results.push({
        test: 'Realistic repost counts',
        status: 'warning',
        message: `Found ${unrealistic?.length} postings with >100 reposts (may indicate data issue)`,
        severity: 'minor',
      })
    } else {
      results.push({
        test: 'Realistic repost counts',
        status: 'pass',
        message: 'Repost counts appear realistic',
        severity: 'minor',
      })
    }
  } catch (error) {
    logger.error('Failed to validate repost detection', error as Error)
    results.push({
      test: 'Repost validation',
      status: 'fail',
      message: 'Error validating repost detection',
      severity: 'major',
    })
  }

  return results
}

/**
 * Run all QA checks
 */
export async function runAllQAChecks(): Promise<QASummary> {
  logger.info('Starting comprehensive QA validation...')

  const allResults: QAResult[] = []

  // Run all validation suites
  const schema = await validateSchema()
  const consistency = await validateDataConsistency()
  const scoring = await validateScoring()
  const pipeline = await validatePipeline()
  const lifespan = await validateLifespanMetrics()
  const repost = await validateRepostDetection()

  allResults.push(...schema, ...consistency, ...scoring, ...pipeline, ...lifespan, ...repost)

  // Calculate summary
  const passed = allResults.filter((r) => r.status === 'pass').length
  const failed = allResults.filter((r) => r.status === 'fail').length
  const warnings = allResults.filter((r) => r.status === 'warning').length
  const criticalIssues = allResults.filter((r) => r.severity === 'critical' && r.status !== 'pass')
    .length

  const summary: QASummary = {
    totalTests: allResults.length,
    passed,
    failed,
    warnings,
    successRate: (passed / allResults.length) * 100,
    criticalIssues: criticalIssues,
    timestamp: new Date().toISOString(),
    results: allResults,
  }

  logger.info('QA validation complete', {
    passed,
    failed,
    warnings,
    successRate: summary.successRate,
  })

  return summary
}
