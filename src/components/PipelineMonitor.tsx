import React, { useEffect, useState } from 'react'
import { PipelineRunLog } from '@/lib/pipeline'

interface PipelineStatsProps {
  stats: any
}

export function PipelineStats({ stats }: PipelineStatsProps) {
  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Pipeline Statistics (Last 7 Days)
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRuns}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Job Success Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.jobSuccessRate}%
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Successful Runs:</span>
          <span className="font-semibold text-green-600">
            {stats.successfulRuns}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Partial Runs:</span>
          <span className="font-semibold text-amber-600">{stats.partialRuns}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Failed Runs:</span>
          <span className="font-semibold text-red-600">{stats.failedRuns}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-600">Avg Duration:</span>
          <span className="font-semibold">{stats.avgDurationSeconds}s</span>
        </div>
      </div>
    </div>
  )
}

interface PipelineRunDisplayProps {
  run: PipelineRunLog
}

export function PipelineRunDisplay({ run }: PipelineRunDisplayProps) {
  const statusColors: Record<string, string> = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
  }

  const duration = run.endTime
    ? Math.round((run.endTime.getTime() - run.startTime.getTime()) / 1000)
    : null

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-600">Run ID</p>
          <p className="text-sm text-gray-900 font-mono break-all">{run.runId}</p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            statusColors[run.status]
          }`}
        >
          {run.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <div>
          <p className="text-xs text-gray-600">Total Jobs</p>
          <p className="text-lg font-bold text-gray-900">{run.totalJobs}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Completed</p>
          <p className="text-lg font-bold text-green-600">{run.completedJobs}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Failed</p>
          <p className="text-lg font-bold text-red-600">{run.failedJobs}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Duration</p>
          <p className="text-lg font-bold text-gray-900">
            {duration ? `${duration}s` : 'Running...'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-xs text-gray-500">
        <span>Started: {run.startTime.toLocaleString()}</span>
        {run.endTime && <span>Ended: {run.endTime.toLocaleString()}</span>}
      </div>

      {run.errors && run.errors.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs font-semibold text-red-900 mb-1">Errors:</p>
          {run.errors.slice(0, 3).map((error, idx) => (
            <p key={idx} className="text-xs text-red-800">
              • {error}
            </p>
          ))}
          {run.errors.length > 3 && (
            <p className="text-xs text-red-800 mt-1">
              +{run.errors.length - 3} more errors
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface PipelineHistoryProps {
  runs: PipelineRunLog[]
  isLoading: boolean
  onRefresh: () => void
  onRunNow: () => void
}

export function PipelineHistory({
  runs,
  isLoading,
  onRefresh,
  onRunNow,
}: PipelineHistoryProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Runs</h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
          >
            ⟳ Refresh
          </button>
          <button
            onClick={onRunNow}
            disabled={isLoading}
            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            ▶ Run Now
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {!isLoading && runs.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">No pipeline runs yet</p>
        </div>
      )}

      {!isLoading && runs.length > 0 && (
        <div className="space-y-3">
          {runs.map((run) => (
            <PipelineRunDisplay key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  )
}

interface PipelineMonitorProps {
  refreshInterval?: number
}

export function PipelineMonitor({ refreshInterval = 30000 }: PipelineMonitorProps) {
  const [stats, setStats] = useState<any>(null)
  const [runs, setRuns] = useState<PipelineRunLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/pipeline?action=stats'),
        fetch('/api/pipeline?action=history'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setRuns(historyData.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunNow = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to run pipeline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return (
    <div className="space-y-6">
      {stats && <PipelineStats stats={stats} />}
      <PipelineHistory
        runs={runs}
        isLoading={isLoading}
        onRefresh={fetchData}
        onRunNow={handleRunNow}
      />
    </div>
  )
}
