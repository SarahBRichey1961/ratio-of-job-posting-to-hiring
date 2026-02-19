import { Logger } from './logging/logger'
import {
  createPipelineJob,
  updatePipelineJobStatus,
  createRawDataSnapshot,
  createPipelineRunLog,
  updatePipelineRunStatus,
} from './pipeline'
import { LifespanScraper } from './logging/lifespanScraper'
import { getJobBoards } from './jobBoards'
import { bulkUpdateAllLifespans } from './lifespanTracking'
import { bulkDetectAllReposts } from './repostDetection'

const logger = new Logger('logs')

/**
 * Orchestrate the daily data pipeline
 * Sequence:
 * 1. Run all scrapers for active boards
 * 2. Record raw data snapshots
 * 3. Update posting lifespans
 * 4. Detect reposts
 * 5. Generate metrics
 */
export class DataPipelineOrchestrator {
  private runId: string
  private startTime: Date
  private jobs: any[] = []
  private errors: string[] = []

  constructor(runId?: string) {
    this.runId = runId || `run-${Date.now()}`
    this.startTime = new Date()
  }

  /**
   * Run the complete pipeline
   */
  async runPipeline(): Promise<{
    runId: string
    status: string
    totalJobs: number
    completedJobs: number
    failedJobs: number
    duration: number
    errors: string[]
  }> {
    try {
      logger.info(`Starting pipeline run: ${this.runId}`)

      // Create run log
      const runLog = await createPipelineRunLog(this.runId)
      if (!runLog) throw new Error('Failed to create run log')

      // Phase 1: Scraping
      logger.info('Phase 1: Running scrapers...')
      const scrapingResult = await this.runScrapingPhase()

      // Phase 2: Raw snapshots
      logger.info('Phase 2: Creating data snapshots...')
      const snapshotResult = await this.recordRawSnapshots()

      // Phase 3: Lifespan tracking
      logger.info('Phase 3: Updating lifespans...')
      const lifespanResult = await this.updateLifespans()

      // Phase 4: Repost detection
      logger.info('Phase 4: Detecting reposts...')
      const repostResult = await this.detectReposts()

      // Phase 5: Compute metrics
      logger.info('Phase 5: Computing metrics...')
      const metricsResult = await this.computeMetrics()

      // Update run log with final status
      const totalJobs = this.jobs.length
      const completedJobs = this.jobs.filter((j) => j.status === 'completed').length
      const failedJobs = this.jobs.filter((j) => j.status === 'failed').length

      const status =
        failedJobs === 0 ? 'completed' : failedJobs === totalJobs ? 'failed' : 'partial'

      await updatePipelineRunStatus(
        this.runId,
        status,
        totalJobs,
        completedJobs,
        failedJobs,
        this.errors
      )

      const duration = Date.now() - this.startTime.getTime()

      logger.info(
        `Pipeline complete: ${completedJobs}/${totalJobs} jobs succeeded`
      )

      return {
        runId: this.runId,
        status,
        totalJobs,
        completedJobs,
        failedJobs,
        duration,
        errors: this.errors,
      }
    } catch (error) {
      logger.error('Pipeline failed', error as Error)
      this.errors.push(`Fatal error: ${(error as Error).message}`)

      await updatePipelineRunStatus(
        this.runId,
        'failed',
        this.jobs.length,
        0,
        this.jobs.length,
        this.errors
      )

      return {
        runId: this.runId,
        status: 'failed',
        totalJobs: this.jobs.length,
        completedJobs: 0,
        failedJobs: this.jobs.length,
        duration: Date.now() - this.startTime.getTime(),
        errors: this.errors,
      }
    }
  }

  /**
   * Phase 1: Run all scrapers
   */
  private async runScrapingPhase(): Promise<any> {
    try {
      const boards = await getJobBoards()
      let scrapedCount = 0
      let newCount = 0

      for (const board of boards) {
        const job = await createPipelineJob('scrape', board.id, board.name)
        if (!job) continue

        try {
          await updatePipelineJobStatus(job.id!, 'running')

          // TODO: Run actual scraper for this board
          // For now, create placeholder result
          const result = {
            jobBoardId: board.id,
            jobsScraped: 0,
            newJobs: 0,
          }

          await updatePipelineJobStatus(job.id!, 'completed', result)

          this.jobs.push({
            ...job,
            status: 'completed',
            result,
          })

          scrapedCount += result.jobsScraped
          newCount += result.newJobs
        } catch (error) {
          const errorMsg = `Scraper failed for ${board.name}`
          logger.error(errorMsg, error as Error)
          this.errors.push(errorMsg)

          await updatePipelineJobStatus(job.id!, 'failed', undefined, errorMsg)

          this.jobs.push({
            ...job,
            status: 'failed',
            error: errorMsg,
          })
        }
      }

      return { scrapedCount, newCount }
    } catch (error) {
      logger.error('Scraping phase failed', error as Error)
      this.errors.push(`Scraping phase error: ${(error as Error).message}`)
      return { scrapedCount: 0, newCount: 0 }
    }
  }

