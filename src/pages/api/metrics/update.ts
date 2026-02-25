import type { NextApiRequest, NextApiResponse } from 'next'
import { updateIndustryMetrics } from '@/lib/industryInsights'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')

interface UpdateResponse {
  success: boolean
  message: string
  timestamp: string
  industriesUpdated?: number
  error?: string
}

/**
 * API endpoint to manually trigger industry metrics update
 * 
 * POST /api/metrics/update
 * 
 * Optional query params:
 * - force=true: Force update even if cache is fresh
 * - apiKey=xxx: Verify with API key for security
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
      timestamp: new Date().toISOString(),
    })
  }

  try {
    logger.info('Metrics update triggered via API')

    // Optional: Verify API key if provided
    const apiKey = req.query.apiKey as string
    if (apiKey && apiKey !== process.env.METRICS_UPDATE_API_KEY) {
      logger.warn('Invalid API key provided for metrics update')
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid API key',
        timestamp: new Date().toISOString(),
      })
    }

    // Trigger the update
    const result = await updateIndustryMetrics()
    
    if (!result.success) {
      logger.warn('Industry metrics update had issues', result.error)
      return res.status(500).json({
        success: false,
        message: 'Failed to update metrics',
        timestamp: new Date().toISOString(),
        error: result.error,
      })
    }

    logger.info('Industry metrics update completed successfully')

    return res.status(200).json({
      success: true,
      message: 'Industry metrics updated successfully',
      timestamp: new Date().toISOString(),
      industriesUpdated: result.industriesUpdated,
    })

  } catch (error) {
    logger.error('Error updating industry metrics', error as Error)
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update metrics',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
