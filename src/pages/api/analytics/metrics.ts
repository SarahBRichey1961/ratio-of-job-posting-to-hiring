import type { NextApiRequest, NextApiResponse } from 'next'

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

  try {
    // Import GA client
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data')

    const propertyId = '527402328'
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (!credentials) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS not set, returning placeholder data')
      return res.status(200).json({
        totalVisitors: 0,
        totalPageviews: 0,
        uniqueVisitors: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        trafficTrend: 'stable',
        trendValue: 0,
        topPages: [],
        pageStats: {
          comparison: { views: 0, visitors: 0 },
          insights: { views: 0, visitors: 0 },
          recentlyPosted: { views: 0, visitors: 0 },
          hub: { views: 0, visitors: 0 },
          advertiser: { views: 0, visitors: 0 },
        },
      })
    }

    // Parse credentials from env variable (should be JSON string)
    let credentialsObj
    try {
      credentialsObj = JSON.parse(credentials)
    } catch {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS')
      throw new Error('Invalid credentials format')
    }

    const client = new BetaAnalyticsDataClient({
      credentials: credentialsObj,
    })

    // Set date range (last 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const endDate = now.toISOString().split('T')[0]
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    // Fetch overview metrics
    const overviewResponse = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    })

    // Fetch top pages
    const pagesResponse = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    })

    // Extract metrics from response
    const overviewRow = overviewResponse.rows?.[0]?.metricValues || []
    const totalVisitors = parseInt(overviewRow[0]?.value || '0', 10)
    const totalPageviews = parseInt(overviewRow[1]?.value || '0', 10)
    const avgSessionDuration = Math.round(parseFloat(overviewRow[2]?.value || '0'))
    const bounceRate = parseFloat(overviewRow[3]?.value || '0').toFixed(1)

    // Parse top pages
    const topPages: TrafficMetrics['topPages'] = (pagesResponse.rows || []).map((row) => {
      const [path, title] = row.dimensionValues || ['', '']
      const [views, visitors, avgTime] = row.metricValues || [
        { value: '0' },
        { value: '0' },
        { value: '0' },
      ]

      return {
        page: title?.value || path?.value || 'Unknown',
        views: parseInt(views?.value || '0', 10),
        visitors: parseInt(visitors?.value || '0', 10),
        avgTime: Math.round(parseFloat(avgTime?.value || '0')),
      }
    })

    // Calculate page-specific stats
    const pageStats: TrafficMetrics['pageStats'] = {
      comparison: { views: 0, visitors: 0 },
      insights: { views: 0, visitors: 0 },
      recentlyPosted: { views: 0, visitors: 0 },
      hub: { views: 0, visitors: 0 },
      advertiser: { views: 0, visitors: 0 },
    }

    topPages.forEach((page) => {
      const pageLower = page.page.toLowerCase()
      if (pageLower.includes('comparison')) {
        pageStats.comparison.views += page.views
        pageStats.comparison.visitors += page.visitors
      } else if (pageLower.includes('insights')) {
        pageStats.insights.views += page.views
        pageStats.insights.visitors += page.visitors
      } else if (pageLower.includes('recently') || pageLower.includes('posted')) {
        pageStats.recentlyPosted.views += page.views
        pageStats.recentlyPosted.visitors += page.visitors
      } else if (pageLower.includes('hub')) {
        pageStats.hub.views += page.views
        pageStats.hub.visitors += page.visitors
      } else if (pageLower.includes('advertiser') || pageLower.includes('ads')) {
        pageStats.advertiser.views += page.views
        pageStats.advertiser.visitors += page.visitors
      }
    })

    // Calculate trend (compare to previous period)
    const prevStartDate = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const prevEndDate = thirtyDaysAgo.toISOString().split('T')[0]

    const prevResponse = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
      metrics: [{ name: 'activeUsers' }],
    })

    const prevVisitors = parseInt(prevResponse.rows?.[0]?.metricValues?.[0]?.value || '0', 10)
    const trendValue =
      prevVisitors > 0 ? parseFloat((((totalVisitors - prevVisitors) / prevVisitors) * 100).toFixed(1)) : 0
    const trafficTrend: 'up' | 'down' | 'stable' = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable'

    res.status(200).json({
      totalVisitors,
      totalPageviews,
      uniqueVisitors: totalVisitors,
      avgSessionDuration,
      bounceRate: parseFloat(bounceRate),
      trafficTrend,
      trendValue: Math.abs(trendValue),
      topPages,
      pageStats,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics data' })
  }
}
