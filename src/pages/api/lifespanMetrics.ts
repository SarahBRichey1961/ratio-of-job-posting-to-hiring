import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getBoardLifespanMetrics,
  getAllBoardsLifespanMetrics,
  getLifespanTrends,
  getLifespanDistribution,
  getLifespanByRoleFamily,
  getRankedBoardsByLifespan,
  compareLifespans,
  getBoardPercentileRank,
} from '@/lib/lifespanMetrics'

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
        // Get metrics for all boards
        const metrics = await getAllBoardsLifespanMetrics()
        return res.status(200).json({
          success: true,
          data: metrics,
        })
      } else if (action === 'ranked') {
        // Get boards ranked by lifespan
        const ranked = await getRankedBoardsByLifespan()
        return res.status(200).json({
          success: true,
          data: ranked,
        })
      } else if (action === 'trends' && boardId) {
        // Get lifespan trends
        const trends = await getLifespanTrends(
          Number(boardId),
          days ? Number(days) : 30
        )
        return res.status(200).json({
          success: true,
          data: trends,
        })
      } else if (action === 'distribution' && boardId) {
        // Get lifespan distribution
        const distribution = await getLifespanDistribution(Number(boardId))
        return res.status(200).json({
          success: true,
          data: distribution,
        })
      } else if (action === 'by-role') {
        // Get lifespan by role family
        const byRole = await getLifespanByRoleFamily(20)
        return res.status(200).json({
          success: true,
          data: byRole,
        })
      } else if (action === 'percentile' && boardId) {
        // Get percentile rank
        const percentile = await getBoardPercentileRank(Number(boardId))
        return res.status(200).json({
          success: true,
          data: percentile,
        })
      } else if (action === 'compare' && boardId && boardId2) {
        // Compare two boards
        const comparison = await compareLifespans(
          Number(boardId),
          Number(boardId2)
        )
        return res.status(200).json({
          success: true,
          data: comparison,
        })
      } else if (boardId) {
        // Get metrics for specific board
        const metrics = await getBoardLifespanMetrics(Number(boardId))
        return res.status(200).json({
          success: true,
          data: metrics,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get lifespan metrics',
      })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }
}
