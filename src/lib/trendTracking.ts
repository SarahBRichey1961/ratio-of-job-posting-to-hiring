import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface TrendSnapshot {
  id: number
  snapshotDate: string
  boardId: number
  overallScore: number
  lifespan: number
  repostRate: number
  avgEmployerScore: number
  avgCandidateScore: number
  totalPostings: number
  createdAt: string
}

export interface TrendMetrics {
  boardId: number
  boardName: string
  currentScore: number
  previousScore: number
  scoreChange: number
  scoreChangePercent: number
  trend: 'up' | 'down' | 'stable'
  trendStrength: 'strong' | 'moderate' | 'weak'
  daysAnalyzed: number
  snapshots: TrendSnapshot[]
}

export interface WeeklyComparison {
  boardId: number
  boardName: string
  thisWeekScore: number
  lastWeekScore: number
  weekChange: number
  weekTrend: 'up' | 'down' | 'stable'
  trendDuration: number // weeks of same direction
  volatility: number // standard deviation
}

export interface AnomalyAlert {
  boardId: number
  boardName: string
  metric: string
  currentValue: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  description: string
}

export interface RoleTrend {
  roleFamily: string
  currentScore: number
  weekAgoScore: number
  change: number
  trend: 'up' | 'down' | 'stable'
  demandChange: number // new postings delta
  hotness: number // percentile vs other roles
}

/**
 * Create or update a snapshot for a board
 */
export async function createSnapshot(
  boardId: number,
  overallScore: number,
  lifespan: number,
  repostRate: number,
  avgEmployerScore: number,
  avgCandidateScore: number,
  totalPostings: number
): Promise<TrendSnapshot | null> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Check if snapshot exists for today
    const { data: existing } = await supabase
      .from('trend_snapshots')
      .select('*')
      .eq('job_board_id', boardId)
      .eq('snapshot_date', today)
      .single()

    if (existing) {
      // Update existing snapshot
      const { data, error } = await supabase
        .from('trend_snapshots')
        .update({
          overall_score: overallScore,
          avg_lifespan_days: lifespan,
          avg_repost_rate: repostRate,
          avg_employer_score: avgEmployerScore,
          avg_candidate_score: avgCandidateScore,
          total_postings: totalPostings,
        })
        .eq('id', existing.id)
        .select()
        .single()

      return data ? mapSnapshot(data) : null
    }

    // Create new snapshot
    const { data, error } = await supabase
      .from('trend_snapshots')
      .insert({
        job_board_id: boardId,
        snapshot_date: today,
        overall_score: overallScore,
        avg_lifespan_days: lifespan,
        avg_repost_rate: repostRate,
        avg_employer_score: avgEmployerScore,
        avg_candidate_score: avgCandidateScore,
        total_postings: totalPostings,
      })
      .select()
      .single()

    if (error) throw error
    return data ? mapSnapshot(data) : null
  } catch (error) {
    logger.error('Failed to create snapshot', error as Error, { boardId })
    return null
  }
}

/**
 * Get trend metrics for a board
 */
export async function getBoardTrends(boardId: number, days: number = 30): Promise<TrendMetrics | null> {
  try {
    // Get board name
    const { data: board } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', boardId)
      .single()

    if (!board) return null

    // Get snapshots
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: snapshots } = await supabase
      .from('trend_snapshots')
      .select('*')
      .eq('job_board_id', boardId)
      .gte('snapshot_date', cutoffDate)
      .order('snapshot_date', { ascending: true })

    if (!snapshots || snapshots.length < 2) {
      return null
    }

    const mapped = snapshots.map(mapSnapshot)
    const current = mapped[mapped.length - 1]
    const previous = mapped[0]

    const scoreChange = current.overallScore - previous.overallScore
    const scoreChangePercent = (scoreChange / previous.overallScore) * 100

    // Determine trend
    let trend: 'up' | 'down' | 'stable'
    if (scoreChangePercent > 2) trend = 'up'
    else if (scoreChangePercent < -2) trend = 'down'
    else trend = 'stable'

    // Trend strength
    const strength = Math.abs(scoreChangePercent)
    let trendStrength: 'strong' | 'moderate' | 'weak'
    if (strength > 5) trendStrength = 'strong'
    else if (strength > 2) trendStrength = 'moderate'
    else trendStrength = 'weak'

    return {
      boardId,
      boardName: board.name,
      currentScore: current.overallScore,
      previousScore: previous.overallScore,
      scoreChange,
      scoreChangePercent,
      trend,
      trendStrength,
      daysAnalyzed: days,
      snapshots: mapped,
    }
  } catch (error) {
    logger.error('Failed to get board trends', error as Error, { boardId })
    return null
  }
}

