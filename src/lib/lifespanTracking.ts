import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface PostingLifespan {
  jobPostingId: number
  firstSeen: Date
  lastSeen: Date
  disappeared: boolean
  disappearedAt?: Date
  lifespanDays: number
  status: 'active' | 'inactive' | 'disappeared'
}

export interface LifespanStats {
  boardId: number
  boardName: string
  totalPostings: number
  activePostings: number
  disappearedPostings: number
  averageLifespan: number
  medianLifespan: number
  minLifespan: number
  maxLifespan: number
  byRoleFamily?: Record<string, any>
}

export interface PostingEvent {
  jobPostingId: number
  eventType: 'appeared' | 'reappeared' | 'disappeared'
  eventDate: Date
  notes?: string
}

/**
 * Track when a posting first appears
 */
export async function recordFirstSighting(
  jobPostingId: number
): Promise<boolean> {
  try {
    const { data: posting, error: fetchError } = await supabase
      .from('job_postings')
      .select('first_seen')
      .eq('id', jobPostingId)
      .single()

    if (fetchError) throw fetchError

    // Only set first_seen if not already set
    if (!posting.first_seen) {
      const { error } = await supabase
        .from('job_postings')
        .update({ first_seen: new Date() })
        .eq('id', jobPostingId)

      if (error) throw error

      // Record event
      await recordPostingEvent(jobPostingId, 'appeared')
      logger.info(`Recorded first sighting for posting ${jobPostingId}`)
      return true
    }

    return false
  } catch (error) {
    logger.error('Failed to record first sighting', error as Error, {
      jobPostingId,
    })
    return false
  }
}

/**
 * Update last_seen timestamp for an active posting
 */
export async function updateLastSeen(jobPostingId: number): Promise<boolean> {
  try {
    const now = new Date()

    const { data: posting, error: fetchError } = await supabase
      .from('job_postings')
      .select('last_seen, disappeared')
      .eq('id', jobPostingId)
      .single()

    if (fetchError) throw fetchError

    // If previously marked as disappeared, record reappearance
    if (posting.disappeared) {
      await recordPostingEvent(jobPostingId, 'reappeared')
      logger.info(`Posting ${jobPostingId} reappeared`)
    }

    const { error } = await supabase
      .from('job_postings')
      .update({
        last_seen: now,
        disappeared: false,
        disappeared_at: null,
      })
      .eq('id', jobPostingId)

    if (error) throw error
    return true
  } catch (error) {
    logger.error('Failed to update last_seen', error as Error, {
      jobPostingId,
    })
    return false
  }
}

/**
 * Mark a posting as disappeared
 */
export async function markAsDisappeared(jobPostingId: number): Promise<boolean> {
  try {
    const now = new Date()

    const { data: posting, error: fetchError } = await supabase
      .from('job_postings')
      .select('disappeared')
      .eq('id', jobPostingId)
      .single()

    if (fetchError) throw fetchError

    // Only mark as disappeared if not already marked
    if (!posting.disappeared) {
      const { error } = await supabase
        .from('job_postings')
        .update({
          disappeared: true,
          disappeared_at: now,
        })
        .eq('id', jobPostingId)

      if (error) throw error

      // Record event
      await recordPostingEvent(jobPostingId, 'disappeared')
      logger.info(`Marked posting ${jobPostingId} as disappeared`)

      // Calculate lifespan
      await calculateAndUpdateLifespan(jobPostingId)
      return true
    }

    return false
  } catch (error) {
    logger.error('Failed to mark as disappeared', error as Error, {
      jobPostingId,
    })
    return false
  }
}

/**
 * Calculate lifespan in days for a posting
 */
export async function calculateAndUpdateLifespan(
  jobPostingId: number
): Promise<number> {
  try {
    const { data: posting, error } = await supabase
      .from('job_postings')
      .select('first_seen, last_seen, disappeared_at')
      .eq('id', jobPostingId)
      .single()

    if (error) throw error

    if (!posting.first_seen || !posting.last_seen) {
      return 0
    }

    const firstSeen = new Date(posting.first_seen)
    const lastSeen = posting.disappeared_at
      ? new Date(posting.disappeared_at)
      : new Date(posting.last_seen)

    const lifespanMs = lastSeen.getTime() - firstSeen.getTime()
    const lifespanDays = Math.ceil(lifespanMs / (1000 * 60 * 60 * 24))

    // Update database
    const { error: updateError } = await supabase
      .from('job_postings')
      .update({ lifespan_days: Math.max(0, lifespanDays) })
      .eq('id', jobPostingId)

    if (updateError) throw updateError

    return Math.max(0, lifespanDays)
  } catch (error) {
    logger.error('Failed to calculate lifespan', error as Error, {
      jobPostingId,
    })
    return 0
  }
}

/**
 * Record a posting event (appearance, reappearance, disappearance)
 */
