import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getPendingJobs,
  getPipelineRunHistory,
  getPipelineStats,
} from '@/lib/pipeline'
import { schedulePipelineRun } from '@/lib/pipelineOrchestrator'

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
    const { action } = req.query

    try {
      if (action === 'pending') {
        // Get pending jobs
        const jobs = await getPendingJobs()
        return res.status(200).json({
          success: true,
          data: jobs,
        })
      } else if (action === 'history') {
        // Get run history
        const history = await getPipelineRunHistory()
        return res.status(200).json({
          success: true,
          data: history,
        })
      } else if (action === 'stats') {
        // Get pipeline statistics
        const stats = await getPipelineStats()
        return res.status(200).json({
          success: true,
          data: stats,
        })
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action',
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get pipeline data',
      })
    }
  } else if (req.method === 'POST') {
    const { action } = req.body

    try {
      if (action === 'run') {
        // Trigger pipeline run
        const result = await schedulePipelineRun()
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
        error: 'Failed to run pipeline',
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
