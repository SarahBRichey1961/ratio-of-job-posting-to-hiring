import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * NOTE: This endpoint is deprecated - we now display GA data via direct dashboard link
 * in the TrafficMetrics component instead of fetching server-side.
 * 
 * Keeping this file for backward compatibility, but it's no longer called by the app.
 */

interface TrafficMetrics {
  totalVisitors: number
  totalPageviews: number
  uniqueVisitors: number
  avgSessionDuration: number
  bounceRate: number
  topPages: Array<{
    page: string
    views: number
    visitors: number
    avgTime: number
  }>
  pageStats: {
    comparison: { views: number; visitors: number }
    insights: { views: number; visitors: number }
    recentlyPosted: { views: number; visitors: number }
    hub: { views: number; visitors: number }
    advertiser: { views: number; visitors: number }
  }
  trafficTrend: 'up' | 'down' | 'stable'
  trendValue: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrafficMetrics | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Return placeholder data - use Google Analytics Dashboard directly instead
  // See: https://analytics.google.com/analytics/web/#/a386799698p527402328/realtime/overview
  return res.status(200).json({
    totalVisitors: 0,
    totalPageviews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    topPages: [],
    pageStats: {
      comparison: { views: 0, visitors: 0 },
      insights: { views: 0, visitors: 0 },
      recentlyPosted: { views: 0, visitors: 0 },
      hub: { views: 0, visitors: 0 },
      advertiser: { views: 0, visitors: 0 },
    },
    trafficTrend: 'stable',
    trendValue: 0,
  })
}
