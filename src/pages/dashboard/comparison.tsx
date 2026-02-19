import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  FilterBar,
  Button,
  Select,
  Card,
  Section,
} from '@/components/DashboardUI'

export default function ComparisonPage() {
  const [sortBy, setSortBy] = useState('score')
  const [industry, setIndustry] = useState('')

  const boards = [
    { name: 'Stack Overflow', score: 88, lifespan: 12, reposts: '3%', grade: 'A+' },
    { name: 'LinkedIn', score: 85, lifespan: 14, reposts: '5%', grade: 'A' },
    { name: 'GitHub Jobs', score: 84, lifespan: 13, reposts: '4%', grade: 'A' },
    { name: 'Indeed', score: 72, lifespan: 18, reposts: '12%', grade: 'B' },
    { name: 'Glassdoor', score: 68, lifespan: 21, reposts: '15%', grade: 'B' },
    { name: 'We Work Remotely', score: 74, lifespan: 16, reposts: '8%', grade: 'B+' },
    { name: 'HackerNews', score: 82, lifespan: 11, reposts: '2%', grade: 'A' },
    { name: 'CraigsList', score: 45, lifespan: 35, reposts: '42%', grade: 'F' },
  ]

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400'
    if (grade.startsWith('B')) return 'text-blue-400'
    if (grade.startsWith('C')) return 'text-yellow-400'
    return 'text-red-400'
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
        />
        <Select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'tech', label: 'Tech' },
            { value: 'remote', label: 'Remote' },
            { value: 'general', label: 'General' },
            { value: 'niche', label: 'Niche' },
          ]}
        />
      </FilterBar>

      {/* Comparison Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">
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
                      <span className="text-white font-bold">{board.score}</span>
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            board.score >= 80
                              ? 'bg-green-500'
                              : board.score >= 60
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${board.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-300">
                    {board.lifespan}d
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={
                        parseFloat(board.reposts) < 10
                          ? 'text-green-400'
                          : parseFloat(board.reposts) < 20
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {board.reposts}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-bold text-lg ${gradeColor(board.grade)}`}>
                      {board.grade}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      View Profile →
                    </button>
                  </td>
                </tr>
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
