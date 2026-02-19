import React from 'react'
import { RepostFrequencyMetrics, RoleRepostFrequency } from '@/lib/repostFrequency'

interface RepostFrequencyCardProps {
  metrics: RepostFrequencyMetrics
}

export function RepostFrequencyCard({ metrics }: RepostFrequencyCardProps) {
  const healthScore = Math.max(0, 100 - Math.round(metrics.repostRate * 2))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {metrics.boardName}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Repost Rate</p>
          <p className="text-3xl font-bold text-orange-600">
            {metrics.repostRate}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Health Score</p>
          <p className="text-3xl font-bold text-green-600">
            {healthScore}/100
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Postings:</span>
          <span className="font-semibold">{metrics.totalPostings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Reposted Count:</span>
          <span className="font-semibold">{metrics.uniqueRepostedPostings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Repost Events:</span>
          <span className="font-semibold">{metrics.totalReposts}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Avg Reposts/Posting:</span>
          <span className="font-semibold">{metrics.avgRepostsPerPosting}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Max Reposts (Single):</span>
          <span className="font-semibold">{metrics.maxRepostsForSinglePosting}x</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Chronic Reposters (3+x):</span>
          <span className="font-semibold">{metrics.repastedOffenders}</span>
        </div>
      </div>
    </div>
  )
}

interface HealthIndicatorProps {
  healthScore: number
  severity: 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical'
}

export function HealthIndicator({ healthScore, severity }: HealthIndicatorProps) {
  const colors = {
    excellent: 'bg-green-100 border-green-300 text-green-900',
    good: 'bg-green-50 border-green-200 text-green-700',
    moderate: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    concerning: 'bg-orange-50 border-orange-200 text-orange-700',
    critical: 'bg-red-50 border-red-200 text-red-700',
  }

  const icons = {
    excellent: '✅',
    good: '👍',
    moderate: '⚠️',
    concerning: '⚠️ ⚠️',
    critical: '🚨',
  }

  return (
    <div className={`border rounded-lg p-4 ${colors[severity]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[severity]}</span>
        <div>
          <p className="font-semibold capitalize">{severity} Data Quality</p>
          <p className="text-sm opacity-90">Score: {healthScore}/100</p>
        </div>
      </div>
    </div>
  )
}

interface RepostRankingProps {
  metrics: Array<RepostFrequencyMetrics & { rank: number; healthScore: number }>
}

export function RepostRanking({ metrics }: RepostRankingProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Boards Ranked by Repost Frequency (Best to Worst)
      </h3>

      {metrics.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.boardId}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                  {metric.rank}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{metric.boardName}</p>
                  <p className="text-xs text-gray-500">
                    {metric.uniqueRepostedPostings} of {metric.totalPostings} reposted
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600">
                  {metric.repostRate}%
                </p>
                <p className="text-xs text-gray-500">
                  Health: {metric.healthScore}/100
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface RoleRepostFrequencyTableProps {
  data: RoleRepostFrequency[]
}

export function RoleRepostFrequencyTable({ data }: RoleRepostFrequencyTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Repost Frequency by Role Family
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Role Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Repost Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Avg Reposts
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Worst Board
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((role, idx) => (
              <tr
                key={role.roleFamily}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {role.roleFamily}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-orange-600">
                  {role.repostRate}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.repostedCount} of {role.totalPostings}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.avgRepostsPerPosting}x
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.worstBoard}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TopRepostedProps {
  boardName: string
  postings: Array<{
    postingId: string
    title: string
    company: string
    repostCount: number
    daysActive: number
  }>
}

export function TopRepostedPostings({ boardName, postings }: TopRepostedProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Most Reposted Postings on {boardName}
        </h3>
      </div>

      {postings.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No reposted postings found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Reposted
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Days Active
                </th>
              </tr>
            </thead>
            <tbody>
              {postings.map((posting, idx) => (
                <tr key={posting.postingId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="max-w-xs truncate">{posting.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{posting.company}</td>
                  <td className="px-6 py-4 text-sm font-bold text-orange-600">
                    {posting.repostCount}x
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {posting.daysActive}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface RepostFrequencyComparisonProps {
  board1: RepostFrequencyMetrics | null
  board2: RepostFrequencyMetrics | null
}

export function RepostFrequencyComparison({
  board1,
  board2,
}: RepostFrequencyComparisonProps) {
  if (!board1 || !board2) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">Unable to load comparison data</p>
      </div>
    )
  }

  const difference = Math.abs(board1.repostRate - board2.repostRate)
  const better = board1.repostRate < board2.repostRate ? board1.boardName : board2.boardName

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {board1.boardName}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Repost Rate:</span>
            <span className="font-bold text-2xl text-orange-600">
              {board1.repostRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reposted Postings:</span>
            <span className="font-semibold">{board1.uniqueRepostedPostings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Postings:</span>
            <span className="font-semibold">{board1.totalPostings}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {board2.boardName}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Repost Rate:</span>
            <span className="font-bold text-2xl text-orange-600">
              {board2.repostRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reposted Postings:</span>
            <span className="font-semibold">{board2.uniqueRepostedPostings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Postings:</span>
            <span className="font-semibold">{board2.totalPostings}</span>
          </div>
        </div>
      </div>

      <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Difference</p>
        <p className="text-3xl font-bold text-blue-600">{difference.toFixed(1)}%</p>
        <p className="text-sm text-gray-500 mt-1">
          {better} has better data quality
        </p>
      </div>
    </div>
  )
}
