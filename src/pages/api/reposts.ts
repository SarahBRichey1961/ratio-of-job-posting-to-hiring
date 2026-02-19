import type { NextApiRequest, NextApiResponse } from 'next'
import {
  findRepostsForPosting,
  findAllRepostsForBoard,
  getRepostStatsForBoard,
  getAllRepostStats,
  bulkDetectRepostsForBoard,
  bulkDetectAllReposts,
} from '@/lib/repostDetection'

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
    const { postingId, boardId, action } = req.query

    try {
      if (action === 'find' && postingId) {
        // Find reposts for a specific posting
        const reposts = await findRepostsForPosting(Number(postingId))
        return res.status(200).json({
          success: true,
          data: reposts,
        })
      } else if (action === 'board-clusters' && boardId) {
        // Find repost clusters for a board
        const clusters = await findAllRepostsForBoard(Number(boardId))
        return res.status(200).json({
          success: true,
          data: clusters,
        })
      } else if (action === 'stats' && boardId) {
        // Get repost stats for a specific board
        const stats = await getRepostStatsForBoard(Number(boardId))
        return res.status(200).json({
          success: true,
          data: stats,
        })
      } else if (action === 'all-stats') {
        // Get repost stats for all boards
        const allStats = await getAllRepostStats()
        return res.status(200).json({
          success: true,
          data: allStats,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get repost data',
      })
    }
  } else if (req.method === 'POST') {
    const { action, boardId } = req.body

    try {
      if (action === 'detect-board' && boardId) {
        // Bulk detect reposts for a specific board
        const result = await bulkDetectRepostsForBoard(boardId)
        return res.status(200).json({
          success: true,
          data: result,
        })
      } else if (action === 'detect-all') {
        // Bulk detect reposts across all boards
        const result = await bulkDetectAllReposts()
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
