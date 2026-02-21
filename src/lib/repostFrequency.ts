import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface RepostFrequencyMetrics {
  boardId: number
  boardName: string
  totalPostings: number
  totalReposts: number
  repostRate: number // percentage of postings that are reposts
  avgRepostsPerPosting: number
  maxRepostsForSinglePosting: number
  uniqueRepostedPostings: number
  repastedOffenders: number // postings reposted 3+ times
}

export interface RepostTrend {
  date: Date
  boardId: number
  boardName: string
  newRepostsDetected: number
  cumulativeReposts: number
  repostRateAtDate: number
}

export interface RoleRepostFrequency {
  roleFamily: string
  totalPostings: number
  repostedCount: number
  repostRate: number
  avgRepostsPerPosting: number
  distinctBoards: number
  worstBoard: string // most reposting for this role
}

export interface RepostDataPoint {
  postingId: string
  repostCount: number
  firstPostedOn: Date
  lastRepostedOn: Date
  daysBetweenFirstAndLast: number
  repostBoards: string[]
}

export interface RepostCluster {
  originalPostingId: string
  clusterSize: number
  cumulativeDaysActive: number
  boards: Array<{ boardId: number; boardName: string; firstSeen: Date }>
}

/**
 * Get repost frequency metrics for a specific board
 */
export async function getBoardRepostFrequency(
  jobBoardId: number
): Promise<RepostFrequencyMetrics | null> {
  try {
    const { data: board, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', jobBoardId)
      .single()

    if (boardError) throw boardError

    // Get all postings on this board
    const { data: postings, error: postingsError } = await supabase
      .from('job_postings')
      .select('id, repost_count, repost_cluster_id')
      .eq('job_board_id', jobBoardId)

    if (postingsError) throw postingsError

    if (!postings || postings.length === 0) {
      return {
        boardId: jobBoardId,
        boardName: board.name,
        totalPostings: 0,
        totalReposts: 0,
        repostRate: 0,
        avgRepostsPerPosting: 0,
        maxRepostsForSinglePosting: 0,
        uniqueRepostedPostings: 0,
        repastedOffenders: 0,
      }
    }

    const totalReposts = postings.reduce((sum, p) => sum + (p.repost_count || 0), 0)
    const repostedCount = postings.filter((p) => (p.repost_count || 0) > 0).length
    const repostRate = (repostedCount / postings.length) * 100
    const avgReposts = postings.length > 0 ? totalReposts / postings.length : 0
    const maxReposts = Math.max(...postings.map((p) => p.repost_count || 0), 0)
    const offendersCount = postings.filter((p) => (p.repost_count || 0) >= 3).length

    return {
      boardId: jobBoardId,
      boardName: board.name,
      totalPostings: postings.length,
      totalReposts,
      repostRate: Math.round(repostRate * 10) / 10,
      avgRepostsPerPosting: Math.round(avgReposts * 100) / 100,
      maxRepostsForSinglePosting: maxReposts,
      uniqueRepostedPostings: repostedCount,
      repastedOffenders: offendersCount,
    }
  } catch (error) {
    logger.error('Failed to get board repost frequency', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Get repost frequency metrics for all boards
 */
export async function getAllBoardsRepostFrequency(): Promise<RepostFrequencyMetrics[]> {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id')

    if (boardsError) throw boardsError

    const metrics: RepostFrequencyMetrics[] = []

    for (const board of boards || []) {
      const boardMetrics = await getBoardRepostFrequency(board.id)
      if (boardMetrics && boardMetrics.totalPostings > 0) {
        metrics.push(boardMetrics)
      }
    }

    return metrics
  } catch (error) {
    logger.error('Failed to get all boards repost frequency', error as Error)
    return []
  }
}

/**
 * Get repost frequency trends from raw data snapshots
 */
export async function getRepostTrends(
  jobBoardId?: number,
  days: number = 30
): Promise<RepostTrend[]> {
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
      newRepostsDetected: snapshot.repost_postings || 0,
      cumulativeReposts: 0, // Would be calculated from stored metrics
      repostRateAtDate: 0, // Would be calculated from postings at that date
    }))
  } catch (error) {
    logger.error('Failed to get repost trends', error as Error, { jobBoardId })
    return []
  }
}