export async function recordPostingEvent(
  jobPostingId: number,
  eventType: 'appeared' | 'reappeared' | 'disappeared',
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('posting_events').insert({
      job_posting_id: jobPostingId,
      event_type: eventType,
      event_date: new Date(),
      notes,
    })

    if (error) throw error
    logger.debug(`Recorded event: ${eventType} for posting ${jobPostingId}`)
    return true
  } catch (error) {
    logger.warn(
      'Failed to record posting event',
      undefined,
      error as Error
    )
    return false
  }
}

/**
 * Get posting timeline/history
 */
export async function getPostingTimeline(
  jobPostingId: number
): Promise<PostingEvent[]> {
  try {
    const { data, error } = await supabase
      .from('posting_events')
      .select('job_posting_id, event_type, event_date, notes')
      .eq('job_posting_id', jobPostingId)
      .order('event_date', { ascending: true })

    if (error) throw error

    return (data || []).map((event) => ({
      jobPostingId: event.job_posting_id,
      eventType: event.event_type,
      eventDate: new Date(event.event_date),
      notes: event.notes,
    }))
  } catch (error) {
    logger.error('Failed to get posting timeline', error as Error, {
      jobPostingId,
    })
    return []
  }
}

/**
 * Get lifespan statistics for a job board
 */
export async function getLifespanStatsForBoard(
  jobBoardId: number
): Promise<LifespanStats | null> {
  try {
    const { data: boardData, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', jobBoardId)
      .single()

    if (boardError) throw boardError

    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('lifespan_days, disappeared, normalized_title')
      .eq('job_board_id', jobBoardId)

    if (error) throw error

    if (!postings || postings.length === 0) {
      return {
        boardId: jobBoardId,
        boardName: boardData.name,
        totalPostings: 0,
        activePostings: 0,
        disappearedPostings: 0,
        averageLifespan: 0,
        medianLifespan: 0,
        minLifespan: 0,
        maxLifespan: 0,
      }
    }

    const lifespans = postings
      .filter((p) => p.lifespan_days !== null)
      .map((p) => p.lifespan_days)
      .sort((a, b) => a - b)

    const disappearedCount = postings.filter((p) => p.disappeared).length
    const activeCount = postings.length - disappearedCount

    // Calculate statistics
    const totalLifespan = lifespans.reduce((a, b) => a + b, 0)
    const averageLifespan = lifespans.length > 0 ? totalLifespan / lifespans.length : 0
    const medianLifespan =
      lifespans.length > 0
        ? lifespans[Math.floor(lifespans.length / 2)]
        : 0
    const minLifespan = lifespans.length > 0 ? lifespans[0] : 0
    const maxLifespan = lifespans.length > 0 ? lifespans[lifespans.length - 1] : 0

    // Stats by role family
    const byRoleFamily: Record<string, any> = {}
    postings.forEach((posting) => {
      const roleFamily = posting.normalized_title || 'unknown'
      if (!byRoleFamily[roleFamily]) {
        byRoleFamily[roleFamily] = {
          count: 0,
          avgLifespan: 0,
          totalLifespan: 0,
        }
      }
      byRoleFamily[roleFamily].count += 1
      byRoleFamily[roleFamily].totalLifespan += posting.lifespan_days || 0
    })

    Object.keys(byRoleFamily).forEach((family) => {
      byRoleFamily[family].avgLifespan =
        byRoleFamily[family].totalLifespan / byRoleFamily[family].count
    })

    return {
      boardId: jobBoardId,
      boardName: boardData.name,
      totalPostings: postings.length,
      activePostings: activeCount,
      disappearedPostings: disappearedCount,
      averageLifespan: Math.round(averageLifespan * 10) / 10,
      medianLifespan,
      minLifespan,
      maxLifespan,
      byRoleFamily,
    }
  } catch (error) {
    logger.error('Failed to get lifespan stats', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Get lifespan statistics for all boards
 */
export async function getAllBoardsLifespanStats(): Promise<LifespanStats[]> {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id')

    if (boardsError) throw boardsError

    const stats: LifespanStats[] = []

    for (const board of boards || []) {
      const boardStats = await getLifespanStatsForBoard(board.id)
      if (boardStats) {
        stats.push(boardStats)
      }
    }

    return stats
  } catch (error) {
    logger.error('Failed to get all boards lifespan stats', error as Error)
    return []
  }
}

/**
 * Bulk update lifespans for all postings that have disappeared
 */
export async function bulkUpdateAllLifespans(): Promise<{
  updated: number
  failed: number
}> {
  try {
    logger.info('Starting bulk lifespan update...')

    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('id, first_seen, last_seen, disappeared')

    if (error) throw error

    let updated = 0
    let failed = 0

    for (const posting of postings || []) {
      const success = await calculateAndUpdateLifespan(posting.id)
      if (success) {
        updated++
      } else {
        failed++
      }
    }

    logger.info(`Bulk update complete: ${updated} updated, ${failed} failed`)
    return { updated, failed }
  } catch (error) {
    logger.error('Failed to bulk update lifespans', error as Error)
    return { updated: 0, failed: 0 }
  }
}
