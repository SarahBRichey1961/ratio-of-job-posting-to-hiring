import React from 'react'
import { IndustryMetric } from '@/lib/industryInsights'

interface IndustryBreakdownProps {
  metrics: IndustryMetric[]
}

export function IndustryBreakdown({ metrics }: IndustryBreakdownProps) {
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

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400 font-semibold'
    if (score >= 70) return 'text-blue-400 font-semibold'
    if (score >= 60) return 'text-yellow-400 font-semibold'
    return 'text-red-400 font-semibold'
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">No industry metrics available</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Industry</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Boards</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Avg Score</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Lifespan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Repost Rate</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Top Board</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {metrics.map((metric, idx) => (
              <tr
                key={metric.id}
                className={idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}
              >
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {metric.industry}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {metric.total_boards}
                </td>
                <td className={`px-6 py-4 text-sm ${getScoreColor(metric.avg_score)}`}>
                  {metric.avg_score}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {metric.median_lifespan}d
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {metric.avg_repost_rate.toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                  {metric.top_board}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-700 border-t border-gray-600">
        <p className="text-xs text-gray-400">
          📊 {metrics.length} industries tracked • Last updated: {new Date(metrics[0]?.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

interface IndustryStatsProps {
  metrics: IndustryMetric[]
}

export function IndustryStats({ metrics }: IndustryStatsProps) {
  if (!metrics || metrics.length === 0) {
    return null
  }

  const avgScore = Math.round(
    metrics.reduce((sum, m) => sum + m.avg_score, 0) / metrics.length
  )
  const avgLifespan = Math.round(
    metrics.reduce((sum, m) => sum + m.median_lifespan, 0) / metrics.length
  )
  const avgRepostRate = (
    metrics.reduce((sum, m) => sum + m.avg_repost_rate, 0) / metrics.length
  ).toFixed(1)
  const totalBoards = metrics.reduce((sum, m) => sum + m.total_boards, 0)

  const upTrend = metrics.filter(m => m.trend === 'up').length
  const downTrend = metrics.filter(m => m.trend === 'down').length
  const stableTrend = metrics.filter(m => m.trend === 'stable').length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Avg Industry Score</p>
        <p className="text-2xl font-bold text-blue-400">{avgScore}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Total Job Boards</p>
        <p className="text-2xl font-bold text-green-400">{totalBoards}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Avg Lifespan</p>
        <p className="text-2xl font-bold text-purple-400">{avgLifespan}d</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Avg Repost Rate</p>
        <p className="text-2xl font-bold text-yellow-400">{avgRepostRate}%</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">📈 Up Trend</p>
        <p className="text-2xl font-bold text-green-400">{upTrend}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">📉 Down Trend</p>
        <p className="text-2xl font-bold text-red-400">{downTrend}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">→ Stable</p>
        <p className="text-2xl font-bold text-gray-400">{stableTrend}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Industries</p>
        <p className="text-2xl font-bold text-cyan-400">{metrics.length}</p>
      </div>
    </div>
  )
}
