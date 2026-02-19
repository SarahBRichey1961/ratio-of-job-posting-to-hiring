import React, { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  FilterBar,
  Button,
  Select,
  Card,
  Section,
} from '@/components/DashboardUI'

interface ComparisonRow {
  name: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
}

export default function ComparisonPage() {
  const [sortBy, setSortBy] = useState<'score' | 'lifespan' | 'reposts' | 'name' | 'quality'>(
    'score'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minScore, setMinScore] = useState(0)

  // Mock data matching backend structure
  const boards: ComparisonRow[] = [
    {
      name: 'Stack Overflow',
      score: 88,
      grade: 'A+',
      avgLifespan: 12,
      repostRate: 3,
      totalPostings: 2456,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 5.2,
      dataQuality: 97,
    },
    {
      name: 'LinkedIn',
      score: 85,
      grade: 'A',
      avgLifespan: 14,
      repostRate: 5,
      totalPostings: 5432,
      topdiv className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-400">Sort by:</label>
          <Select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'score' | 'lifespan' | 'reposts' | 'name' | 'quality')
            }
            options={[
              { value: 'score', label: 'Efficiency Score' },
              { value: 'lifespan', label: 'Avg Lifespan' },
              { value: 'reposts', label: 'Repost Rate' },
              { value: 'quality', label: 'Data Quality' },
              { value: 'name', label: 'Name (A-Z)' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-400">Order:</label>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-400">Min Score:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-300 w-12">{minScore}</span>
        </div>
      </FilterBar>

      {/* Results Summary */}
      <div className="mb-4 text-gray-400 text-sm">
        Showing {filtered.length} of {boards.length} boards
      </divgs: 456,
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.5,
      dataQuality: 98,
    },
    {
      name: 'We Work Remotely',
      score: 74,
      grade: 'B+',
      avgLifespan: 16,
      repostRate: 8,
      totalPostings: 892,
      topRole: 'Remote Developer',
      trend: 'up',
      trendValue: 1.2,
      dataQuality: 92,
    },
    {
      name: 'Indeed',
      score: 72,
      grade: 'B',
      avgLifespan: 18,
      repostRate: 12,
      totalPostings: 3200,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -2.3,
      dataQuality: 88,
    },
    {
      name: 'Glassdoor',
      score: 68,
      grade: 'B',
      avgLifespan: 21,
      repostRate: 15,
      totalPostings: 2890,
      topRole: 'Product Manager',
      trend: 'down',
      trendValue: -1.8,
      dataQuality: 85,
    },
    {
      name: 'CraigsList',
      score: 45,
      grade: 'F',
      avgLifespan: 35,
      repostRate: 42,
      totalPostings: 234,
      topRole: 'Various',
      trend: 'down',
      trendValue: -8.5,
      dataQuality: 58,
    },
    {
      name: 'Monster',
      score: 52,
      grade: 'D',
      avgLifespan: 28,
      repostRate: 28,
      totalPostings: 1456,
      topRole: 'Sales Engineer',
      trend: 'stable',
      trendValue: -0.3,
      dataQuality: 72,
    },
  ]

  // Filter and sort
  const filtered = useMemo(() => {
    let result = boards.filter((b) => b.score >= minScore)

    // Sort
    result.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortBy) {
        case 'score':
          aVal = a.score
          bVal = b.score
          break
        case 'lifespan':
          aVal = a.avgLifespan
          bVal = b.avgLifespan
          break
        case 'reposts':
          aVal = a.repostRate
          bVal = b.repostRate
          break
        case 'quality':
          aVal = a.dataQuality
          bVal = b.dataQuality
          break
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : bVal.localeCompare(aVal as string)
      }

      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return result
  }, [sortBy, sortOrder, minScore])

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400'
    if (grade.startsWith('B')) return 'text-blue-400'
    if (grade.startsWith('C')) return 'text-yellow-400'
    return 'text-red-400'
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    return 'bg-red-500'
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Board Comparison"
        description="Compare efficiency scores, lifespan, and data quality across all job boards"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              📊 Export
            </Button>
            <Button variant="secondary" size="sm">
              🔄 Refresh
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <FilterBar>
        <Select
          label="Sort By"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          options={[
            { value: 'score', label: 'Efficiency Score' },
            { value: 'lifespan', label: 'Avg Lifespan' },
            { value: 'reposts', label: 'Repost Rate' },
            { value: 'name', label: 'Name (A-Z)' },
          ]}
        />Job Board</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Efficiency Score
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Avg Lifespan
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Repost Rate
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Data Quality
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Grade</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Trend</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredlassName="text-left py-3 px-4 text-gray-400 font-semibold">
                  Job Board
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Efficiency Score
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Avg Lifespan
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Repost Rate
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Grade
                </th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board, idx) => (
                <tr
                  key={board.name}
                  className={`border-b border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : ''}`}
                >
                  <td className="py-4 px-4 text-white font-medium">{board.name}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">

                  {/* Efficiency Score */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white font-bold">{board.score}</span>
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${scoreColor(board.score)}`}
                          style={{ width: `${board.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Avg Lifespan */}
                  <td className="py-4 px-4 text-center text-gray-300">
                    <span
                      className={
                        board.avgLifespan <= 12
                          ? 'text-green-400'
                          : board.avgLifespan <= 20
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {board.avgLifespan}d
                    </span>
                  </td>

                  {/* Repost Rate */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={
                        board.repostRate < 10
                          ? 'text-green-400'
                          : board.repostRate < 20
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {board.repostRate}%
                    </span>
                  </td>

                  {/* Data Quality */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${scoreColor(board.dataQuality)}`}
                          style={{ width: `${board.dataQuality}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-sm w-2">
              {filtered[0]?.name || 'N/A'}
            </p>
            <p className="text-gray-500 text-sm mt-1">{filtered[0]?.score} points</p>
          </Card>

          <Card>
            <p className="text-gray-400 text-sm">Fastest Hiring</p>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {filtered.reduce((min, b) => (b.avgLifespan < min.avgLifespan ? b : min)).name}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.reduce((min, b) => (b.avgLifespan < min.avgLifespan ? b : min)).avgLifespan}{' '}
              days avg
            </p>
          </Card>

          <Card>
            <p className="text-gray-400 text-sm">Cleanest Data</p>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {filtered.reduce((max, b) => (b.dataQuality > max.dataQuality ? b : max)).name}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.reduce((max, b) => (b.dataQuality > max.dataQuality ? b : max)).dataQuality}
              % quality
            </p>
          </Card>

          <Card>
            <p className="text-gray-400 text-sm">Average Score</p>
            <p className="text-2xl font-bold text-white mt-2">
              {(filtered.reduce((sum, b) => sum + b.score, 0) / filtered.length).toFixed(1)}
            </p>
            <p className="text-gray-500 text-sm mt-1">Across filtered
                          : board.trend === 'down'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }
                    >
                      {board.trend === 'up' ? '📈' : board.trend === 'down' ? '📉' : '→'}{' '}
                      {board.trendValue}%
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-center">
                    <a
                      href={`/dashboard/profile?board=${encodeURIComponent(board.name)}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      View →
                    </a
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <Section title="Comparison Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-gray-400 text-sm">Highest Score</p>
            <p className="text-2xl font-bold text-green-400 mt-1">Stack Overflow</p>
            <p className="text-gray-500 text-sm mt-1">88 points</p>
          </Card>
          <Card>
            <p className="text-gray-400 text-sm">Fastest Hiring</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">HackerNews</p>
            <p className="text-gray-500 text-sm mt-1">11 days avg</p>
          </Card>
          <Card>
            <p className="text-gray-400 text-sm">Cleanest Data</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">Stack Overflow</p>
            <p className="text-gray-500 text-sm mt-1">3% repost rate</p>
          </Card>
          <Card>
            <p className="text-gray-400 text-sm">Average Score</p>
            <p className="text-2xl font-bold text-white mt-1">70.1</p>
            <p className="text-gray-500 text-sm mt-1">Across all boards</p>
          </Card>
        </div>
      </Section>
    </DashboardLayout>
  )
}
