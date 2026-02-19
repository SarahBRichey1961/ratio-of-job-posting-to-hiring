import { supabase } from '@/lib/supabase'
import { getBoardLifespanMetrics, getAllBoardsLifespanMetrics } from './lifespanMetrics'
import { getBoardRepostFrequency, getAllBoardsRepostFrequency } from './repostFrequency'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

export interface EfficiencyScore {
  boardId: number
  boardName: string
  overallScore: number
  lifespanScore: number
  repostScore: number
  employerSurveyScore: number
  candidateSurveyScore: number
  qualityAdjustment: number
  dataCompletenessRatio: number
  percentile: number
  trend: number // change from previous period
  lastUpdated: Date
}

export interface ScoreComponentBreakdown {
  lifespan: {
    weight: number // 40%
    score: number
    contribution: number
  }
  reposts: {
    weight: number // 30%
    score: number
    contribution: number
  }
  employerSurvey: {
    weight: number // 20%
    score: number
    contribution: number
  }
  candidateSurvey: {
    weight: number // 10%
    score: number
    contribution: number
  }
}

export interface ScoreTrend {
  date: Date
  boardId: number
  boardName: string
  score: number
  rank: number
  percentile: number
}

export interface RoleScoreMetrics {
  roleFamily: string
  avgScore: number
  medianScore: number
  bestBoard: string
  worstBoard: string
  boardCount: number
  jobCount: number
}

/**
 * Calculate lifespan component score (0-100)
 * Lower lifespan is better, so we invert it
 */
