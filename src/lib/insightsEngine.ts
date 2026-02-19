import { supabase } from '@/lib/supabase'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')

export interface BoardTrend {
  boardId: number
  boardName: string
  currentScore: number
  previousScore: number
  scoreChange: number
  percentageChange: number
  trend: 'rising' | 'declining' | 'stable'
  surveyDataPoints: {
    employerSurveys: number
    candidateSurveys: number
    avgEmployerSatisfaction: number
    avgCandidateSatisfaction: number
  }
}

export interface WeeklyInsights {
  period: {
    startDate: Date
    endDate: Date
  }
  topBoards: BoardTrend[]
  bottomBoards: BoardTrend[]
  risingBoards: BoardTrend[]
  decliningBoards: BoardTrend[]
  neutralBoards: BoardTrend[]
  surveyStats: {
    totalEmployerSurveys: number
    totalCandidateSurveys: number
    weeklyEmployerSurveys: number
    weeklyCandidateSurveys: number
  }
  insights: {
    title: string
    description: string
    recommendation: string
  }[]
}

/**
 * Get board score from efficiency_scores table
 */
async function getBoardScore(jobBoardId: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('efficiency_scores')
      .select('overall_score')
      .eq('job_board_id', jobBoardId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data?.overall_score || null
  } catch (error) {
    logger.error('Failed to get board score', error as Error, { jobBoardId })
    return null
  }
}

/**
 * Get previous week's score for trend comparison
 */
async function getPreviousWeekScore(jobBoardId: number): Promise<number | null> {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('efficiency_scores')
      .select('overall_score')
      .eq('job_board_id', jobBoardId)
      .lt('computed_at', oneWeekAgo.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data?.overall_score || null
  } catch (error) {
    logger.error('Failed to get previous week score', error as Error, {
      jobBoardId,
    })
    return null
  }
}

/**
 * Get survey statistics for a board
 */
async function getBoardSurveyStats(
  jobBoardId: number
): Promise<{
  employerSurveys: number
  candidateSurveys: number
  avgEmployerSatisfaction: number
  avgCandidateSatisfaction: number
} | null> {
  try {
    const { data: employerStats } = await supabase
      .from('employer_survey_stats_by_board')
      .select('survey_count, avg_candidate_quality, avg_recommendation')
      .eq('job_board_id', jobBoardId)
      .single()

    const { data: candidateStats } = await supabase
      .from('candidate_survey_stats_by_board')
      .select('survey_count, overall_satisfaction_score')
      .eq('job_board_id', jobBoardId)
      .single()

    return {
      employerSurveys: employerStats?.survey_count || 0,
      candidateSurveys: candidateStats?.survey_count || 0,
      avgEmployerSatisfaction: employerStats?.avg_candidate_quality || 0,
      avgCandidateSatisfaction: candidateStats?.overall_satisfaction_score || 0,
    }
  } catch (error) {
    logger.error('Failed to get survey stats', error as Error, { jobBoardId })
    return null
  }
}

/**
 * Calculate board trends for the week
 */
async function calculateBoardTrends(): Promise<BoardTrend[]> {
  try {
    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id, name')

    if (boardsError) throw boardsError

    const trends: BoardTrend[] = []

    for (const board of boards || []) {
      const currentScore = await getBoardScore(board.id)
      const previousScore = await getPreviousWeekScore(board.id)
      const surveyStats = await getBoardSurveyStats(board.id)

      if (!currentScore || !surveyStats) continue

      const scoreChange = currentScore - (previousScore || currentScore)
      const percentageChange =
        previousScore && previousScore > 0
          ? (scoreChange / previousScore) * 100
          : 0

      let trend: 'rising' | 'declining' | 'stable'
      if (scoreChange > 5) {
        trend = 'rising'
      } else if (scoreChange < -5) {
        trend = 'declining'
      } else {
        trend = 'stable'
      }

      trends.push({
        boardId: board.id,
        boardName: board.name,
        currentScore: Math.round(currentScore),
        previousScore: Math.round(previousScore || currentScore),
        scoreChange: Math.round(scoreChange * 10) / 10,
        percentageChange: Math.round(percentageChange * 10) / 10,
        trend,
        surveyDataPoints: surveyStats,
      })
    }

    return trends.sort((a, b) => b.currentScore - a.currentScore)
  } catch (error) {
    logger.error('Failed to calculate board trends', error as Error)
    return []
  }
}

/**
 * Get weekly survey statistics
 */
