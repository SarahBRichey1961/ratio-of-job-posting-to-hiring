import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getBoardRepostFrequency,
  getAllBoardsRepostFrequency,
  getRepostTrends,
  getRepostFrequencyByRoleFamily,
  getRankedBoardsByRepostFrequency,
  compareRepostFrequency,
  getRepostSeverity,
  getTopRepostedPostings,
  getRepostingBoardsForPosting,
} from '@/lib/repostFrequency'

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
    const { boardId, boardId2, postingId, action, days } = req.query

    try {
      if (action === 'all') {
        // Get metrics for all boards
        const metrics = await getAllBoardsRepostFrequency()
        return res.status(200).json({
          success: true,
          data: metrics,
        })
      } else if (action === 'ranked') {
        // Get boards ranked by repost frequency
        const ranked = await getRankedBoardsByRepostFrequency()
        return res.status(200).json({
          success: true,
          data: ranked,
        })
      } else if (action === 'trends' && boardId) {
        // Get repost trends
        const trends = await getRepostTrends(
          Number(boardId),
          days ? Number(days) : 30
        )
        return res.status(200).json({
          success: true,
          data: trends,
        })
      } else if (action === 'by-role') {
        // Get repost frequency by role family
        const byRole = await getRepostFrequencyByRoleFamily(20)
        return res.status(200).json({
          success: true,
          data: byRole,
        })
      } else if (action === 'severity' && boardId) {
        // Get severity assessment
        const severity = await getRepostSeverity(Number(boardId))
        return res.status(200).json({
          success: true,
          data: severity,
        })
      } else if (action === 'top-reposted' && boardId) {
        // Get top reposted postings for a board
        const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 10
        const topReposted = await getTopRepostedPostings(Number(boardId), limit)
        return res.status(200).json({
          success: true,
          data: topReposted,
        })
      } else if (action === 'reposting-boards' && postingId) {
        // Get boards that have reposted a specific posting
        const boards = await getRepostingBoardsForPosting(String(postingId))
        return res.status(200).json({
          success: true,
          data: boards,
        })
      } else if (action === 'compare' && boardId && boardId2) {
        // Compare two boards
        const comparison = await compareRepostFrequency(
          Number(boardId),
          Number(boardId2)
        )
        return res.status(200).json({
          success: true,
          data: comparison,
        })
      } else if (boardId) {
        // Get metrics for specific board
        const metrics = await getBoardRepostFrequency(Number(boardId))
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
        error: 'Failed to get repost frequency metrics',
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
