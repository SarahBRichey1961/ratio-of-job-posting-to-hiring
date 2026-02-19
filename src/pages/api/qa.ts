import type { NextApiRequest, NextApiResponse } from 'next'
import { runAllQAChecks } from '@/lib/qaValidator'

type ResponseData = {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    try {
      // Run comprehensive QA checks
      const results = await runAllQAChecks()

      return res.status(200).json({
        success: true,
        data: results,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to run QA checks',
      })
    }
  } else if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        message: 'QA endpoint ready. Send POST request to run checks.',
      },
    })
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }
}
