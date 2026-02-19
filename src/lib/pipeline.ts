import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface PipelineJob {
  id?: string
  jobType: 'scrape' | 'normalize' | 'lifespan' | 'repost' | 'score'
  boardId?: number
  boardName?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  error?: string
  result?: any
}

export interface RawDataSnapshot {
  id?: string
  jobBoardId: number
  boardName: string
  snapshotDate: Date
  postingCount: number
  newPostings: number
  activePostings: number
  disappearedPostings: number
  repostCount: number
  data: {
    postings: any[]
    stats: any
  }
}

export interface PipelineRunLog {
  id?: string
  runId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'partial' | 'failed'
  totalJobs: number
  completedJobs: number
  failedJobs: number
  jobs: PipelineJob[]
  errors: string[]
}

/**
 * Create a new pipeline job
 */
export async function createPipelineJob(
  jobType: string,
  boardId?: number,
  boardName?: string
): Promise<PipelineJob | null> {
  try {
    const job: any = {
      job_type: jobType,
      status: 'pending',
      created_at: new Date(),
    }

    if (boardId) job.job_board_id = boardId
    if (boardName) job.board_name = boardName

    const { data, error } = await supabase
      .from('pipeline_jobs')
      .insert(job)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      jobType: data.job_type,
      boardId: data.job_board_id,
      boardName: data.board_name,
      status: data.status,
    }
  } catch (error) {
    logger.error('Failed to create pipeline job', error as Error)
    return null
  }
}

/**
 * Update pipeline job status
 */
export async function updatePipelineJobStatus(
  jobId: string,
  status: string,
  result?: any,
  error?: string
): Promise<boolean> {
  try {
    const update: any = {
      status,
      updated_at: new Date(),
    }

    if (result) update.result = result
    if (error) update.error = error
    if (status === 'running') update.started_at = new Date()
    if (status === 'completed' || status === 'failed')
      update.completed_at = new Date()

    const { error: updateError } = await supabase
      .from('pipeline_jobs')
      .update(update)
      .eq('id', jobId)

    if (updateError) throw updateError
    return true
  } catch (error) {
    logger.error('Failed to update job status', error as Error, { jobId })
    return false
  }
}

/**
 * Get pending jobs
 */
export async function getPendingJobs(): Promise<PipelineJob[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data || []).map((job) => ({
      id: job.id,
      jobType: job.job_type,
      boardId: job.job_board_id,
      boardName: job.board_name,
      status: job.status,
    }))
  } catch (error) {
    logger.error('Failed to get pending jobs', error as Error)
    return []
  }
}

/**
 * Create raw data snapshot
 */
export async function createRawDataSnapshot(
  snapshot: RawDataSnapshot
): Promise<RawDataSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('raw_data_snapshots')
      .insert({
        job_board_id: snapshot.jobBoardId,
        board_name: snapshot.boardName,
        snapshot_date: snapshot.snapshotDate,
        posting_count: snapshot.postingCount,
        new_postings: snapshot.newPostings,
        active_postings: snapshot.activePostings,
        disappeared_postings: snapshot.disappearedPostings,
        repost_count: snapshot.repostCount,
        data: snapshot.data,
        created_at: new Date(),
      })
      .select()
      .single()

    if (error) throw error

    logger.info(`Created snapshot for board ${snapshot.boardId}`)

    return {
      id: data.id,
      jobBoardId: data.job_board_id,
      boardName: data.board_name,
      snapshotDate: new Date(data.snapshot_date),
      postingCount: data.posting_count,
      newPostings: data.new_postings,
      activePostings: data.active_postings,
      disappearedPostings: data.disappeared_postings,
      repostCount: data.repost_count,
      data: data.data,
    }
  } catch (error) {
    logger.error('Failed to create snapshot', error as Error, {
      boardId: snapshot.jobBoardId,
    })
    return null
  }
}

/**
 * Get latest snapshot for a board
 */
