import React, { useState } from 'react'
import { RepostCluster, RepostStats, PostingMatch } from '@/lib/repostDetection'

interface RepostStatsCardProps {
  stats: RepostStats
}

export function RepostStatsCard({ stats }: RepostStatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {stats.boardName}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Postings</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalPostings}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">With Reposts</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.postingsWithReposts}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Repost Events</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.totalRepostEvents}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Repost Rate</p>
          <p className="text-2xl font-bold text-amber-600">
            {stats.repostPercentage}%
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg Reposts per Posting:</span>
          <span className="font-semibold">{stats.averageRepostsPerPosting}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg Gap Between Reposts:</span>
          <span className="font-semibold">
            {stats.averageGapBetweenReposts} days
          </span>
        </div>
      </div>
    </div>
  )
}

interface RepostMatchDisplayProps {
  match: PostingMatch
  originalTitle?: string
  repostTitle?: string
}

export function RepostMatchDisplay({
  match,
  originalTitle,
  repostTitle,
}: RepostMatchDisplayProps) {
  const matchTypeColors: Record<string, string> = {
    url: 'bg-red-100 text-red-800',
    'title-company': 'bg-orange-100 text-orange-800',
    similarity: 'bg-amber-100 text-amber-800',
  }

  const matchTypeLabels: Record<string, string> = {
    url: 'URL Match',
    'title-company': 'Title+Company Match',
    similarity: 'Title Similarity',
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-600">Original</p>
          {originalTitle && (
            <p className="text-sm text-gray-900 font-medium">{originalTitle}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {match.firstSeen.toLocaleDateString()}
          </p>
        </div>
        <div className="text-center">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              matchTypeColors[match.matchType]
            }`}
          >
            {matchTypeLabels[match.matchType]}
          </span>
          <p className="text-sm font-bold text-blue-600 mt-2">
            {(match.matchScore * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-600">Repost</p>
          {repostTitle && (
            <p className="text-sm text-gray-900 font-medium">{repostTitle}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {match.repostDate.toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Gap: {match.gapDays} days</span>
        <span>{match.confirmed ? '✓ Confirmed' : '⚠ Needs review'}</span>
      </div>
    </div>
  )
}

interface RepostClusterDisplayProps {
  cluster: RepostCluster
}

export function RepostClusterDisplay({ cluster }: RepostClusterDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="font-semibold text-gray-900">
            {cluster.originalPosting.title}
          </p>
          <p className="text-sm text-gray-600">
            {cluster.originalPosting.company}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            First posted: {cluster.originalPosting.firstSeen.toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-sm">
              {cluster.totalReposts} reposts
            </span>
            <span className={`text-2xl transition-transform ${expanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {cluster.repostFrequency.toFixed(2)} repost/month
          </p>
          <p className="text-xs text-gray-500">
            Avg gap: {cluster.averageGapDays} days
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          {cluster.reposts.map((repost, idx) => (
            <div key={idx} className="bg-white p-3 rounded border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">Repost #{idx + 1}</span>
                  <p className="text-xs text-gray-600">
                    Posted: {repost.repostDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      repost.matchType === 'url'
                        ? 'bg-red-100 text-red-800'
                        : repost.matchType === 'title-company'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {(repost.matchScore * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Gap from previous: {repost.gapDays} days
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface RepostComparisonProps {
  stats: RepostStats[]
}

export function RepostComparison({ stats }: RepostComparisonProps) {
  const sorted = [...stats]
    .filter((s) => s.totalRepostEvents > 0)
    .sort((a, b) => b.repostPercentage - a.repostPercentage)

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No reposts detected yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Board Repost Frequency
      </h3>

      {sorted.map((stat) => (
        <div key={stat.boardId}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900">
              {stat.boardName}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {stat.repostPercentage}% ({stat.postingsWithReposts}/
              {stat.totalPostings})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(stat.repostPercentage, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stat.totalRepostEvents} total reposts, {stat.averageGapBetweenReposts} days avg gap
          </p>
        </div>
      ))}
    </div>
  )
}

interface RepostTimelineProps {
  clusters: RepostCluster[]
}

export function RepostTimeline({ clusters }: RepostTimelineProps) {
  if (clusters.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No repost clusters to display</p>
      </div>
    )
  }

  // Sort by original posting date
  const sorted = [...clusters].sort(
    (a, b) =>
      new Date(a.originalPosting.firstSeen).getTime() -
      new Date(b.originalPosting.firstSeen).getTime()
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Repost Clusters</h3>
      {sorted.map((cluster) => (
        <RepostClusterDisplay key={cluster.clusterId} cluster={cluster} />
      ))}
    </div>
  )
}
