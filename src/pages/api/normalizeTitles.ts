import type { NextApiRequest, NextApiResponse } from 'next'
import { normalizeJobTitle, getTitleSimilarity, normalizeTitles } from '@/lib/titleNormalization'

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
    const { title } = req.query

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title parameter is required',
      })
    }

    try {
      const normalized = normalizeJobTitle(title)
      return res.status(200).json({
        success: true,
        data: {
          original: title,
          normalized,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to normalize title',
      })
    }
  } else if (req.method === 'POST') {
    const { action, titles, title1, title2 } = req.body

    try {
      if (action === 'bulk-normalize') {
        if (!Array.isArray(titles)) {
          return res.status(400).json({
            success: false,
            error: 'titles must be an array',
          })
        }

        const normalized = normalizeTitles(titles)
        return res.status(200).json({
          success: true,
          data: normalized,
        })
      } else if (action === 'similarity') {
        if (!title1 || !title2) {
          return res.status(400).json({
            success: false,
            error: 'title1 and title2 are required',
          })
        }

        const similarity = getTitleSimilarity(title1, title2)
        return res.status(200).json({
          success: true,
          data: {
            title1,
            title2,
            similarity: Math.round(similarity * 100) / 100,
          },
        })
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        })
      }
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
