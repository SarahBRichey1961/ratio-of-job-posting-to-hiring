import type { NextApiRequest, NextApiResponse } from 'next'
import { getJobBoards, getJobBoardsByCategory, countJobBoards } from '@/lib/jobBoards'

type ResponseData = {
  success: boolean
  data?: any
  error?: string
  total?: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { category, grouped } = req.query

    // Get total count
    const total = await countJobBoards()

    if (grouped === 'true') {
      // Return grouped by category
      const data = await getJobBoardsByCategory()
      return res.status(200).json({
        success: true,
        data,
        total,
      })
    } else if (category && typeof category === 'string') {
      // Return filtered by category
      const data = await getJobBoards(category)
      return res.status(200).json({
        success: true,
        data,
        total: data.length,
      })
    } else {
      // Return all boards
      const data = await getJobBoards()
      return res.status(200).json({
        success: true,
        data,
        total,
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
