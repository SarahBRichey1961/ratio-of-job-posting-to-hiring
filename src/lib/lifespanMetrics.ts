import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface LifespanMetrics {
  boardId: number
  boardName: string
  avgLifespan: number
  medianLifespan: number
  p25Lifespan: number
  p75Lifespan: number
  minLifespan: number
  maxLifespan: number
  totalPostings: number
  activeDaysAvg: number // For active postings (still listed)
}

export interface LifespanTrend {
  date: Date
  boardId: number
  boardName: string
  avgLifespan: number
  postingCount: number
  newPostings: number
  disappearedPostings: number
}

export interface RoleFamilyLifespan {
  roleFamily: string
  avgLifespan: number
  medianLifespan: number
  totalPostings: number
  distinctBoards: number
  mostCommonBoard: string
}

export interface LifespanBucket {
  range: string
  min: number
  max: number
  count: number
  percentage: number
}

/**
 * Get lifespan metrics for a specific board
 */
export async function getBoardLifespanMetrics(
  jobBoardId: number
): Promise<LifespanMetrics | null> {
  try {
    const { data: board, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', jobBoardId)
      .single()

    if (boardError) throw boardError

    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('lifespan_days, disappeared, last_seen, first_seen')
      .eq('job_board_id', jobBoardId)
      .not('lifespan_days', 'is', null)

    if (error) throw error

    if (!postings || postings.length === 0) {
      return {
        boardId: jobBoardId,
        boardName: board.name,
        avgLifespan: 0,
        medianLifespan: 0,
        p25Lifespan: 0,
        p75Lifespan: 0,
        minLifespan: 0,
        maxLifespan: 0,
        totalPostings: 0,
        activeDaysAvg: 0,
      }
    }

    const lifespans = postings.map((p) => p.lifespan_days).sort((a, b) => a - b)
    const total = lifespans.length

    // Calculate percentiles
    const getPercentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1
      return arr[Math.max(0, index)]
    }

    // Calculate average days active for still-active postings
    const activePostings = postings.filter((p) => !p.disappeared)
    let activeDaysAvg = 0

    if (activePostings.length > 0) {
      const now = new Date()
      const activeDays = activePostings.map((p) => {
        const firstSeen = new Date(p.first_seen)
        return Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24))
      })
      activeDaysAvg =
        activeDays.reduce((a, b) => a + b, 0) / activeDays.length
    }

    return {
      boardId: jobBoardId,
      boardName: board.name,
      avgLifespan: Math.round(lifespans.reduce((a, b) => a + b, 0) / total * 10) / 10,
      medianLifespan: lifespans[Math.floor(total / 2)],
      p25Lifespan: getPercentile(lifespans, 25),
      p75Lifespan: getPercentile(lifespans, 75),
      minLifespan: lifespans[0],
      maxLifespan: lifespans[total - 1],
      totalPostings: postings.length,
      activeDaysAvg: Math.round(activeDaysAvg),
    }
  } catch (error) {
    logger.error('Failed to get board lifespan metrics', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Get lifespan metrics for all boards
 */
export async function getAllBoardsLifespanMetrics(): Promise<LifespanMetrics[]> {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id')

    if (boardsError) throw boardsError

    const metrics: LifespanMetrics[] = []

    for (const board of boards || []) {
      const boardMetrics = await getBoardLifespanMetrics(board.id)
      if (boardMetrics && boardMetrics.totalPostings > 0) {
        metrics.push(boardMetrics)
      }
    }

    return metrics
  } catch (error) {
    logger.error('Failed to get all boards lifespan metrics', error as Error)
    return []
  }
}

/**
 * Get lifespan trends from raw data snapshots
 */
export async function getLifespanTrends(
  jobBoardId?: number,
  days: number = 30
): Promise<LifespanTrend[]> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let query = supabase
      .from('raw_data_snapshots')
      .select('*')
      .gte('snapshot_date', startDate)
      .order('snapshot_date', { ascending: true })

    if (jobBoardId) {
      query = query.eq('job_board_id', jobBoardId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((snapshot) => ({
      date: new Date(snapshot.snapshot_date),
      boardId: snapshot.job_board_id,
      boardName: snapshot.board_name,
      avgLifespan: 0, // Would be calculated from stored metrics
      postingCount: snapshot.posting_count,
      newPostings: snapshot.new_postings,
      disappearedPostings: snapshot.disappeared_postings,
    }))
  } catch (error) {
    logger.error('Failed to get lifespan trends', error as Error, { jobBoardId })
    return []
  }
}

/**
 * Get lifespan distribution buckets for a board
 */
export async function getLifespanDistribution(
  jobBoardId: number
): Promise<LifespanBucket[]> {
  try {
    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('lifespan_days')
      .eq('job_board_id', jobBoardId)
      .not('lifespan_days', 'is', null)

    if (error) throw error

    if (!postings || postings.length === 0) {
      return []
    }

    const buckets: LifespanBucket[] = [
      { range: '0-7 days', min: 0, max: 7, count: 0, percentage: 0 },
      { range: '8-14 days', min: 8, max: 14, count: 0, percentage: 0 },
      { range: '15-30 days', min: 15, max: 30, count: 0, percentage: 0 },
      { range: '31-60 days', min: 31, max: 60, count: 0, percentage: 0 },
      { range: '61-90 days', min: 61, max: 90, count: 0, percentage: 0 },
      { range: '90+ days', min: 91, max: Infinity, count: 0, percentage: 0 },
    ]

    // Count postings in each bucket
    postings.forEach((p) => {
      for (const bucket of buckets) {
        if (p.lifespan_days >= bucket.min && p.lifespan_days <= bucket.max) {
          bucket.count++
          break
        }
      }
    })

    // Calculate percentages
    const total = postings.length
    buckets.forEach((bucket) => {
      bucket.percentage = Math.round((bucket.count / total) * 100)
    })

    return buckets
  } catch (error) {
    logger.error('Failed to get lifespan distribution', error as Error, {
      jobBoardId,
    })
    return []
  }
}

/**
 * Get lifespan by role family
 */
export async function getLifespanByRoleFamily(
  limit: number = 20
): Promise<RoleFamilyLifespan[]> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('normalized_title, lifespan_days, job_board_id')
      .not('normalized_title', 'is', null)
      .not('lifespan_days', 'is', null)

    if (error) throw error

    if (!data || data.length === 0) {
      return []
    }

    // Group by role family
    const grouped: Record<string, any> = {}

    data.forEach((posting) => {
      const role = posting.normalized_title
      if (!grouped[role]) {
        grouped[role] = {
          lifespans: [],
          boards: new Set(),
        }
      }
      grouped[role].lifespans.push(posting.lifespan_days)
      grouped[role].boards.add(posting.job_board_id)
    })

    // Get board names for most common board
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    // Calculate metrics for each role family
    const results: RoleFamilyLifespan[] = Object.entries(grouped).map(
      ([role, data]) => {
        const lifespans = data.lifespans.sort((a: number, b: number) => a - b)
        const totalPostings = lifespans.length
        const avgLifespan =
          Math.round(
            (lifespans.reduce((a: number, b: number) => a + b, 0) / totalPostings) * 10
          ) / 10

        const medianIndex = Math.floor(totalPostings / 2)
        const medianLifespan = lifespans[medianIndex]

        // Find most common board
        const boardIds = Array.from(data.boards)
        const mostCommonBoard = boardMap.get(boardIds[0]) || 'Unknown'

        return {
          roleFamily: role,
          avgLifespan,
          medianLifespan,
          totalPostings,
          distinctBoards: boardIds.length,
          mostCommonBoard,
        }
      }
    )

    // Sort by average lifespan descending and return top N
    return results
      .sort((a, b) => b.avgLifespan - a.avgLifespan)
      .slice(0, limit)
  } catch (error) {
    logger.error('Failed to get lifespan by role family', error as Error)
    return []
  }
}

