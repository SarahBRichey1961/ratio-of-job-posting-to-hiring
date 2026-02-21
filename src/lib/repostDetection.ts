import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'
import { getTitleSimilarity } from './titleNormalization'

const logger = new Logger('logs')

export interface PostingMatch {
  originalPostingId: number
  repostPostingId: number
  matchScore: number // 0-1, confidence score
  matchType: 'url' | 'title-company' | 'similarity'
  firstSeen: Date
  repostDate: Date
  gapDays: number
  confirmed: boolean
}

export interface RepostCluster {
  clusterId: number
  originalPosting: {
    id: number
    title: string
    company: string
    jobBoardId: number
    firstSeen: Date
  }
  reposts: PostingMatch[]
  totalReposts: number
  repostFrequency: number // reposts per month
  averageGapDays: number
}

export interface RepostStats {
  boardId: number
  boardName: string
  totalPostings: number
  postingsWithReposts: number
  totalRepostEvents: number
  averageRepostsPerPosting: number
  repostPercentage: number
  averageGapBetweenReposts: number
}

/**
 * Detect if two postings are the same job (likely a repost)
 * Uses multiple strategies:
 * 1. Exact URL match (highest confidence)
 * 2. Title + Company match with fuzzy matching
 * 3. Title similarity threshold
 */
