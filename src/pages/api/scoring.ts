import type { NextApiRequest, NextApiResponse } from 'next'
import {
  calculateBoardScore,
  calculateAllBoardScores,
  getRankedBoardsByScore,
  getScoreComponentBreakdown,
  getBoardScoreTrends,
  getScoresByRoleFamily,
  compareScores,
  getScoreDistribution,
} from '@/lib/scoringEngine'

type ResponseData = {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'GET') {
    const { boardId, boardId2, action, days } = req.query

    try {
      if (action === 'all') {
        // Get all scores
        const scores = await calculateAllBoardScores()
        return res.status(200).json({
          success: true,
          data: scores,
        })
      } else if (action === 'ranked') {
        // Get ranked boards
        const ranked = await getRankedBoardsByScore()
        return res.status(200).json({
          success: true,
          data: ranked,
        })
      } else if (action === 'breakdown' && boardId) {
        // Get score component breakdown
        const breakdown = await getScoreComponentBreakdown(Number(boardId))
        return res.status(200).json({
          success: true,
          data: breakdown,
        })
      } else if (action === 'trends' && boardId) {
        // Get score trends
        const trends = await getBoardScoreTrends(
          Number(boardId),
          days ? Number(days) : 30
        )
        return res.status(200).json({
          success: true,
          data: trends,
        })
      } else if (action === 'by-role') {
        // Get scores by role family
        const byRole = await getScoresByRoleFamily(20)
        return res.status(200).json({
          success: true,
          data: byRole,
        })
      } else if (action === 'distribution') {
        // Get score distribution
        const distribution = await getScoreDistribution()
        return res.status(200).json({
          success: true,
          data: distribution,
        })
      } else if (action === 'compare' && boardId && boardId2) {
        // Compare scores
        const comparison = await compareScores(Number(boardId), Number(boardId2))
        return res.status(200).json({
          success: true,
          data: comparison,
        })
      } else if (boardId) {
        // Get score for specific board
        const score = await calculateBoardScore(Number(boardId))
        return res.status(200).json({
          success: true,
          data: score,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get scores',
      })
    }
  } else if (req.method === 'POST') {
    const { action, boardId } = req.body

    try {
      if (action === 'compute-all') {
        // Recompute all scores
        const scores = await calculateAllBoardScores()
        return res.status(200).json({
          success: true,
          data: { computed: scores.length, scores },
        })
      } else if (action === 'compute' && boardId) {
        // Recompute single board score
        const score = await calculateBoardScore(boardId)
        return res.status(200).json({
          success: true,
          data: score,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid action',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to compute scores',
      })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }
}