/**
 * Get repost frequency by role family
 */
export async function getRepostFrequencyByRoleFamily(
  limit: number = 20
): Promise<RoleRepostFrequency[]> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('normalized_title, repost_count, job_board_id')
      .not('normalized_title', 'is', null)

    if (error) throw error

    if (!data || data.length === 0) {
      return []
    }

    // Get board names
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    // Group by role family
    const grouped: Record<string, any> = {}

    data.forEach((posting) => {
      const role = posting.normalized_title
      if (!grouped[role]) {
        grouped[role] = {
          reposts: [],
          boards: new Map(),
        }
      }
      grouped[role].reposts.push(posting.repost_count || 0)
      
      // Track board for worst board calculation
      const boardName = boardMap.get(posting.job_board_id) || 'Unknown'
      if (!grouped[role].boards.has(boardName)) {
        grouped[role].boards.set(boardName, 0)
      }
      grouped[role].boards.set(
        boardName,
        grouped[role].boards.get(boardName) + (posting.repost_count || 0)
      )
    })

    // Calculate metrics for each role family
    const results: RoleRepostFrequency[] = Object.entries(grouped).map(
      ([role, data]) => {
        const reposts = data.reposts as number[]
        const totalPostings = reposts.length
        const totalReposts = reposts.reduce((a: number, b: number) => a + b, 0)
        const repostedCount = reposts.filter((r: number) => r > 0).length
        const repostRate = (repostedCount / totalPostings) * 100
        const avgReposts = totalReposts / totalPostings

        // Find worst board
        const boardEntries = Array.from(data.boards.entries()) as [string, number][]
        const worstBoard =
          boardEntries.length > 0
            ? boardEntries.sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0][0]
            : 'Unknown'

        return {
          roleFamily: role,
          totalPostings,
          repostedCount,
          repostRate: Math.round(repostRate * 10) / 10,
          avgRepostsPerPosting: Math.round(avgReposts * 100) / 100,
          distinctBoards: new Set(data.boards.keys()).size,
          worstBoard,
        }
      }
    )

    // Sort by repost rate descending and return top N
    return results
      .sort((a, b) => b.repostRate - a.repostRate)
      .slice(0, limit)
  } catch (error) {
    logger.error('Failed to get repost frequency by role family', error as Error)
    return []
  }
}

/**
 * Get repost frequency ranking for all boards
 */
export async function getRankedBoardsByRepostFrequency(): Promise<
  Array<RepostFrequencyMetrics & { rank: number; healthScore: number }>
> {
  try {
    const metrics = await getAllBoardsRepostFrequency()

    // Sort by repost rate ascending (lower is better)
    const sorted = metrics.sort((a, b) => a.repostRate - b.repostRate)

    // Add rank and health score
    return sorted.map((m, idx) => {
      // Health score: 100 - repostRate (perfect = 0% reposts = 100 health)
      const healthScore = Math.max(0, 100 - Math.round(m.repostRate * 2))
      return {
        ...m,
        rank: idx + 1,
        healthScore,
      }
    })
  } catch (error) {
    logger.error('Failed to get ranked boards by repost frequency', error as Error)
    return []
  }
}

/**
 * Get top reposted postings for a board
 */
export async function getTopRepostedPostings(
  jobBoardId: number,
  limit: number = 10
): Promise<
  Array<{
    postingId: string
    title: string
    company: string
    repostCount: number
    daysActive: number
  }>
> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('id, title, company, repost_count, first_seen, last_seen')
      .eq('job_board_id', jobBoardId)
      .order('repost_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((p) => {
      const daysActive = Math.floor(
        (new Date(p.last_seen).getTime() - new Date(p.first_seen).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return {
        postingId: p.id,
        title: p.title,
        company: p.company,
        repostCount: p.repost_count || 0,
        daysActive: Math.max(0, daysActive),
      }
    })
  } catch (error) {
    logger.error('Failed to get top reposted postings', error as Error, {
      jobBoardId,
    })
    return []
  }
}