  /**
   * Phase 2: Record raw data snapshots
   */
  private async recordRawSnapshots(): Promise<any> {
    try {
      const boards = await getJobBoards()
      let snapshotCount = 0

      for (const board of boards) {
        const job = await createPipelineJob(
          'normalize',
          board.id,
          board.name
        )
        if (!job) continue

        try {
          await updatePipelineJobStatus(job.id!, 'running')

          // TODO: Create actual snapshot with posting data
          // For now, placeholder
          const snapshot = {
            jobBoardId: board.id,
            boardName: board.name,
            snapshotDate: new Date(),
            postingCount: 0,
            newPostings: 0,
            activePostings: 0,
            disappearedPostings: 0,
            repostCount: 0,
            data: { postings: [], stats: {} },
          }

          await createRawDataSnapshot(snapshot)
          await updatePipelineJobStatus(job.id!, 'completed', {
            snapshotDate: snapshot.snapshotDate,
          })

          this.jobs.push({
            ...job,
            status: 'completed',
          })

          snapshotCount++
        } catch (error) {
          const errorMsg = `Snapshot failed for ${board.name}`
          logger.error(errorMsg, error as Error)
          this.errors.push(errorMsg)

          await updatePipelineJobStatus(job.id!, 'failed', undefined, errorMsg)

          this.jobs.push({
            ...job,
            status: 'failed',
            error: errorMsg,
          })
        }
      }

      return { snapshotCount }
    } catch (error) {
      logger.error('Snapshot phase failed', error as Error)
      this.errors.push(`Snapshot phase error: ${(error as Error).message}`)
      return { snapshotCount: 0 }
    }
  }

  /**
   * Phase 3: Update posting lifespans
   */
  private async updateLifespans(): Promise<any> {
    try {
      const job = await createPipelineJob('lifespan')
      if (!job) return { updated: 0, failed: 0 }

      await updatePipelineJobStatus(job.id!, 'running')

      const result = await bulkUpdateAllLifespans()

      await updatePipelineJobStatus(job.id!, 'completed', result)

      this.jobs.push({
        ...job,
        status: 'completed',
        result,
      })

      return result
    } catch (error) {
      const errorMsg = `Lifespan update failed: ${(error as Error).message}`
      logger.error(errorMsg, error as Error)
      this.errors.push(errorMsg)

      return { updated: 0, failed: 0 }
    }
  }

  /**
   * Phase 4: Detect reposts
   */
  private async detectReposts(): Promise<any> {
    try {
      const job = await createPipelineJob('repost')
      if (!job) return { detected: 0, updated: 0, failed: 0 }

      await updatePipelineJobStatus(job.id!, 'running')

      const result = await bulkDetectAllReposts()

      await updatePipelineJobStatus(job.id!, 'completed', result)

      this.jobs.push({
        ...job,
        status: 'completed',
        result,
      })

      return result
    } catch (error) {
      const errorMsg = `Repost detection failed: ${(error as Error).message}`
      logger.error(errorMsg, error as Error)
      this.errors.push(errorMsg)

      return { detected: 0, updated: 0, failed: 0 }
    }
  }

  /**
   * Phase 5: Compute metrics and aggregations
   */
  private async computeMetrics(): Promise<any> {
    try {
      const job = await createPipelineJob('score')
      if (!job) return { metricsComputed: 0 }

      await updatePipelineJobStatus(job.id!, 'running')

      // TODO: Compute efficiency scores (Day 11)
      // For now, placeholder

      await updatePipelineJobStatus(job.id!, 'completed', {
        metricsComputed: 1,
      })

      this.jobs.push({
        ...job,
        status: 'completed',
      })

      return { metricsComputed: 1 }
    } catch (error) {
      const errorMsg = `Metrics computation failed: ${(error as Error).message}`
      logger.error(errorMsg, error as Error)
      this.errors.push(errorMsg)

      return { metricsComputed: 0 }
    }
  }
}

/**
 * Schedule pipeline to run on a cron schedule
 * Can be called by a cron job (e.g., node-cron, Vercel Crons, AWS Lambda)
 */
export async function schedulePipelineRun(): Promise<any> {
  const orchestrator = new DataPipelineOrchestrator()
  return orchestrator.runPipeline()
}
