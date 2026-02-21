import React from 'react'
import { TrendMetrics, WeeklyComparison, AnomalyAlert, RoleTrend } from '@/lib/trendTracking'

interface TrendCardProps {
  boardName: string
  currentScore: number
  scoreChange: number
  trend: 'up' | 'down' | 'stable'
  trendStrength: 'strong' | 'moderate' | 'weak'
}

export function TrendCard({
  boardName,
  currentScore,
  scoreChange,
  trend,
  trendStrength,
}: TrendCardProps) {
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '→'
  const trendColor =
    trend === 'up'
      ? 'text-green-600 bg-green-50'
      : trend === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-50'
  const strengthLabel = trendStrength === 'strong' ? '(Strong)' : trendStrength === 'moderate' ? '(Moderate)' : '(Weak)'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{boardName}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Current Score</p>
          <p className="text-3xl font-bold text-blue-600">{currentScore}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Change</p>
          <p className={`text-2xl font-bold ${trendColor}`}>
            {trendIcon} {scoreChange > 0 ? '+' : ''}{scoreChange}
          </p>
        </div>
      </div>

      <div className={`p-3 rounded ${trendColor}`}>
        <p className="text-sm font-semibold">
          Trend: {trend.charAt(0).toUpperCase() + trend.slice(1)} {strengthLabel}
        </p>
      </div>
    </div>
  )
}

interface TrendChartProps {
  data: TrendMetrics
}

export function TrendChart({ data }: TrendChartProps) {
  // Find min/max for scaling
  const scores = data.snapshots.map((s) => s.overallScore)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = maxScore - minScore || 1

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {data.boardName} - {data.daysAnalyzed} Day Trend
      </h3>

      <div className="h-64 flex items-end justify-between gap-1 px-4 py-4 bg-gray-50 rounded">
        {data.snapshots.map((snapshot, idx) => {
          const height = ((snapshot.overallScore - minScore) / range) * 100 || 10
          const isLatest = idx === data.snapshots.length - 1
          const barColor = snapshot.overallScore > data.currentScore ? 'bg-green-500' : 'bg-red-500'

          return (
            <div
              key={snapshot.id}
              className="flex-1 flex flex-col items-center justify-end"
              title={`${snapshot.snapshotDate}: ${snapshot.overallScore}`}
            >
              <div
                className={`w-full ${barColor} rounded-t transition-all ${isLatest ? 'ring-2 ring-blue-600' : ''}`}
                style={{ height: `${Math.max(5, height)}%` }}
              />
              <p className="text-xs text-gray-600 mt-2">
                {new Date(snapshot.snapshotDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600">Lowest</p>
          <p className="text-lg font-bold text-gray-900">{data.snapshots[0].overallScore}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Highest</p>
          <p className="text-lg font-bold text-gray-900">{Math.max(...scores)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Current</p>
          <p className="text-lg font-bold text-blue-600">{data.currentScore}</p>
        </div>
      </div>
    </div>
  )
}

interface WeeklyComparisonCardProps {
  data: WeeklyComparison
}

export function WeeklyComparisonCard({ data }: WeeklyComparisonCardProps) {
  const trendIcon = data.weekTrend === 'up' ? '📈' : data.weekTrend === 'down' ? '📉' : '→'
  const trendColor =
    data.weekTrend === 'up'
      ? 'text-green-600 bg-green-50'
      : data.weekTrend === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-50'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{data.boardName} - Weekly</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-blue-600">{data.thisWeekScore}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Last Week</p>
          <p className="text-2xl font-bold text-gray-600">{data.lastWeekScore}</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-sm text-gray-600">Week-over-Week Change</p>
        <p className={`text-xl font-bold ${trendColor}`}>
          {trendIcon} {data.weekChange > 0 ? '+' : ''}{data.weekChange}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Trend Duration</p>
          <p className="font-semibold text-gray-900">{data.trendDuration} weeks</p>
        </div>
        <div>
          <p className="text-gray-600">Volatility</p>
          <p className="font-semibold text-gray-900">{data.volatility}</p>
        </div>
      </div>
    </div>
  )
}

interface AnomalyAlertCardProps {
  alert: AnomalyAlert
}

export function AnomalyAlertCard({ alert }: AnomalyAlertCardProps) {
  const severityColor =
    alert.severity === 'high'
      ? 'bg-red-50 border-red-200'
      : alert.severity === 'medium'
      ? 'bg-orange-50 border-orange-200'
      : 'bg-yellow-50 border-yellow-200'

  const severityLabel =
    alert.severity === 'high' ? '🔴 HIGH' : alert.severity === 'medium' ? '🟠 MEDIUM' : '🟡 LOW'

  return (
    <div className={`border rounded-lg p-4 ${severityColor}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{alert.boardName}</h4>
        <span className="text-sm font-bold">{severityLabel}</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-600">Current</p>
          <p className="font-semibold">{Math.round(alert.currentValue)}</p>
        </div>
        <div>
          <p className="text-gray-600">Expected</p>
          <p className="font-semibold">{alert.expectedValue}</p>
        </div>
      </div>
    </div>
  )
}

interface RoleTrendTableProps {
  data: RoleTrend[]
}

export function RoleTrendTable({ data }: RoleTrendTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Role Trends (This Week)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Trend</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Demand</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Hotness</th>
            </tr>
          </thead>
          <tbody>
            {data.map((role, idx) => {
              const trendIcon = role.trend === 'up' ? '📈' : role.trend === 'down' ? '📉' : '→'
              return (
                <tr key={role.roleFamily} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{role.roleFamily}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-lg">{trendIcon}</span> {role.trend}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                    {role.demandChange > 0 ? '+' : ''}{role.demandChange}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{role.currentScore}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{role.hotness}th %ile</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TrendSummaryProps {
  trends: TrendMetrics[]
  anomalies: AnomalyAlert[]
}

export function TrendSummary({ trends, anomalies }: TrendSummaryProps) {
  const improving = trends.filter((t) => t.trend === 'up').length
  const declining = trends.filter((t) => t.trend === 'down').length
  const stable = trends.filter((t) => t.trend === 'stable').length

  const bestPerformer = trends.length > 0 ? trends[0] : null

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="text-green-600 font-semibold">{improving} boards improving</span> this period
          </p>
          <p className="text-sm">
            <span className="text-red-600 font-semibold">{declining} boards declining</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 font-semibold">{stable} boards stable</span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-600">✅ No anomalies detected</p>
        ) : (
          <div className="space-y-2">
            {anomalies.slice(0, 3).map((alert) => (
              <p key={alert.boardId} className="text-sm">
                <span className={`${alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'} font-semibold`}>
                  {alert.boardName}
                </span>
                : {alert.metric} anomaly
              </p>
            ))}
            {anomalies.length > 3 && <p className="text-xs text-gray-500">+{anomalies.length - 3} more</p>}
          </div>
        )}
      </div>

      {bestPerformer && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Most Improved</h3>
          <p className="text-sm text-gray-600 mb-2">{bestPerformer.boardName}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">+{bestPerformer.scoreChange}</span>
            <span className="text-lg">{bestPerformer.scoreChangePercent > 0 ? '📈' : '📉'}</span>
            <span className="text-sm text-gray-600">
              ({bestPerformer.scoreChangePercent > 0 ? '+' : ''}{bestPerformer.scoreChangePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