function calculateLifespanScore(avgLifespan: number): number {
  if (avgLifespan === 0) return 0
  
  // Scale: 7 days = 100, 60 days = 0
  // Formula: 100 - ((days - 7) / 53 * 100), clamped to 0-100
  const score = 100 - ((avgLifespan - 7) / 53) * 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate repost component score (0-100)
 * Lower repost rate is better
 */
function calculateRepostScore(repostRate: number): number {
  // Scale: 5% = 95, 30% = 30, 50% = 0
  // Formula: 100 - (repostRate * 2)
  const score = 100 - repostRate * 2
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate survey component score (0-100)
 * Based on average rating from surveys
 */
function calculateSurveyScore(ratings?: number[]): number {
  if (!ratings || ratings.length === 0) return 50 // neutral if no data
  
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
  // Assume ratings are 1-5, convert to 0-100
  return (avg / 5) * 100
}

/**
 * Calculate data completeness ratio
 * What percentage of data we have for this board
 */
function calculateDataCompletenessRatio(
  hasLifespan: boolean,
  hasReposts: boolean,
  employerSurveyCount: number,
  candidateSurveyCount: number
): number {
  let components = 0
  let complete = 0

  if (hasLifespan) {
    complete++
  }
  components++

  if (hasReposts) {
    complete++
  }
  components++

  if (employerSurveyCount > 0) {
    complete++
  }
  components++

  if (candidateSurveyCount > 0) {
    complete++
  }
  components++

  return complete / components
}

/**
 * Apply quality adjustment based on data quality
 */
function calculateQualityAdjustment(repostRate: number): number {
  if (repostRate < 5) return 1.0 // Excellent
  if (repostRate < 15) return 0.95 // Good
  if (repostRate < 30) return 0.85 // Moderate
  if (repostRate < 50) return 0.70 // Concerning
  return 0.0 // Critical - don't use this data
}

/**
 * Get breakdown of score components
 */
export async function getScoreComponentBreakdown(
  jobBoardId: number
): Promise<ScoreComponentBreakdown | null> {
  try {
    const lifespanMetrics = await getBoardLifespanMetrics(jobBoardId)
    const repostMetrics = await getBoardRepostFrequency(jobBoardId)

    if (!lifespanMetrics || !repostMetrics) {
      return null
    }

    // Get survey data
    const { data: employerSurveys } = await supabase
      .from('employer_surveys')
      .select('board_hiring_efficiency')
      .eq('job_board_id', jobBoardId)

    const { data: candidateSurveys } = await supabase
      .from('candidate_surveys')
      .select('board_visibility_rating')
      .eq('job_board_id', jobBoardId)

    const employerRatings = employerSurveys
      ?.map((s) => s.board_hiring_efficiency)
      .filter((r) => r !== null) || []
    const candidateRatings = candidateSurveys
      ?.map((s) => s.board_visibility_rating)
      .filter((r) => r !== null) || []

    const lifespanScore = calculateLifespanScore(lifespanMetrics.avgLifespan)
    const repostScore = calculateRepostScore(repostMetrics.repostRate)
    const employerScore = calculateSurveyScore(employerRatings)
    const candidateScore = calculateSurveyScore(candidateRatings)

    return {
      lifespan: {
        weight: 0.4,
        score: lifespanScore,
        contribution: lifespanScore * 0.4,
      },
      reposts: {
        weight: 0.3,
        score: repostScore,
        contribution: repostScore * 0.3,
      },
      employerSurvey: {
        weight: 0.2,
        score: employerScore,
        contribution: employerScore * 0.2,
      },
      candidateSurvey: {
        weight: 0.1,
        score: candidateScore,
        contribution: candidateScore * 0.1,
      },
    }
  } catch (error) {
    logger.error('Failed to get score components', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Calculate overall efficiency score for a board
 */
export async function calculateBoardScore(jobBoardId: number): Promise<EfficiencyScore | null> {
  try {
    const { data: board, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name')
      .eq('id', jobBoardId)
      .single()

    if (boardError) throw boardError

    const breakdown = await getScoreComponentBreakdown(jobBoardId)
    if (!breakdown) {
      return null
    }

    const repostMetrics = await getBoardRepostFrequency(jobBoardId)
    const lifespanMetrics = await getBoardLifespanMetrics(jobBoardId)

    if (!repostMetrics || !lifespanMetrics) {
      return null
    }

    // Calculate base score
    const baseScore = Math.round(
      breakdown.lifespan.contribution +
        breakdown.reposts.contribution +
        breakdown.employerSurvey.contribution +
        breakdown.candidateSurvey.contribution
    )

    // Apply quality adjustment
    const qualityAdjustment = calculateQualityAdjustment(repostMetrics.repostRate)
    const adjustedScore = Math.round(baseScore * qualityAdjustment)

    // Calculate data completeness
    const completeness = calculateDataCompletenessRatio(
      lifespanMetrics.totalPostings > 0,
      repostMetrics.totalPostings > 0,
      Math.max(0, breakdown.employerSurvey.score),
      Math.max(0, breakdown.candidateSurvey.score)
    )

    // Store the score
    const { error: insertError } = await supabase.from('efficiency_scores').insert({
      job_board_id: jobBoardId,
      overall_score: adjustedScore,
      lifespan_score: Math.round(breakdown.lifespan.score),
      repost_score: Math.round(breakdown.reposts.score),
      employer_survey_score: Math.round(breakdown.employerSurvey.score),
      candidate_survey_score: Math.round(breakdown.candidateSurvey.score),
      quality_adjustment: qualityAdjustment,
      data_completeness: completeness,
      computed_at: new Date(),
    })

    if (insertError && insertError.code !== 'PGRST116') {
      logger.warn('Could not insert score', insertError as Error)
    }

    return {
      boardId: jobBoardId,
      boardName: board.name,
      overallScore: adjustedScore,
      lifespanScore: Math.round(breakdown.lifespan.score),
      repostScore: Math.round(breakdown.reposts.score),
      employerSurveyScore: Math.round(breakdown.employerSurvey.score),
      candidateSurveyScore: Math.round(breakdown.candidateSurvey.score),
      qualityAdjustment,
      dataCompletenessRatio: completeness,
      percentile: 0, // Will be calculated after all scores
      trend: 0, // Will be calculated from history
      lastUpdated: new Date(),
    }
  } catch (error) {
    logger.error('Failed to calculate board score', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Calculate scores for all boards and return ranked list
 */
export async function calculateAllBoardScores(): Promise<EfficiencyScore[]> {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id')

    if (boardsError) throw boardsError

    const scores: EfficiencyScore[] = []

    for (const board of boards || []) {
      const score = await calculateBoardScore(board.id)
      if (score) {
        scores.push(score)
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.overallScore - a.overallScore)

    // Add percentile and rank
    scores.forEach((score, idx) => {
      score.percentile = Math.round(((scores.length - idx) / scores.length) * 100)
    })

    return scores
  } catch (error) {
    logger.error('Failed to calculate all board scores', error as Error)
    return []
  }
}

/**
 * Get ranked boards by efficiency score
 */
export async function getRankedBoardsByScore(): Promise<
  Array<EfficiencyScore & { rank: number; grade: string }>
> {
  try {
    const scores = await calculateAllBoardScores()

    return scores.map((score, idx) => {
      let grade = 'F'
      if (score.overallScore >= 90) grade = 'A+'
      else if (score.overallScore >= 85) grade = 'A'
      else if (score.overallScore >= 80) grade = 'B+'
      else if (score.overallScore >= 75) grade = 'B'
      else if (score.overallScore >= 70) grade = 'C+'
      else if (score.overallScore >= 60) grade = 'C'
      else if (score.overallScore >= 50) grade = 'D'

      return {
        ...score,
        rank: idx + 1,
        grade,
      }
    })
  } catch (error) {
    logger.error('Failed to get ranked boards', error as Error)
    return []
  }
}

/**
 * Get score trends for a board
 */
export async function getBoardScoreTrends(jobBoardId: number, days: number = 30): Promise<ScoreTrend[]> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('efficiency_scores')
      .select('*')
      .eq('job_board_id', jobBoardId)
      .gte('computed_at', startDate)
      .order('computed_at', { ascending: true })

    if (error) throw error

    const { data: board } = await supabase
      .from('job_boards')
      .select('name')
      .eq('id', jobBoardId)
      .single()

    return (data || []).map((score, idx) => ({
      date: new Date(score.computed_at),
      boardId: jobBoardId,
      boardName: board?.name || 'Unknown',
      score: score.overall_score,
      rank: 0, // Would need to query all boards for that date
      percentile: 0, // Would need historical percentile data
    }))
  } catch (error) {
    logger.error('Failed to get score trends', error as Error, { jobBoardId })
    return []
  }
}

/**
 * Get scores by role family
 */
export async function getScoresByRoleFamily(limit: number = 20): Promise<RoleScoreMetrics[]> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('normalized_title, job_board_id')
      .not('normalized_title', 'is', null)

    if (error) throw error

    // Get all board scores
    const allScores = await getRankedBoardsByScore()
    const scoreMap = new Map(allScores.map((s) => [s.boardId, s.overallScore]))

    // Get board names
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    // Group by role family
    const grouped: Record<string, any> = {}

    ;(data || []).forEach((posting) => {
      const role = posting.normalized_title
      const boardScore = scoreMap.get(posting.job_board_id) || 0

      if (!grouped[role]) {
        grouped[role] = {
          scores: [],
          boards: new Map(),
          jobCount: 0,
        }
      }

      grouped[role].scores.push(boardScore)
      grouped[role].jobCount++

      const boardName = boardMap.get(posting.job_board_id) || 'Unknown'
      if (!grouped[role].boards.has(boardName)) {
        grouped[role].boards.set(boardName, 0)
      }
    })

    // Calculate metrics
    const results: RoleScoreMetrics[] = Object.entries(grouped).map(([role, data]) => {
      const scores = data.scores.sort((a: number, b: number) => a - b)
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      const median = scores[Math.floor(scores.length / 2)]

      const boardScores = Array.from(data.boards.entries())
      const best = boardScores.sort((a, b) => getScore(allScores, b[0]) - getScore(allScores, a[0]))[0]
      const worst = boardScores.sort((a, b) => getScore(allScores, a[0]) - getScore(allScores, b[0]))[0]

      return {
        roleFamily: role,
        avgScore: Math.round(avg),
        medianScore: Math.round(median),
        bestBoard: best ? best[0] : 'Unknown',
        worstBoard: worst ? worst[0] : 'Unknown',
        boardCount: data.boards.size,
        jobCount: data.jobCount,
      }
    })

    return results.sort((a, b) => b.avgScore - a.avgScore).slice(0, limit)
  } catch (error) {
    logger.error('Failed to get scores by role family', error as Error)
    return []
  }
}

function getScore(allScores: Array<EfficiencyScore & { grade: string; rank: number }>, boardName: string): number {
  const score = allScores.find((s) => s.boardName === boardName)
  return score ? score.overallScore : 0
}

/**
 * Compare two boards by score
 */
export async function compareScores(
  boardId1: number,
  boardId2: number
): Promise<{ board1: EfficiencyScore | null; board2: EfficiencyScore | null }> {
  try {
    const score1 = await calculateBoardScore(boardId1)
    const score2 = await calculateBoardScore(boardId2)

    return { board1: score1, board2: score2 }
  } catch (error) {
    logger.error('Failed to compare scores', error as Error, { boardId1, boardId2 })
    return { board1: null, board2: null }
  }
}

/**
 * Get score distribution
 */
export async function getScoreDistribution(): Promise<
  Array<{ range: string; min: number; max: number; count: number; percentage: number }>
> {
  try {
    const scores = await calculateAllBoardScores()

    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '20-40', min: 20, max: 40, count: 0 },
      { range: '40-60', min: 40, max: 60, count: 0 },
      { range: '60-80', min: 60, max: 80, count: 0 },
      { range: '80-90', min: 80, max: 90, count: 0 },
      { range: '90-100', min: 90, max: 100, count: 0 },
    ]

    scores.forEach((s) => {
      for (const bucket of buckets) {
        if (s.overallScore >= bucket.min && s.overallScore <= bucket.max) {
          bucket.count++
          break
        }
      }
    })

    const total = scores.length
    return buckets.map((b) => ({
      ...b,
      percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
    }))
  } catch (error) {
    logger.error('Failed to get score distribution', error as Error)
    return []
  }
}