/**
 * Get all board trends
 */
export async function getAllBoardTrends(days: number = 30): Promise<TrendMetrics[]> {
  try {
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id')

    if (!boards) return []

    const trends: TrendMetrics[] = []
    for (const board of boards) {
      const trend = await getBoardTrends(board.id, days)
      if (trend) trends.push(trend)
    }

    return trends.sort((a, b) => Math.abs(b.scoreChange) - Math.abs(a.scoreChange))
  } catch (error) {
    logger.error('Failed to get all board trends', error as Error)
    return []
  }
}

/**
 * Get weekly comparison for a board
 */
export async function getWeeklyComparison(boardId: number): Promise<WeeklyComparison | null> {
  try {
    const { data: board } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', boardId)
      .single()

    if (!board) return null

    const today = new Date()
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const lastWeekStart = new Date(thisWeekStart).getTime() - 7 * 24 * 60 * 60 * 1000
    const lastWeekEnd = new Date(thisWeekStart).getTime() - 1 * 24 * 60 * 60 * 1000

    // Get this week's snapshots
    const { data: thisWeek } = await supabase
      .from('trend_snapshots')
      .select('overall_score')
      .eq('job_board_id', boardId)
      .gte('snapshot_date', thisWeekStart)

    // Get last week's snapshots
    const { data: lastWeek } = await supabase
      .from('trend_snapshots')
      .select('overall_score')
      .eq('job_board_id', boardId)
      .gte('snapshot_date', new Date(lastWeekStart).toISOString().split('T')[0])
      .lt('snapshot_date', new Date(lastWeekEnd).toISOString().split('T')[0])

    if (!thisWeek || !lastWeek) return null

    const thisWeekAvg = thisWeek.reduce((sum, s) => sum + (s.overall_score || 0), 0) / thisWeek.length
    const lastWeekAvg = lastWeek.reduce((sum, s) => sum + (s.overall_score || 0), 0) / lastWeek.length

    const weekChange = thisWeekAvg - lastWeekAvg
    const weekTrend: 'up' | 'down' | 'stable' = weekChange > 1 ? 'up' : weekChange < -1 ? 'down' : 'stable'

    // Calculate trend duration (get all snapshots and count consecutive same-direction weeks)
    const { data: allSnapshots } = await supabase
      .from('trend_snapshots')
      .select('overall_score, snapshot_date')
      .eq('job_board_id', boardId)
      .gte('snapshot_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    let trendDuration = 1
    if (allSnapshots && allSnapshots.length > 1) {
      for (let i = allSnapshots.length - 1; i > 0; i--) {
        const curr = allSnapshots[i].overall_score || 0
        const prev = allSnapshots[i - 1].overall_score || 0
        const direction = curr > prev ? 'up' : curr < prev ? 'down' : 'stable'
        if ((weekTrend === 'up' && direction === 'up') || (weekTrend === 'down' && direction === 'down')) {
          trendDuration++
        } else {
          break
        }
      }
    }

    // Calculate volatility
    const allScores = (thisWeek || []).map((s) => s.overall_score || 0)
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length
    const variance = allScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allScores.length
    const volatility = Math.sqrt(variance)

    return {
      boardId,
      boardName: board.name,
      thisWeekScore: Math.round(thisWeekAvg),
      lastWeekScore: Math.round(lastWeekAvg),
      weekChange: Math.round(weekChange),
      weekTrend,
      trendDuration,
      volatility: Math.round(volatility * 100) / 100,
    }
  } catch (error) {
    logger.error('Failed to get weekly comparison', error as Error, { boardId })
    return null
  }
}

/**
 * Detect anomalies in board metrics
 */
export async function detectAnomalies(boardId: number): Promise<AnomalyAlert[]> {
  try {
    // Get snapshots for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: snapshots } = await supabase
      .from('trend_snapshots')
      .select('*')
      .eq('job_board_id', boardId)
      .gte('snapshot_date', thirtyDaysAgo)
      .order('snapshot_date', { ascending: true })

    if (!snapshots || snapshots.length < 7) return []

    const { data: board } = await supabase
      .from('job_boards')
      .select('name')
      .eq('id', boardId)
      .single()

    if (!board) return []

    const alerts: AnomalyAlert[] = []

    // Calculate statistics
    const scores = snapshots.map((s) => s.overall_score || 0)
    const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const stDevScore = Math.sqrt(
      scores.reduce((sum, val) => sum + Math.pow(val - meanScore, 2), 0) / scores.length
    )

    const lifespans = snapshots.map((s) => s.avg_lifespan_days || 0)
    const meanLifespan = lifespans.reduce((a, b) => a + b, 0) / lifespans.length
    const stDevLifespan = Math.sqrt(
      lifespans.reduce((sum, val) => sum + Math.pow(val - meanLifespan, 2), 0) / lifespans.length
    )

    // Check for score anomalies
    const latestScore = scores[scores.length - 1]
    const scoreDeviation = Math.abs((latestScore - meanScore) / stDevScore)
    if (scoreDeviation > 2) {
      // 2 standard deviations
      const severity = scoreDeviation > 3 ? 'high' : 'medium'
      const direction = latestScore > meanScore ? 'spike' : 'drop'
      alerts.push({
        boardId,
        boardName: board.name,
        metric: 'overall_score',
        currentValue: latestScore,
        expectedValue: Math.round(meanScore),
        deviation: Math.round((scoreDeviation * 100) / 10) / 10,
        severity,
        timestamp: snapshots[snapshots.length - 1].snapshot_date || new Date().toISOString(),
        description: `Unusual ${direction} in overall score (${latestScore} vs expected ${Math.round(meanScore)})`,
      })
    }

    // Check for lifespan anomalies
    const latestLifespan = lifespans[lifespans.length - 1]
    const lifespanDeviation = Math.abs((latestLifespan - meanLifespan) / stDevLifespan)
    if (lifespanDeviation > 2) {
      const severity = lifespanDeviation > 3 ? 'high' : 'medium'
      const direction = latestLifespan > meanLifespan ? 'increase' : 'decrease'
      alerts.push({
        boardId,
        boardName: board.name,
        metric: 'avg_lifespan',
        currentValue: latestLifespan,
        expectedValue: Math.round(meanLifespan),
        deviation: Math.round((lifespanDeviation * 100) / 10) / 10,
        severity,
        timestamp: snapshots[snapshots.length - 1].snapshot_date || new Date().toISOString(),
        description: `Unusual ${direction} in average lifespan (${Math.round(latestLifespan)}d vs expected ${Math.round(meanLifespan)}d)`,
      })
    }

    return alerts
  } catch (error) {
    logger.error('Failed to detect anomalies', error as Error, { boardId })
    return []
  }
}

/**
 * Get role trends
 */
export async function getRoleTrends(limit: number = 50): Promise<RoleTrend[]> {
  try {
    // Get current role scores (from dimensionalScoring if available)
    // For now, calculate from postings
    const { data: postings } = await supabase
      .from('job_postings')
      .select('normalized_title, first_seen, repost_count')
      .not('normalized_title', 'is', null)

    if (!postings) return []

    // Group by role
    const byRole: Record<string, any> = {}
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    postings.forEach((p) => {
      const role = p.normalized_title
      if (!byRole[role]) {
        byRole[role] = { total: 0, thisWeek: 0, lastWeek: 0, allScores: [] }
      }
      byRole[role].total++

      const postedDate = new Date(p.first_seen)
      if (postedDate > weekAgo) {
        byRole[role].thisWeek++
      } else if (postedDate > new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        byRole[role].lastWeek++
      }
    })

    // Calculate trends
    const allRoles = Object.entries(byRole)
    const trends: RoleTrend[] = allRoles.map(([role, data]) => {
      const demandChange = data.thisWeek - data.lastWeek
      const currentScore = data.thisWeek > 0 ? Math.min(100, (data.thisWeek / 7) * 10) : 0
      const lastScore = data.lastWeek > 0 ? Math.min(100, (data.lastWeek / 7) * 10) : 0
      const change = currentScore - lastScore

      const trend: 'up' | 'down' | 'stable' = change > 2 ? 'up' : change < -2 ? 'down' : 'stable'

      // Calculate hotness (percentile)
      const hotness = (allRoles.filter(([, d]) => d.total <= data.total).length / allRoles.length) * 100

      return {
        roleFamily: role,
        currentScore: Math.round(currentScore),
        weekAgoScore: Math.round(lastScore),
        change: Math.round(change),
        trend,
        demandChange,
        hotness: Math.round(hotness),
      }
    })

    return trends.sort((a, b) => b.demandChange - a.demandChange).slice(0, limit)
  } catch (error) {
    logger.error('Failed to get role trends', error as Error)
    return []
  }
}

/**
 * Helper: Map database snapshot to interface
 */
function mapSnapshot(data: any): TrendSnapshot {
  return {
    id: data.id,
    snapshotDate: data.snapshot_date,
    boardId: data.job_board_id,
    overallScore: data.overall_score || 0,
    lifespan: data.avg_lifespan_days || 0,
    repostRate: data.avg_repost_rate || 0,
    avgEmployerScore: data.avg_employer_score || 50,
    avgCandidateScore: data.avg_candidate_score || 50,
    totalPostings: data.total_postings || 0,
    createdAt: data.created_at,
  }
}
