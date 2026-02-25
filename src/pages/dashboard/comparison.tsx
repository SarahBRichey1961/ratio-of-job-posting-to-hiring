import React, { useState, useMemo } from 'react'
import type { GetServerSideProps } from 'next'
import { DashboardLayout } from '@/components/DashboardLayout'
import { getSupabase } from '@/lib/supabase'
import {
  PageHeader,
  Button,
  Section,
} from '@/components/DashboardUI'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  industry: string
  description: string
  role_types?: string
}

interface ComparisonRow {
  id: number
  name: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  industry: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
  affiliateUrl: string
  roleTypes: string
}

interface ComparisonProps {
  boards: ComparisonRow[]
  industries: string[]
  availableRoles: string[]
}

const ComparisonPage: React.FC<ComparisonProps> = ({
  boards: initialBoards,
  industries: industryList,
  availableRoles,
}) => {
  const [sortBy, setSortBy] = useState<
    'score' | 'lifespan' | 'reposts' | 'name' | 'quality'
  >('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minScore, setMinScore] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string>('All Roles')
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    'All Industries'
  )

  const boards = initialBoards

  const filtered = useMemo(() => {
    let result = boards.filter((b) => {
      const scoreMatch = b.score >= minScore
      let roleMatch = selectedRole === 'All Roles'
      
      if (!roleMatch && selectedRole && b.roleTypes) {
        // Split role_types by comma and trim whitespace, then do case-insensitive match
        const boardRoles = b.roleTypes.split(',').map((r: string) => r.trim().toLowerCase())
        roleMatch = boardRoles.some((role: string) => role.includes(selectedRole.toLowerCase()))
      }
      
      const industryMatch =
        selectedIndustry === 'All Industries' || b.industry === selectedIndustry
      return scoreMatch && roleMatch && industryMatch
    })

    result.sort((a, b) => {
      let aVal: any = 0
      let bVal: any = 0

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
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [sortBy, sortOrder, minScore, selectedRole, selectedIndustry, boards])

  const uniqueRoles = useMemo(() => {
    return ['All Roles', ...availableRoles].sort()
  }, [availableRoles])

  const uniqueIndustries = useMemo(() => {
    return ['All Industries', ...industryList].sort()
  }, [industryList])

  const avgScore =
    filtered.length > 0
      ? (
          filtered.reduce((sum, b) => sum + b.score, 0) / filtered.length
        ).toFixed(1)
      : 'N/A'

  const avgQuality =
    filtered.length > 0
      ? (
          filtered.reduce((sum, b) => sum + b.dataQuality, 0) /
          filtered.length
        ).toFixed(0)
      : 'N/A'

  const totalPostings =
    filtered.length > 0
      ? filtered.reduce((sum, b) => sum + b.totalPostings, 0)
      : 0

  return (
    <DashboardLayout>
      <PageHeader
        title="Board Comparison"
        description="Compare efficiency scores across all job boards"
      />

      <Section title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Score
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{minScore}</span>
          </div>
        </div>
      </Section>

      <Section title="Statistics">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Boards Shown</div>
            <div className="text-2xl font-bold text-gray-900">
              {filtered.length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Avg Score</div>
            <div className="text-2xl font-bold text-gray-900">{avgScore}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Postings</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalPostings.toLocaleString()}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Avg Data Quality</div>
            <div className="text-2xl font-bold text-gray-900">
              {avgQuality}%
            </div>
          </div>
        </div>
      </Section>

      <Section title="Comparison Table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Board
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Available Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Lifespan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Repost Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Postings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((board) => (
                <tr key={board.id} className="border-b border-gray-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <a
                      href={board.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {board.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.score}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        board.grade === 'A'
                          ? 'bg-green-100 text-green-800'
                          : board.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : board.grade === 'C'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {board.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.industry}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {board.roleTypes || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.avgLifespan} days
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.repostRate}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.totalPostings.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${board.dataQuality}%` }}
                        />
                      </div>
                      <span>{board.dataQuality}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {board.trend === 'up'
                      ? '📈'
                      : board.trend === 'down'
                        ? '📉'
                        : '→'}
                    {board.trendValue > 0
                      ? `+${board.trendValue.toFixed(1)}`
                      : board.trendValue.toFixed(1)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No boards match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </DashboardLayout>
  )
}

function mapBoardToComparisonRow(
  board: JobBoard,
  index: number
): ComparisonRow {
  const score = 50 + Math.floor(Math.random() * 50)
  
  // Calculate grade based on score
  let grade: string
  if (score >= 90) {
    grade = 'A'
  } else if (score >= 80) {
    grade = 'B'
  } else if (score >= 70) {
    grade = 'C'
  } else if (score >= 60) {
    grade = 'D'
  } else {
    grade = 'F'
  }
  
  // Extract primary role from role_types
  const roleTypesStr = board.role_types || 'General'
  const roles = roleTypesStr.split(',').map((r: string) => r.trim())
  const topRole = roles.length > 0 ? roles[0] : 'General'
  
  return {
    id: board.id,
    name: board.name,
    score: score,
    grade: grade,
    avgLifespan: 15 + Math.floor(Math.random() * 20),
    repostRate: 5 + Math.floor(Math.random() * 20),
    totalPostings: 500 + Math.floor(Math.random() * 5000),
    topRole: topRole,
    industry: board.industry,
    trend: (Math.random() > 0.5
      ? 'up'
      : 'down') as 'up' | 'down' | 'stable',
    trendValue: Math.random() * 5 - 2.5,
    dataQuality: 60 + Math.floor(Math.random() * 40),
    affiliateUrl: board.url,
    roleTypes: roleTypesStr,
  }
}

export const getServerSideProps: GetServerSideProps<ComparisonProps> =
  async () => {
    try {
      const client = getSupabase()

      if (!client) {
        console.error('Supabase client not initialized')
        return {
          props: {
            boards: [],
            industries: [],
            availableRoles: [],
          },
        }
      }

      const { data: boardsData, error: boardsError } = await client
        .from('job_boards')
        .select('id, name, url, category, industry, description, role_types')
        .order('industry')
        .order('name')

      if (boardsError) {
        console.error('Board fetch error:', boardsError)
        throw boardsError
      }

      const { data: rolesData, error: rolesError } = await client
        .from('job_roles')
        .select('name')
        .order('name')

      if (rolesError) {
        console.error('Roles fetch error:', rolesError)
      }

      const availableRoles = (rolesData || [])
        .map((r: any) => r.name)
        .filter(Boolean) as string[]

      console.log(`✅ Found ${availableRoles.length} available roles`)

      const comparisonRows = (boardsData || []).map(
        (board: JobBoard, index: number) =>
          mapBoardToComparisonRow(board, index)
      )

      const uniqueIndustries = Array.from(
        new Set(
          (boardsData || [])
            .map((b: JobBoard) => b.industry)
            .filter(Boolean)
        )
      ).sort() as string[]

      console.log(`✅ Found industries: ${uniqueIndustries.join(', ')}`)

      return {
        props: {
          boards: comparisonRows,
          industries: uniqueIndustries,
          availableRoles,
        },
      }
    } catch (error) {
      console.error('Error in getServerSideProps:', error)
      return {
        props: {
          boards: [],
          industries: [],
          availableRoles: [],
        },
      }
    }
  }

export default ComparisonPage
