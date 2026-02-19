import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ComparisonRow {
  name: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComparisonRow[] | { error: string }>
) {
  try {
    // Fetch all efficiency scores
    const { data: scores, error: scoreError } = await supabase
      .from('efficiency_scores')
      .select('board_id, overall_score, grade_letter')

    if (scoreError) throw scoreError

    // Fetch lifespan metrics
    const { data: lifespan, error: lifespanError } = await supabase
      .from('job_boards')
      .select(
        'id, name, avg_lifespan_days, avg_repost_rate, total_postings_count'
      )

    if (lifespanError) throw lifespanError

    // Fetch trend data
    const { data: trends, error: trendError } = await supabase
      .from('board_trend_summary')
      .select('board_id, current_score, previous_score, trend_direction')

    if (trendError) throw trendError

    // Build comparison rows by joining data
    const comparisonRows: ComparisonRow[] = (lifespan || []).map((board: any) => {
      const scoreData = (scores || []).find((s: any) => s.board_id === board.id)
      const trendData = (trends || []).find((t: any) => t.board_id === board.id)

      const trendValue = trendData
        ? ((trendData.current_score - trendData.previous_score) / trendData.previous_score) * 100
        : 0

      return {
        name: board.name,
        score: scoreData?.overall_score || 50,
        grade: scoreData?.grade_letter || 'C',
        avgLifespan: board.avg_lifespan_days || 15,
        repostRate: board.avg_repost_rate || 10,
        totalPostings: board.total_postings_count || 0,
        topRole: 'Software Engineer', // Will enhance with dimensional data
        trend: trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable',
        trendValue: Math.round(trendValue * 10) / 10,
        dataQuality: 100 - (board.avg_repost_rate || 0),
      }
    })

    res.status(200).json(comparisonRows)
  } catch (error) {
    console.error('Comparison API error:', error)
    res.status(500).json({ error: 'Failed to fetch comparison data' })
  }
}
