import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getLifespanStatsForBoard,
  getAllBoardsLifespanStats,
  getPostingTimeline,
  bulkUpdateAllLifespans,
} from '@/lib/lifespanTracking'

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
    const { boardId, postingId, action } = req.query

    try {
      if (action === 'timeline' && postingId) {
        // Get posting timeline
        const timeline = await getPostingTimeline(Number(postingId))
        return res.status(200).json({
          success: true,
          data: timeline,
        })
      } else if (boardId) {
        // Get lifespan stats for specific board
        const stats = await getLifespanStatsForBoard(Number(boardId))
        return res.status(200).json({
          success: true,
          data: stats,
        })
      } else {
        // Get stats for all boards
        const allStats = await getAllBoardsLifespanStats()
        return res.status(200).json({
          success: true,
          data: allStats,
        })
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get lifespan stats',
      })
    }
  } else if (req.method === 'POST') {
    const { action } = req.body

    try {
      if (action === 'update-all') {
        // Bulk update all lifespans
        const result = await bulkUpdateAllLifespans()
        return res.status(200).json({
          success: true,
          data: result,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
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
