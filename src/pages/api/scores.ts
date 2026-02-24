import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'
import { calculateBoardScore } from '@/lib/scoringEngine'

interface RequestBody {
  boardIds: number[]
  industry?: string
}

interface ResponseData {
  scores: Array<any>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ scores: [], error: 'Method not allowed' })
  }

  try {
    const { boardIds, industry } = req.body as RequestBody

    if (!boardIds || boardIds.length === 0) {
      return res.status(200).json({ scores: [] })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ scores: [], error: 'Database connection failed' })
    }

    // Fetch all board names for ranking
    const { data: allBoards } = await supabase
      .from('job_boards')
      .select('id, name')

    // Calculate scores for requested boards
    const scores = []
    for (const boardId of boardIds) {
      try {
        const score = await calculateBoardScore(boardId)
        if (score) {
          scores.push(score)
        }
      } catch (error) {
        // If score calculation fails, create a default score
        const { data: board } = await supabase
          .from('job_boards')
          .select('id, name')
          .eq('id', boardId)
          .single()

        if (board) {
          scores.push({
            jobBoardId: boardId,
            boardName: board.name,
            overallScore: 0,
            lifespanScore: 0,
            repostScore: 0,
            employerSurveyScore: 0,
            candidateSurveyScore: 0,
            qualityAdjustment: 1.0,
            dataCompletenessRatio: 0,
            percentile: 0,
            trend: 0,
            lastUpdated: new Date(),
          })
        }
      }
    }

    // Sort by overall score descending
    scores.sort((a, b) => b.overallScore - a.overallScore)

    // Add rank and grade
    scores.forEach((score, idx) => {
      score.rank = idx + 1
      score.percentile = Math.round(((scores.length - idx) / scores.length) * 100)

      // Calculate grade
      if (score.overallScore >= 85) score.grade = 'A'
      else if (score.overallScore >= 70) score.grade = 'B'
      else if (score.overallScore >= 60) score.grade = 'C'
      else if (score.overallScore >= 50) score.grade = 'D'
      else score.grade = 'F'
    })

    res.status(200).json({ scores })
  } catch (error) {
    console.error('Error fetching scores:', error)
    res.status(500).json({ scores: [], error: 'Failed to fetch scores' })
  }
}