export function detectRepostMatch(
  posting1: {
    id: number
    title: string
    company: string
    url: string
    normalized_title: string
    first_seen: Date
  },
  posting2: {
    id: number
    title: string
    company: string
    url: string
    normalized_title: string
    first_seen: Date
  }
): PostingMatch | null {
  // Strategy 1: Exact URL match (if URLs are identical, same job)
  if (posting1.url && posting2.url && posting1.url === posting2.url) {
    return {
      originalPostingId: posting1.id,
      repostPostingId: posting2.id,
      matchScore: 1.0, // Perfect match
      matchType: 'url',
      firstSeen: posting1.first_seen,
      repostDate: posting2.first_seen,
      gapDays: Math.ceil(
        (new Date(posting2.first_seen).getTime() -
          new Date(posting1.first_seen).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      confirmed: true,
    }
  }

  // Strategy 2: Title + Company match (strong signal)
  const titleMatch =
    posting1.title.toLowerCase().trim() === posting2.title.toLowerCase().trim()
  const companyMatch =
    posting1.company?.toLowerCase().trim() ===
    posting2.company?.toLowerCase().trim()

  if (titleMatch && companyMatch && posting1.company && posting2.company) {
    return {
      originalPostingId: posting1.id,
      repostPostingId: posting2.id,
      matchScore: 0.95, // Extremely high confidence
      matchType: 'title-company',
      firstSeen: posting1.first_seen,
      repostDate: posting2.first_seen,
      gapDays: Math.ceil(
        (new Date(posting2.first_seen).getTime() -
          new Date(posting1.first_seen).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      confirmed: true,
    }
  }

  // Strategy 3: Title similarity + same role family (medium confidence)
  const similarity = getTitleSimilarity(posting1.title, posting2.title)
  const roleFamilyMatch = posting1.normalized_title === posting2.normalized_title

  const SIMILARITY_THRESHOLD = 0.75 // 75%+ similarity
  if (
    similarity >= SIMILARITY_THRESHOLD &&
    roleFamilyMatch &&
    posting1.company &&
    posting2.company
  ) {
    // Also check company similarity (must be reasonably close)
    const companySimilarity = getTitleSimilarity(
      posting1.company,
      posting2.company
    )
    if (companySimilarity >= 0.7) {
      return {
        originalPostingId: posting1.id,
        repostPostingId: posting2.id,
        matchScore: similarity * 0.9, // Weight title similarity slightly
        matchType: 'similarity',
        firstSeen: posting1.first_seen,
        repostDate: posting2.first_seen,
        gapDays: Math.ceil(
          (new Date(posting2.first_seen).getTime() -
            new Date(posting1.first_seen).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        confirmed: false, // Needs human review
      }
    }
  }

  return null
}

/**
 * Find all reposts of a given posting
 */
export async function findRepostsForPosting(
  jobPostingId: number
): Promise<PostingMatch[]> {
  try {
    const { data: originalPosting, error: fetchError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .single()

    if (fetchError) throw fetchError

    // Get all other postings from the same board and role family
    const { data: candidates, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('job_board_id', originalPosting.job_board_id)
      .eq('normalized_title', originalPosting.normalized_title)
      .neq('id', jobPostingId)
      .gt('first_seen', originalPosting.first_seen) // Only look at later postings

    if (error) throw error

    const matches: PostingMatch[] = []

    for (const candidate of candidates || []) {
      const match = detectRepostMatch(originalPosting, candidate)
      if (match) {
        matches.push(match)
      }
    }

    return matches.sort((a, b) => a.gapDays - b.gapDays)
  } catch (error) {
    logger.error('Failed to find reposts', error as Error, { jobPostingId })
    return []
  }
}

/**
 * Find all reposts across entire board
 */
export async function findAllRepostsForBoard(
  jobBoardId: number,
  minGapDays: number = 1
): Promise<RepostCluster[]> {
  try {
    logger.info(`Finding reposts for board ${jobBoardId}...`)

    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('job_board_id', jobBoardId)
      .order('first_seen', { ascending: true })

    if (error) throw error

    const clusters: RepostCluster[] = []
    const processed = new Set<number>()

    for (const posting of postings || []) {
      if (processed.has(posting.id)) continue

      const matches = await findRepostsForPosting(posting.id)

      if (matches.length > 0) {
        // Filter by minimum gap
        const validMatches = matches.filter((m) => m.gapDays >= minGapDays)

        if (validMatches.length > 0) {
          const cluster: RepostCluster = {
            clusterId: posting.id,
            originalPosting: {
              id: posting.id,
              title: posting.title,
              company: posting.company,
              jobBoardId: posting.job_board_id,
              firstSeen: new Date(posting.first_seen),
            },
            reposts: validMatches,
            totalReposts: validMatches.length,
            repostFrequency: 0, // Will calculate below
            averageGapDays: 0,
          }

          // Mark all reposts as processed
          validMatches.forEach((m) => processed.add(m.repostPostingId))

          // Calculate frequency and average gap
          const totalDays = validMatches.reduce((sum, m) => sum + m.gapDays, 0)
          cluster.averageGapDays = Math.round(
            totalDays / validMatches.length
          )

          // Calculate reposts per month
          const firstGap = validMatches[0].gapDays
          if (firstGap > 0) {
            cluster.repostFrequency =
              (validMatches.length / firstGap) * 30 // Reposts per month
          }

          clusters.push(cluster)
        }
      }
    }

    return clusters
  } catch (error) {
    logger.error('Failed to find reposts for board', error as Error, {
      jobBoardId,
    })
    return []
  }
}

/**
 * Update repost count for a posting in database
 */
export async function updateRepostCount(
  jobPostingId: number,
  repostCount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_postings')
      .update({ repost_count: repostCount })
      .eq('id', jobPostingId)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to update repost count', error as Error, {
      jobPostingId,
    })
    return false
  }
}

/**
 * Record repost event in posting_events
 */
export async function recordRepostEvent(
  originalPostingId: number,
  repostPostingId: number,
  matchScore: number,
  matchType: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('posting_events').insert({
      job_posting_id: originalPostingId,
      event_type: 'repost_detected',
      event_date: new Date(),
      notes: `Repost detected: posting ${repostPostingId} (${matchType}, score: ${matchScore.toFixed(
        2
      )})`,
    })

    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to record repost event', error as Error, {
      originalPostingId,
    })
    return false
  }
}

/**
 * Get repost statistics for a board
 */
export async function getRepostStatsForBoard(
  jobBoardId: number
): Promise<RepostStats | null> {
  try {
    const { data: boardData, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', jobBoardId)
      .single()

    if (boardError) throw boardError

    const clusters = await findAllRepostsForBoard(jobBoardId)

    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('id, repost_count')
      .eq('job_board_id', jobBoardId)

    if (error) throw error

    if (!postings || postings.length === 0) {
      return {
        boardId: jobBoardId,
        boardName: boardData.name,
        totalPostings: 0,
        postingsWithReposts: 0,
        totalRepostEvents: 0,
        averageRepostsPerPosting: 0,
        repostPercentage: 0,
        averageGapBetweenReposts: 0,
      }
    }

    const totalReposts = postings.reduce((sum, p) => sum + (p.repost_count || 0), 0)
    const postingsWithReposts = postings.filter((p) => (p.repost_count || 0) > 0).length
    const averageGapDays =
      clusters.length > 0
        ? Math.round(
            clusters.reduce((sum, c) => sum + c.averageGapDays, 0) /
              clusters.length
          )
        : 0

    return {
      boardId: jobBoardId,
      boardName: boardData.name,
      totalPostings: postings.length,
      postingsWithReposts,
      totalRepostEvents: totalReposts,
      averageRepostsPerPosting:
        postings.length > 0 ? parseFloat((totalReposts / postings.length).toFixed(2)) : 0,
      repostPercentage:
        postings.length > 0
          ? Math.round((postingsWithReposts / postings.length) * 100)
          : 0,
      averageGapBetweenReposts: averageGapDays,
    }
  } catch (error) {
    logger.error('Failed to get repost stats', error as Error, { jobBoardId })
    return null
  }
}

/**
 * Get repost statistics for all boards
 */
export async function getAllRepostStats(): Promise<RepostStats[]> {
  try {
    const { data: boards, error } = await supabase
      .from('job_boards')
      .select('id')

    if (error) throw error

    const stats: RepostStats[] = []

    for (const board of boards || []) {
      const boardStats = await getRepostStatsForBoard(board.id)
      if (boardStats) {
        stats.push(boardStats)
      }
    }

    return stats
  } catch (error) {
    logger.error('Failed to get all repost stats', error as Error)
    return []
  }
}

/**
 * Bulk detect reposts for all postings on a board
 * Updates repost_count in database
 */
export async function bulkDetectRepostsForBoard(
  jobBoardId: number
): Promise<{ detected: number; updated: number; failed: number }> {
  try {
    logger.info(`Starting bulk repost detection for board ${jobBoardId}...`)

    const clusters = await findAllRepostsForBoard(jobBoardId)

    let updated = 0
    let failed = 0

    for (const cluster of clusters) {
      const success = await updateRepostCount(
        cluster.clusterId,
        cluster.totalReposts
      )
      if (success) {
        updated++

        // Record event
        for (const repost of cluster.reposts) {
          await recordRepostEvent(
            cluster.clusterId,
            repost.repostPostingId,
            repost.matchScore,
            repost.matchType
          )
        }
      } else {
        failed++
      }
    }

    logger.info(
      `Bulk repost detection complete: ${clusters.length} clusters, ${updated} updated, ${failed} failed`
    )

    return {
      detected: clusters.length,
      updated,
      failed,
    }
  } catch (error) {
    logger.error('Failed to bulk detect reposts', error as Error, {
      jobBoardId,
    })
    return { detected: 0, updated: 0, failed: 0 }
  }
}

/**
 * Find reposts across all boards
 */
export async function bulkDetectAllReposts(): Promise<{
  totalDetected: number
  totalUpdated: number
  totalFailed: number
}> {
  try {
    const { data: boards, error } = await supabase
      .from('job_boards')
      .select('id')

    if (error) throw error

    let totalDetected = 0
    let totalUpdated = 0
    let totalFailed = 0

    for (const board of boards || []) {
      const result = await bulkDetectRepostsForBoard(board.id)
      totalDetected += result.detected
      totalUpdated += result.updated
      totalFailed += result.failed
    }

    return { totalDetected, totalUpdated, totalFailed }
  } catch (error) {
    logger.error('Failed to bulk detect all reposts', error as Error)
    return { totalDetected: 0, totalUpdated: 0, totalFailed: 0 }
  }
}