export async function getLatestSnapshot(
  jobBoardId: number
): Promise<RawDataSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('raw_data_snapshots')
      .select('*')
      .eq('job_board_id', jobBoardId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: data.id,
      jobBoardId: data.job_board_id,
      boardName: data.board_name,
      snapshotDate: new Date(data.snapshot_date),
      postingCount: data.posting_count,
      newPostings: data.new_postings,
      activePostings: data.active_postings,
      disappearedPostings: data.disappeared_postings,
      repostCount: data.repost_count,
      data: data.data,
    }
  } catch (error) {
    logger.error('Failed to get snapshot', error as Error, { jobBoardId })
    return null
  }
}

/**
 * Create pipeline run log
 */
export async function createPipelineRunLog(
  runId: string
): Promise<PipelineRunLog | null> {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .insert({
        run_id: runId,
        status: 'running',
        start_time: new Date(),
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        jobs: [],
        errors: [],
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      runId: data.run_id,
      startTime: new Date(data.start_time),
      status: data.status,
      totalJobs: data.total_jobs,
      completedJobs: data.completed_jobs,
      failedJobs: data.failed_jobs,
      jobs: data.jobs || [],
      errors: data.errors || [],
    }
  } catch (error) {
    logger.error('Failed to create pipeline run', error as Error)
    return null
  }
}

/**
 * Update pipeline run status
 */
export async function updatePipelineRunStatus(
  runId: string,
  status: string,
  totalJobs: number,
  completedJobs: number,
  failedJobs: number,
  errors?: string[]
): Promise<boolean> {
  try {
    const update: any = {
      status,
      total_jobs: totalJobs,
      completed_jobs: completedJobs,
      failed_jobs: failedJobs,
    }

    if (status === 'completed' || status === 'partial' || status === 'failed') {
      update.end_time = new Date()
    }

    if (errors && errors.length > 0) {
      update.errors = errors
    }

    const { error } = await supabase
      .from('pipeline_runs')
      .update(update)
      .eq('run_id', runId)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to update pipeline run', error as Error)
    return false
  }
}

/**
 * Get pipeline run history
 */
export async function getPipelineRunHistory(
  limit: number = 10
): Promise<PipelineRunLog[]> {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((run) => ({
      id: run.id,
      runId: run.run_id,
      startTime: new Date(run.start_time),
      endTime: run.end_time ? new Date(run.end_time) : undefined,
      status: run.status,
      totalJobs: run.total_jobs,
      completedJobs: run.completed_jobs,
      failedJobs: run.failed_jobs,
      jobs: run.jobs || [],
      errors: run.errors || [],
    }))
  } catch (error) {
    logger.error('Failed to get pipeline history', error as Error)
    return []
  }
}

/**
 * Get pipeline statistics (last 7 days)
 */
export async function getPipelineStats(): Promise<any> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .gte('start_time', sevenDaysAgo)
      .order('start_time', { ascending: false })

    if (error) throw error

    const runs = data || []
    const totalRuns = runs.length
    const successfulRuns = runs.filter((r) => r.status === 'completed').length
    const partialRuns = runs.filter((r) => r.status === 'partial').length
    const failedRuns = runs.filter((r) => r.status === 'failed').length

    const totalJobs = runs.reduce((sum, r) => sum + r.total_jobs, 0)
    const successJobs = runs.reduce((sum, r) => sum + r.completed_jobs, 0)
    const failedJobs = runs.reduce((sum, r) => sum + r.failed_jobs, 0)

    const avgDuration =
      runs.length > 0
        ? runs.reduce((sum, r) => {
            const duration =
              (new Date(r.end_time).getTime() -
                new Date(r.start_time).getTime()) /
              1000
            return sum + duration
          }, 0) / runs.length
        : 0

    return {
      period: '7 days',
      totalRuns,
      successfulRuns,
      partialRuns,
      failedRuns,
      successRate: totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : '0',
      totalJobs,
      successJobs,
      failedJobs,
      jobSuccessRate: totalJobs > 0 ? ((successJobs / totalJobs) * 100).toFixed(1) : '0',
      avgDurationSeconds: Math.round(avgDuration),
    }
  } catch (error) {
    logger.error('Failed to get pipeline stats', error as Error)
    return null
  }
}
