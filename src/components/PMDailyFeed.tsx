/**
 * PM Daily Feed Component
 * Comprehensive dashboard for daily job board activity metrics
 */

import React, { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'

interface BoardMetrics {
  board_id: number
  board_name: string
  volume: {
    new_postings: number
    posting_velocity: number
    total_active_postings: number
  }
  seniority_mix: {
    entry_level: { pct: number; count: number }
    mid_level: { pct: number; count: number }
    senior_level: { pct: number; count: number }
  }
  geography: {
    remote: { pct: number; count: number }
    onsite: { pct: number; count: number }
    hybrid: { pct: number; count: number }
  }
  company_concentration: {
    unique_companies: number
    top_company_concentration: number
    top_companies: Array<{ rank: number; name: string; postings: number; pct: number }>
  }
  roles_by_seniority: Array<{
    role: string
    entry: number
    mid: number
    senior: number
    total: number
  }>
}

interface SummaryMetrics {
  total_postings: number
  avg_velocity: number
  highest_velocity_board: string
  lowest_velocity_board: string
  avg_remote_pct: number
  avg_senior_pct: number
  top_board_by_volume: string
  boards_processed: number
}

interface DailyFeedResponse {
  date: string
  summary: SummaryMetrics
  boards: BoardMetrics[]
  timestamp: string
}

interface PMDailyFeedProps {
  date?: string
}

const PMDailyFeed: React.FC<PMDailyFeedProps> = ({ date: initialDate }) => {
  const [data, setData] = useState<DailyFeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(
    initialDate || format(subDays(new Date(), 1), 'yyyy-MM-dd')
  )
  const [sortBy, setSortBy] = useState<keyof BoardMetrics['volume']>('new_postings')
  const [filterRemote, setFilterRemote] = useState<'all' | 'remote-only' | 'non-remote'>('all')
  const [filterSeniority, setFilterSeniority] = useState<'all' | 'entry' | 'mid' | 'senior'>(
    'all'
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/pm/daily-feed?date=${selectedDate}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load daily feed')
        }

        const feedData = await response.json()
        setData(feedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate])

  const filterBoards = (boards: BoardMetrics[]) => {
    return boards.filter(board => {
      // Remote filter
      if (filterRemote === 'remote-only' && board.geography.remote.pct < 50) {
        return false
      }
      if (filterRemote === 'non-remote' && board.geography.remote.pct >= 50) {
        return false
      }

      // Seniority filter
      if (filterSeniority !== 'all') {
        const seniorityKey = `${filterSeniority}_level` as
          | 'entry_level'
          | 'mid_level'
          | 'senior_level'
        const seniorityPct =
          board.seniority_mix[seniorityKey as keyof typeof board.seniority_mix]?.pct || 0
        if (seniorityPct < 30) {
          return false
        }
      }

      return true
    })
  }

  const sortBoards = (boards: BoardMetrics[]) => {
    const key = sortBy
    return [...boards].sort((a, b) => {
      const aVal = a.volume[key as keyof typeof a.volume] as number
      const bVal = b.volume[key as keyof typeof b.volume] as number
      return bVal - aVal
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-slate-600">Loading daily feed...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">Error Loading Feed</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">No data available for the selected date</p>
      </div>
    )
  }

  const summary = data.summary
  const filteredBoards = filterBoards(data.boards)
  const sortedBoards = sortBoards(filteredBoards)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">📊 PM Daily Board Activity Feed</h2>
        <p className="text-blue-100">
          Comprehensive job board performance metrics for your hiring analysis
        </p>
      </div>

      {/* Date & Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.target.value as keyof BoardMetrics['volume'])
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new_postings">New Postings</option>
              <option value="posting_velocity">Posting Velocity</option>
              <option value="total_active_postings">Total Active</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Remote Filter
            </label>
            <select
              value={filterRemote}
              onChange={e => setFilterRemote(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Boards</option>
              <option value="remote-only">Remote-Heavy (50%+)</option>
              <option value="non-remote">Traditional (&lt;50% Remote)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Seniority Focus
            </label>
            <select
              value={filterSeniority}
              onChange={e => setFilterSeniority(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="entry">Entry-Heavy (30%+)</option>
              <option value="mid">Mid-Heavy (30%+)</option>
              <option value="senior">Senior-Heavy (30%+)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSortBy('new_postings')
                setFilterRemote('all')
                setFilterSeniority('all')
              }}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-600 text-sm font-medium mb-1">Total Postings</div>
          <div className="text-3xl font-bold text-blue-600">
            {summary.total_postings.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">across all {summary.boards_processed} boards</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-600 text-sm font-medium mb-1">Avg Velocity</div>
          <div className="text-3xl font-bold text-emerald-600">
            {summary.avg_velocity.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500 mt-1">postings per hour</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-600 text-sm font-medium mb-1">Remote %</div>
          <div className="text-3xl font-bold text-purple-600">
            {summary.avg_remote_pct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">average across boards</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-slate-600 text-sm font-medium mb-1">Senior %</div>
          <div className="text-3xl font-bold text-amber-600">
            {summary.avg_senior_pct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">average across boards</div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-300">
          <div className="text-slate-700 text-sm font-medium mb-1">🚀 Top by Volume</div>
          <div className="text-lg font-bold text-blue-700">{summary.top_board_by_volume}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-300">
          <div className="text-slate-700 text-sm font-medium mb-1">⚡ Highest Velocity</div>
          <div className="text-lg font-bold text-emerald-700">
            {summary.highest_velocity_board}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-300">
          <div className="text-slate-700 text-sm font-medium mb-1">🐌 Lowest Velocity</div>
          <div className="text-lg font-bold text-orange-700">
            {summary.lowest_velocity_board}
          </div>
        </div>
      </div>

      {/* Boards Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">
            Board-by-Board Metrics ({sortedBoards.length} boards)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Board</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">New Posts</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Velocity/hr</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Entry %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Mid %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Senior %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Remote %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Companies</th>
              </tr>
            </thead>
            <tbody>
              {sortedBoards.map((board, idx) => (
                <tr
                  key={board.board_id}
                  className={`border-b border-slate-200 hover:bg-slate-50 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {board.board_name}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                    {board.volume.new_postings.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                    {board.volume.posting_velocity.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                      {board.seniority_mix.entry_level.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      {board.seniority_mix.mid_level.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      {board.seniority_mix.senior_level.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      {board.geography.remote.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {board.company_concentration.unique_companies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Companies Across All Boards */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">🏢 Top Companies Across All Boards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.boards
            .flatMap(b =>
              b.company_concentration.top_companies.map(c => ({
                ...c,
                boardName: b.board_name,
              }))
            )
            .sort((a, b) => b.postings - a.postings)
            .slice(0, 15)
            .map((company, idx) => (
              <div key={`${company.name}-${idx}`} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-300">{idx + 1}</div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800 text-sm">{company.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{company.boardName}</div>
                  <div className="text-sm font-semibold text-blue-600 mt-2">
                    {company.postings} postings
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-4">
        Data last updated: {format(new Date(data.timestamp), 'MMM d, yyyy HH:mm:ss')}
      </div>
    </div>
  )
}

export default PMDailyFeed