/**
 * Get lifespan ranking for all boards
 */
export async function getRankedBoardsByLifespan(): Promise<
  Array<LifespanMetrics & { rank: number }>
> {
  try {
    const metrics = await getAllBoardsLifespanMetrics()

    // Sort by average lifespan descending
    const sorted = metrics.sort((a, b) => b.avgLifespan - a.avgLifespan)

    // Add rank
    return sorted.map((m, idx) => ({
      ...m,
      rank: idx + 1,
    }))
  } catch (error) {
    logger.error('Failed to get ranked boards', error as Error)
    return []
  }
}

/**
 * Compare lifespan metrics between two boards
 */
export async function compareLifespans(
  boardId1: number,
  boardId2: number
): Promise<{ board1: LifespanMetrics | null; board2: LifespanMetrics | null }> {
  try {
    const [metrics1, metrics2] = await Promise.all([
      getBoardLifespanMetrics(boardId1),
      getBoardLifespanMetrics(boardId2),
    ])

    return { board1: metrics1, board2: metrics2 }
  } catch (error) {
    logger.error('Failed to compare lifespans', error as Error, {
      boardId1,
      boardId2,
    })
    return { board1: null, board2: null }
  }
}

/**
 * Get percentile ranking for a board
 */
export async function getBoardPercentileRank(boardId: number): Promise<{
  boardId: number
  boardName: string
  avgLifespan: number
  percentile: number
}> {
  try {
    const metrics = await getAllBoardsLifespanMetrics()
    const boardMetrics = metrics.find((m) => m.boardId === boardId)

    if (!boardMetrics) {
      return {
        boardId,
        boardName: 'Unknown',
        avgLifespan: 0,
        percentile: 0,
      }
    }

    const betterCount = metrics.filter(
      (m) => m.avgLifespan > boardMetrics.avgLifespan
    ).length
    const percentile =
      Math.round(((metrics.length - betterCount) / metrics.length) * 100 * 10) / 10

    return {
      boardId,
      boardName: boardMetrics.boardName,
      avgLifespan: boardMetrics.avgLifespan,
      percentile,
    }
  } catch (error) {
    logger.error('Failed to get percentile rank', error as Error, { boardId })
    return { boardId, boardName: 'Unknown', avgLifespan: 0, percentile: 0 }
  }
}