async function getWeeklySurveyStats(): Promise<{
  totalEmployerSurveys: number
  totalCandidateSurveys: number
  weeklyEmployerSurveys: number
  weeklyCandidateSurveys: number
}> {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Total employer surveys
    const { count: totalEmployer } = await supabase
      .from('employer_surveys')
      .select('*', { count: 'exact', head: true })

    // Weekly employer surveys
    const { count: weeklyEmployer } = await supabase
      .from('employer_surveys')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Total candidate surveys
    const { count: totalCandidate } = await supabase
      .from('candidate_surveys')
      .select('*', { count: 'exact', head: true })

    // Weekly candidate surveys
    const { count: weeklyCandidate } = await supabase
      .from('candidate_surveys')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    return {
      totalEmployerSurveys: totalEmployer || 0,
      totalCandidateSurveys: totalCandidate || 0,
      weeklyEmployerSurveys: weeklyEmployer || 0,
      weeklyCandidateSurveys: weeklyCandidate || 0,
    }
  } catch (error) {
    logger.error('Failed to get weekly survey stats', error as Error)
    return {
      totalEmployerSurveys: 0,
      totalCandidateSurveys: 0,
      weeklyEmployerSurveys: 0,
      weeklyCandidateSurveys: 0,
    }
  }
}

/**
 * Generate insights from trends
 */
function generateInsights(trends: BoardTrend[]): Array<{
  title: string
  description: string
  recommendation: string
}> {
  const insights: Array<{
    title: string
    description: string
    recommendation: string
  }> = []

  const rising = trends.filter((t) => t.trend === 'rising')
  const declining = trends.filter((t) => t.trend === 'declining')
  const topPerformers = trends.slice(0, 3)
  const needsImprovement = trends.slice(Math.max(0, trends.length - 3))

  // Rising boards insight
  if (rising.length > 0) {
    const topRising = rising[0]
    insights.push({
      title: `🚀 ${topRising.boardName} is Rising Fast`,
      description: `${topRising.boardName} gained ${topRising.scoreChange} points this week (+${topRising.percentageChange}%). With ${topRising.surveyDataPoints.employerSurveys} employer surveys and ${topRising.surveyDataPoints.candidateSurveys} candidate surveys, this board is a strong performer.`,
      recommendation: `Consider featuring ${topRising.boardName} more prominently in recommendations.`,
    })
  }

  // Declining boards insight
  if (declining.length > 0) {
    const topDeclining = declining[0]
    insights.push({
      title: `📉 ${topDeclining.boardName} Needs Attention`,
      description: `${topDeclining.boardName} lost ${Math.abs(topDeclining.scoreChange)} points this week (${topDeclining.percentageChange}%). Review recent survey feedback to understand what changed.`,
      recommendation: `Contact ${topDeclining.boardName} or investigate candidate feedback for issues.`,
    })
  }

  // Top performer insight
  if (topPerformers.length > 0) {
    const best = topPerformers[0]
    insights.push({
      title: `⭐ Best Overall: ${best.boardName}`,
      description: `${best.boardName} leads with a ${best.currentScore}/100 score. Candidates report ${best.surveyDataPoints.avgCandidateSatisfaction}/5 satisfaction and employers report ${best.surveyDataPoints.avgEmployerSatisfaction}/5 quality ratings.`,
      recommendation: `This is your top recommendation for job seekers.`,
    })
  }

  return insights
}

/**
 * Generate comprehensive weekly insights report
 */
export async function generateWeeklyInsights(): Promise<WeeklyInsights> {
  try {
    const trends = await calculateBoardTrends()
    const surveyStats = await getWeeklySurveyStats()

    const today = new Date()
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      period: {
        startDate,
        endDate: today,
      },
      topBoards: trends.slice(0, 5),
      bottomBoards: trends.slice(Math.max(0, trends.length - 5)).reverse(),
      risingBoards: trends.filter((t) => t.trend === 'rising').slice(0, 5),
      decliningBoards: trends
        .filter((t) => t.trend === 'declining')
        .slice(0, 5),
      neutralBoards: trends.filter((t) => t.trend === 'stable').slice(0, 3),
      surveyStats,
      insights: generateInsights(trends),
    }
  } catch (error) {
    logger.error('Failed to generate weekly insights', error as Error)
    return {
      period: {
        startDate: new Date(),
        endDate: new Date(),
      },
      topBoards: [],
      bottomBoards: [],
      risingBoards: [],
      decliningBoards: [],
      neutralBoards: [],
      surveyStats: {
        totalEmployerSurveys: 0,
        totalCandidateSurveys: 0,
        weeklyEmployerSurveys: 0,
        weeklyCandidateSurveys: 0,
      },
      insights: [
        {
          title: 'Unable to generate insights',
          description: 'There was an error generating this week insights.',
          recommendation: 'Please try again later.',
        },
      ],
    }
  }
}
