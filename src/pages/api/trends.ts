import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createSnapshot,
  getBoardTrends,
  getAllBoardTrends,
  getWeeklyComparison,
  detectAnomalies,
  getRoleTrends,
} from '@/lib/trendTracking'

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
    const { boardId, action } = req.query

    try {
      if (action === 'board' && boardId) {
        // Get trends for specific board
        const trends = await getBoardTrends(Number(boardId))
        return res.status(200).json({
          success: true,
          data: trends,
        })
      } else if (action === 'all') {
        // Get trends for all boards
        const trends = await getAllBoardTrends()
        return res.status(200).json({
          success: true,
          data: trends,
        })
      } else if (action === 'weekly' && boardId) {
        // Get weekly comparison
        const weekly = await getWeeklyComparison(Number(boardId))
        return res.status(200).json({
          success: true,
          data: weekly,
        })
      } else if (action === 'anomalies' && boardId) {
        // Get anomaly alerts
        const anomalies = await detectAnomalies(Number(boardId))
        return res.status(200).json({
          success: true,
          data: anomalies,
        })
      } else if (action === 'roles') {
        // Get role trends
        const roleTrends = await getRoleTrends()
        return res.status(200).json({
          success: true,
          data: roleTrends,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get trends',
      })
    }
  } else if (req.method === 'POST') {
    const { boardId, overallScore, lifespan, repostRate, employerScore, candidateScore, postings } = req.body

    try {
      if (!boardId || overallScore === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: boardId, overallScore',
        })
      }

      const snapshot = await createSnapshot(
        boardId,
        overallScore,
        lifespan || 0,
        repostRate || 0,
        employerScore || 50,
        candidateScore || 50,
        postings || 0
      )

      if (!snapshot) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create snapshot',
        })
      }

      return res.status(201).json({
        success: true,
        data: snapshot,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create snapshot',
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
