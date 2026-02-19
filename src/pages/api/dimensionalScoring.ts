import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getRoleScores,
  getIndustryScores,
  getBestBoardsForRole,
  getRoleHiringVelocity,
  getRoleRecommendations,
} from '@/lib/dimensionalScoring'

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
    const { role, action } = req.query

    try {
      if (action === 'roles') {
        // Get all role scores
        const roleScores = await getRoleScores()
        return res.status(200).json({
          success: true,
          data: roleScores,
        })
      } else if (action === 'industries') {
        // Get all industry scores
        const industryScores = await getIndustryScores()
        return res.status(200).json({
          success: true,
          data: industryScores,
        })
      } else if (action === 'role-details' && role) {
        // Get best boards for specific role
        const boards = await getBestBoardsForRole(String(role))
        return res.status(200).json({
          success: true,
          data: boards,
        })
      } else if (action === 'velocity') {
        // Get hiring velocity by role
        const velocity = await getRoleHiringVelocity()
        return res.status(200).json({
          success: true,
          data: velocity,
        })
      } else if (action === 'recommendations') {
        // Get role recommendations
        const recommendations = await getRoleRecommendations()
        return res.status(200).json({
          success: true,
          data: recommendations,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get dimensional scores',
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
