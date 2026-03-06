import React, { useState, useEffect, ReactNode } from 'react'
import { MetricCard, StatsSection, Card, Section } from '@/components/DashboardUI'

interface TrafficData {
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

export function TrafficMetrics() {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate traffic data - in production, this would fetch from an analytics service
    const mockTrafficData: TrafficData = {
      totalVisitors: 12847,
      totalPageviews: 45623,
      uniqueVisitors: 8934,
      avgSessionDuration: 284, // seconds
      bounceRate: 34.2,
      trafficTrend: 'up',
      trendValue: 12.5,
      topPages: [
        {
          page: 'Comparison',
          views: 18234,
          visitors: 4562,
          avgTime: 312,
        },
        {
          page: 'Insights',
          views: 12456,
          visitors: 3145,
          avgTime: 428,
        },
        {
          page: 'Recently Posted',
          views: 8934,
          visitors: 2301,
          avgTime: 156,
        },
        {
          page: 'Hub',
          views: 5234,
          visitors: 1562,
          avgTime: 523,
        },
        {
          page: 'Advertiser Dashboard',
          views: 765,
          visitors: 364,
          avgTime: 634,
        },
      ],
      pageStats: {
        comparison: { views: 18234, visitors: 4562 },
        insights: { views: 12456, visitors: 3145 },
        recentlyPosted: { views: 8934, visitors: 2301 },
        hub: { views: 5234, visitors: 1562 },
        advertiser: { views: 765, visitors: 364 },
      },
    }

    // Simulate API delay
    const timer = setTimeout(() => {
      setTrafficData(mockTrafficData)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <Card className="mb-8">
        <p className="text-gray-400">Loading traffic metrics...</p>
      </Card>
    )
  }

  if (!trafficData) {
    return null
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      default:
        return '→'
    }
  }

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <>
      <div className="mb-8 space-y-6">
      {/* Traffic Overview Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          📊 Site Traffic & Visitor Trends
        </h2>
        <p className="text-gray-400">Real-time traffic metrics and page navigation analytics</p>
      </div>

      {/* Traffic Stats Section */}
      <StatsSection>
        <MetricCard
          label="Total Visitors"
          value={trafficData.totalVisitors.toLocaleString()}
          subtitle="Unique visitors this month"
          icon="👥"
          trend={trafficData.trafficTrend}
          trendValue={`+${trafficData.trendValue}%`}
        />
        <MetricCard
          label="Total Page Views"
          value={trafficData.totalPageviews.toLocaleString()}
          subtitle="All page loads"
          icon="📄"
        />
        <MetricCard
          label="Avg Session Duration"
          value={formatSeconds(trafficData.avgSessionDuration)}
          subtitle="Time on site"
          icon="⏱️"
        />
        <MetricCard
          label="Bounce Rate"
          value={`${trafficData.bounceRate}%`}
          subtitle="Users who left immediately"
          icon="🚪"
        />
      </StatsSection>

      {/* Top Pages Section */}
      <Section title="🔥 Top Pages by Traffic">
        <div className="mb-6">
          <p className="text-gray-400">Pages driving the most visitor engagement</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Page</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Views</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Visitors</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Avg Time</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {trafficData.topPages.map((page, idx) => {
                const percentOfTotal = ((page.views / trafficData.totalPageviews) * 100).toFixed(1)
                return (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4 text-white font-medium">{page.page}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{page.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{page.visitors.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{formatSeconds(page.avgTime)}</td>
                    <td className="py-3 px-4 text-right text-gray-400 font-semibold">{percentOfTotal}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Page Details Grid */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">📍 Traffic by Page</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Comparison', data: trafficData.pageStats.comparison, icon: '⚖️' },
              { label: 'Insights', data: trafficData.pageStats.insights, icon: '💡' },
              { label: 'Recently Posted', data: trafficData.pageStats.recentlyPosted, icon: '🔥' },
              { label: 'Hub', data: trafficData.pageStats.hub, icon: '🚀' },
              { label: 'Advertiser', data: trafficData.pageStats.advertiser, icon: '📢' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm text-gray-400 mb-2">{item.label}</p>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-white">{item.data.views.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="text-lg font-semibold text-blue-400 mt-2">{item.data.visitors.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Visitors</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Traffic Insights */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">💬 Traffic Insights</h3>
        </div>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Comparison page</strong> is the most visited, driving 40% of all traffic with high engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Hub section</strong> has the longest average session duration (8m 43s), indicating strong content engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span><strong>Advertiser dashboard</strong> has lower traffic but targeted audience - focus on conversion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">↑</span>
            <span><strong>Overall traffic trend: {trafficData.trafficTrend}</strong></span>
          </li>
        </ul>
      </Card>
      </div>
    </>
  )
}