/**
 * Compare repost frequency between two boards
 */
export async function compareRepostFrequency(
  boardId1: number,
  boardId2: number
): Promise<{ board1: RepostFrequencyMetrics | null; board2: RepostFrequencyMetrics | null }> {
  try {
    const [metrics1, metrics2] = await Promise.all([
      getBoardRepostFrequency(boardId1),
      getBoardRepostFrequency(boardId2),
    ])

    return { board1: metrics1, board2: metrics2 }
  } catch (error) {
    logger.error('Failed to compare repost frequency', error as Error, {
      boardId1,
      boardId2,
    })
    return { board1: null, board2: null }
  }
}

/**
 * Get repost severity level for a board
 */
export async function getRepostSeverity(boardId: number): Promise<{
  severity: 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical'
  description: string
  recommendation: string
}> {
  try {
    const metrics = await getBoardRepostFrequency(boardId)

    if (!metrics) {
      return {
        severity: 'good',
        description: 'Unable to assess',
        recommendation: 'Insufficient data',
      }
    }

    if (metrics.repostRate < 5) {
      return {
        severity: 'excellent',
        description: 'Very low repost rate - strong data quality',
        recommendation: 'Monitor for any changes; maintain current scraping practices',
      }
    } else if (metrics.repostRate < 15) {
      return {
        severity: 'good',
        description: 'Low repost rate - acceptable quality',
        recommendation: 'Continue current approach; some data duplication expected',
      }
    } else if (metrics.repostRate < 30) {
      return {
        severity: 'moderate',
        description: 'Moderate repost rate - notable duplication',
        recommendation:
          'Investigate scraping frequency; may need to adjust collection strategy',
      }
    } else if (metrics.repostRate < 50) {
      return {
        severity: 'concerning',
        description: 'High repost rate - significant duplication issues',
        recommendation:
          'Review scraper configuration; consider reducing frequency or adjusting deduplication logic',
      }
    } else {
      return {
        severity: 'critical',
        description: 'Very high repost rate - severe data quality issues',
        recommendation:
          'Temporarily disable scraper; conduct full audit before resuming',
      }
    }
  } catch (error) {
    logger.error('Failed to get repost severity', error as Error, { boardId })
    return {
      severity: 'good',
      description: 'Assessment failed',
      recommendation: 'Retry later',
    }
  }
}

/**
 * Index of reposting boards for a posting cluster
 */
export async function getRepostingBoardsForPosting(postingId: string): Promise<Array<{
  boardId: number
  boardName: string
  firstSeen: Date
  lastSeen: Date
  daysPresent: number
}>> {
  try {
    const { data, error } = await supabase
      .from('posting_events')
      .select('job_posting_id, job_board_id, event_type, event_date')
      .eq('job_posting_id', postingId)
      .order('event_date', { ascending: true })

    if (error) throw error

    // Get board names
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    // Group by board ID
    const boards_map: Record<number, any> = {}

    ;(data || []).forEach((event) => {
      const boardId = event.job_board_id
      if (!boards_map[boardId]) {
        boards_map[boardId] = {
          boardName: boardMap.get(boardId) || 'Unknown',
          firstSeen: new Date(event.event_date),
          lastSeen: new Date(event.event_date),
        }
      } else {
        const eventDate = new Date(event.event_date)
        if (eventDate < boards_map[boardId].firstSeen) {
          boards_map[boardId].firstSeen = eventDate
        }
        if (eventDate > boards_map[boardId].lastSeen) {
          boards_map[boardId].lastSeen = eventDate
        }
      }
    })

    return Object.entries(boards_map).map(([boardId, data]) => {
      const daysPresent = Math.floor(
        (data.lastSeen.getTime() - data.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        boardId: Number(boardId),
        boardName: data.boardName,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
        daysPresent: Math.max(0, daysPresent),
      }
    })
  } catch (error) {
    logger.error('Failed to get reposting boards', error as Error, { postingId })
    return []
  }
}
