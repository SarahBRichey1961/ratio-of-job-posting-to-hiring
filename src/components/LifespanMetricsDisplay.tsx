import React, { useState } from 'react'
import { LifespanMetrics, LifespanBucket, RoleFamilyLifespan } from '@/lib/lifespanMetrics'

interface LifespanMetricsCardProps {
  metrics: LifespanMetrics
}

export function LifespanMetricsCard({ metrics }: LifespanMetricsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {metrics.boardName}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Avg Lifespan</p>
          <p className="text-3xl font-bold text-blue-600">
            {metrics.avgLifespan}d
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Median</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.medianLifespan}d</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">25th Percentile:</span>
          <span className="font-semibold">{metrics.p25Lifespan}d</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">75th Percentile:</span>
          <span className="font-semibold">{metrics.p75Lifespan}d</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Range:</span>
          <span className="font-semibold">
            {metrics.minLifespan}d - {metrics.maxLifespan}d
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Total Postings:</span>
          <span className="font-semibold">{metrics.totalPostings}</span>
        </div>
        {metrics.activeDaysAvg > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Active Postings Avg Age:</span>
            <span className="font-semibold">{metrics.activeDaysAvg}d</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface LifespanRankingProps {
  metrics: Array<LifespanMetrics & { rank: number }>
}

export function LifespanRanking({ metrics }: LifespanRankingProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Boards Ranked by Avg Lifespan
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
                    {metric.totalPostings} postings
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {metric.avgLifespan}d
                </p>
                <p className="text-xs text-gray-500">avg</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface LifespanDistributionChartProps {
  buckets: LifespanBucket[]
  boardName: string
}

export function LifespanDistributionChart({
  buckets,
  boardName,
}: LifespanDistributionChartProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lifespan Distribution - {boardName}
      </h3>

      <div className="space-y-4">
        {buckets.map((bucket) => (
          <div key={bucket.range}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-900">
                {bucket.range}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {bucket.count} ({bucket.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(bucket.count / maxCount) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface RoleFamilyLifespanTableProps {
  data: RoleFamilyLifespan[]
}

export function RoleFamilyLifespanTable({ data }: RoleFamilyLifespanTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lifespan by Role Family
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
                Avg Lifespan
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Median
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Postings
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Boards
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
                <td className="px-6 py-4 text-sm font-bold text-blue-600">
                  {role.avgLifespan}d
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.medianLifespan}d
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.totalPostings}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.distinctBoards}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface LifespanComparisonProps {
  board1: LifespanMetrics | null
  board2: LifespanMetrics | null
}

export function LifespanComparison({
  board1,
  board2,
}: LifespanComparisonProps) {
  if (!board1 || !board2) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">Unable to load comparison data</p>
      </div>
    )
  }

  const difference = board1.avgLifespan - board2.avgLifespan
  const percentDiff = ((difference / board2.avgLifespan) * 100).toFixed(1)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {board1.boardName}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Lifespan:</span>
            <span className="font-bold text-2xl text-blue-600">
              {board1.avgLifespan}d
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Median:</span>
            <span className="font-semibold">{board1.medianLifespan}d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Postings:</span>
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
            <span className="text-gray-600">Avg Lifespan:</span>
            <span className="font-bold text-2xl text-blue-600">
              {board2.avgLifespan}d
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Median:</span>
            <span className="font-semibold">{board2.medianLifespan}d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Postings:</span>
            <span className="font-semibold">{board2.totalPostings}</span>
          </div>
        </div>
      </div>

      <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Difference</p>
        <p className="text-3xl font-bold text-blue-600">
          {difference > 0 ? '+' : ''}{difference.toFixed(1)}d
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {board1.boardName} is {Math.abs(parseFloat(percentDiff))}% 
          {difference > 0 ? 'longer' : 'shorter'}
        </p>
      </div>
    </div>
  )
}
