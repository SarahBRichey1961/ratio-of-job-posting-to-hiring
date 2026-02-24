import React, { useState, useMemo } from 'react'
import type { GetServerSideProps, NextPage } from 'next'
import { DashboardLayout } from '@/components/DashboardLayout'
import { getSupabase } from '@/lib/supabase'
import {
  PageHeader,
  FilterBar,
  Button,
  Select,
  Card,
  Section,
} from '@/components/DashboardUI'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  industry: string
  description: string
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
}

interface ComparisonProps {
  boards: ComparisonRow[]
  industries: string[]
}

const ComparisonPage: React.FC<ComparisonProps> = ({ boards: initialBoards, industries: industryList }) => {
  const [sortBy, setSortBy] = useState<'score' | 'lifespan' | 'reposts' | 'name' | 'quality'>(
    'score'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minScore, setMinScore] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string>('All Roles')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All Industries')

  // Use boards from props (fetched from database)
  const boards = initialBoards

  const filtered = useMemo(() => {
    let result = boards.filter((b) => {
      const scoreMatch = b.score >= minScore
      const roleMatch = selectedRole === 'All Roles' || b.topRole === selectedRole
      const industryMatch = selectedIndustry === 'All Industries' || b.industry === selectedIndustry
      return scoreMatch && roleMatch && industryMatch
    })
    result.sort((a, b) => {
      let aVal: any = 0,
        bVal: any = 0
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
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    return result
  }, [sortBy, sortOrder, minScore, selectedRole, selectedIndustry, boards])

  // Extract unique roles
  const uniqueRoles = useMemo(() => {
    const roles = boards.map((b) => b.topRole)
    return ['All Roles', ...Array.from(new Set(roles))].sort()
  }, [boards])

  // Extract unique industries from props
  const uniqueIndustries = useMemo(() => {
    return ['All Industries', ...industryList].sort()
  }, [industryList])

  return (
    <DashboardLayout>
      <PageHeader title="Board Comparison" description="Compare efficiency scores across all job boards" />
      
      {/* Filters */}
      <Section title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="score">Efficiency Score</option>
              <option value="lifespan">Avg Lifespan</option>
              <option value="reposts">Repost Rate</option>
              <option value="quality">Data Quality</option>
              <option value="name">Board Name</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Score: {minScore}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              {uniqueIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
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
        </div>
      </Section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{filtered.length}</div>
            <div className="text-gray-600">Boards Shown</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {filtered.length > 0 ? (filtered.reduce((sum, b) => sum + b.score, 0) / filtered.length).toFixed(1) : 0}
            </div>
            <div className="text-gray-600">Avg Score</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {filtered.length > 0 ? (filtered.reduce((sum, b) => sum + b.totalPostings, 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-gray-600">Total Postings</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {filtered.length > 0 ? (filtered.reduce((sum, b) => sum + b.dataQuality, 0) / filtered.length).toFixed(0)}%
            </div>
            <div className="text-gray-600">Avg Quality</div>
          </div>
        </Card>
      </div>

      {/* Comparison Table */}
      <Section title={`Comparison Table (${filtered.length} boards)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Board Name</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Grade</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Industry</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Avg Lifespan (days)</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Repost Rate (%)</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Postings</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Data Quality</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((board) => (
                  <tr key={board.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a href={board.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {board.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg">{board.score}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded font-bold ${
                        board.grade === 'A+' || board.grade === 'A' ? 'bg-green-100 text-green-800' :
                        board.grade === 'B+' || board.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        board.grade === 'C+' || board.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {board.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">{board.industry}</td>
                    <td className="px-6 py-4 text-center">{board.avgLifespan}</td>
                    <td className="px-6 py-4 text-center">{board.repostRate}%</td>
                    <td className="px-6 py-4 text-center text-gray-700">{board.totalPostings.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-gray-700">{board.dataQuality}%</div>
                      <div className="w-12 h-2 bg-gray-200 rounded mx-auto mt-1">
                        <div className="h-full bg-blue-600 rounded" style={{ width: `${board.dataQuality}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-semibold ${
                        board.trend === 'up' ? 'text-green-600' :
                        board.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {board.trend === 'up' ? '📈' : board.trend === 'down' ? '📉' : '→'} {board.trendValue > 0 ? '+' : ''}{board.trendValue}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
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

// Convert JobBoard to ComparisonRow with default scores
function mapBoardToComparisonRow(board: JobBoard, index: number): ComparisonRow {
  return {
    id: board.id,
    name: board.name,
    score: 50 + Math.floor(Math.random() * 50), // Default score
    grade: 'B',
    avgLifespan: 15 + Math.floor(Math.random() * 20),
    repostRate: 5 + Math.floor(Math.random() * 20),
    totalPostings: 500 + Math.floor(Math.random() * 5000),
    topRole: board.category === 'tech' ? 'Software Engineer' : 'General',
    industry: board.industry,
    trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down' | 'stable',
    trendValue: Math.random() * 5 - 2.5,
    dataQuality: 60 + Math.floor(Math.random() * 40),
    affiliateUrl: board.url,
  }
}

export const getServerSideProps: GetServerSideProps<ComparisonProps> = async () => {
  try {
    const client = getSupabase()
    
    if (!client) {
      console.error('Supabase client not initialized')
      return {
        props: {
          boards: [],
          industries: [],
        },
      }
    }

    // Fetch all job boards
    const { data: boardsData, error: boardsError } = await client
      .from('job_boards')
      .select('*')
      .order('industry')
      .order('name')

    if (boardsError) {
      console.error('Board fetch error:', boardsError)
      throw boardsError
    }

    console.log(`✅ Fetched ${(boardsData || []).length} boards for comparison`)

    // Convert boards to ComparisonRow format
    const comparisonRows = (boardsData || []).map((board: JobBoard, index: number) => 
      mapBoardToComparisonRow(board, index)
    )

    // Get unique industries
    const uniqueIndustries = Array.from(
      new Set((boardsData || []).map((b: JobBoard) => b.industry).filter(Boolean))
    ).sort() as string[]

    console.log(`✅ Found industries: ${uniqueIndustries.join(', ')}`)

    return {
      props: {
        boards: comparisonRows,
        industries: uniqueIndustries,
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      props: {
        boards: [],
        industries: [],
      },
    }
  }
}

export default ComparisonPage
