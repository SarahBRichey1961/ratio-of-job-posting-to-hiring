import React from 'react'
import { LifespanStats, PostingEvent } from '@/lib/lifespanTracking'

interface LifespanCardProps {
  stats: LifespanStats
}

export function LifespanStatsCard({ stats }: LifespanCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{stats.boardName}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Postings</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPostings}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.activePostings}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Disappeared</p>
          <p className="text-2xl font-bold text-red-600">{stats.disappearedPostings}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Lifespan</p>
          <p className="text-2xl font-bold text-blue-600">{stats.averageLifespan} days</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Median Lifespan:</span>
          <span className="font-semibold">{stats.medianLifespan} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Min - Max:</span>
          <span className="font-semibold">
            {stats.minLifespan} - {stats.maxLifespan} days
          </span>
        </div>
      </div>

      {stats.byRoleFamily && Object.keys(stats.byRoleFamily).length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">By Role Family</p>
          <div className="space-y-2">
            {Object.entries(stats.byRoleFamily)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 5)
              .map(([role, data]) => (
                <div key={role} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {role}: {data.count} postings
                  </span>
                  <span className="font-semibold">
                    {Math.round(data.avgLifespan)} days avg
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface LifespanTimelineProps {
  events: PostingEvent[]
  jobPostingId: number
}

export function PostingTimeline({ events, jobPostingId }: LifespanTimelineProps) {
  const eventColors: Record<string, string> = {
    appeared: 'bg-green-100 text-green-800 border-green-300',
    reappeared: 'bg-blue-100 text-blue-800 border-blue-300',
    disappeared: 'bg-red-100 text-red-800 border-red-300',
  }

  const eventLabels: Record<string, string> = {
    appeared: '✓ Appeared',
    reappeared: '↻ Reappeared',
    disappeared: '✗ Disappeared',
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No events recorded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${eventColors[event.eventType]}`}
            >
              {index + 1}
            </div>
            {index < events.length - 1 && (
              <div className="w-1 h-8 bg-gray-300 my-1"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="font-semibold text-gray-900">
              {eventLabels[event.eventType]}
            </p>
            <p className="text-sm text-gray-600">
              {event.eventDate.toLocaleString()}
            </p>
            {event.notes && (
              <p className="text-sm text-gray-500 mt-1 italic">{event.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface LifespanComparisonProps {
  stats: LifespanStats[]
}

export function LifespanComparison({ stats }: LifespanComparisonProps) {
  // Sort by average lifespan
  const sorted = [...stats].sort(
    (a, b) => b.averageLifespan - a.averageLifespan
  )

  const maxLifespan = Math.max(...sorted.map((s) => s.averageLifespan))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Board Comparison</h3>

      {sorted.map((stat) => (
        <div key={stat.boardId}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900">
              {stat.boardName}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {stat.averageLifespan} days
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(stat.averageLifespan / maxLifespan) * 100}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stat.activePostings} active, {stat.disappearedPostings} disappeared
          </p>
        </div>
      ))}
    </div>
  )
}

interface LifespanChartProps {
  stats: LifespanStats
}

export function LifespanDistribution({ stats }: LifespanChartProps) {
  // Create bins for distribution
  const bins = [
    { label: '0-7 days', min: 0, max: 7 },
    { label: '8-14 days', min: 8, max: 14 },
    { label: '15-30 days', min: 15, max: 30 },
    { label: '31-60 days', min: 31, max: 60 },
    { label: '60+ days', min: 60, max: Infinity },
  ]

  // In a real implementation, you'd fetch actual posting data and bin them
  // For now, this is a template

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lifespan Distribution - {stats.boardName}
      </h3>

      <div className="space-y-4">
        {bins.map((bin) => (
          <div key={bin.label}>
            <p className="text-sm font-medium text-gray-700 mb-1">{bin.label}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.random() * 100}%`, // Placeholder
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
