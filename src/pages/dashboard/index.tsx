import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  StatsSection,
  MetricCard,
  Section,
  Card,
} from '@/components/DashboardUI'

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Overall job board efficiency metrics and market overview"
      />

      {/* Key Metrics */}
      <StatsSection>
        <MetricCard
          label="Total Boards"
          value="36"
          subtitle="Across all categories"
          icon="📊"
        />
        <MetricCard
          label="Avg Efficiency"
          value="68"
          subtitle="Out of 100"
          trend="up"
          trendValue="+5.2%"
          icon="⭐"
        />
        <MetricCard
          label="Total Postings"
          value="18,542"
          subtitle="In database"
          trend="up"
          trendValue="+12.3%"
          icon="📝"
        />
        <MetricCard
          label="Unique Roles"
          value="156"
          subtitle="Roles tracked"
          trend="stable"
          trendValue="No change"
          icon="👔"
        />
      </StatsSection>

      {/* Market Overview */}
      <Section title="All Job Boards Rankings">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-200">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-200">Board</th>
                  <th className="text-center py-3 px-4 text-gray-200">Score</th>
                  <th className="text-center py-3 px-4 text-gray-200">Grade</th>
                  <th className="text-center py-3 px-4 text-gray-200">Category</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: 'Stack Overflow', score: 88, grade: 'A+', category: 'Tech' },
                  { rank: 2, name: 'LinkedIn Jobs', score: 85, grade: 'A', category: 'General' },
                  { rank: 3, name: 'GitHub Jobs', score: 84, grade: 'A', category: 'Tech' },
                  { rank: 4, name: 'HackerNews', score: 82, grade: 'A', category: 'Tech' },
                  { rank: 5, name: 'We Work Remotely', score: 74, grade: 'B+', category: 'Remote' },
                  { rank: 6, name: 'Indeed', score: 72, grade: 'B', category: 'General' },
                  { rank: 7, name: 'Glassdoor', score: 68, grade: 'B', category: 'General' },
                  { rank: 8, name: 'Built In', score: 67, grade: 'B', category: 'Tech' },
                  { rank: 9, name: 'Remote Tech Jobs', score: 65, grade: 'B-', category: 'Remote' },
                  { rank: 10, name: 'ZipRecruiter', score: 65, grade: 'B-', category: 'General' },
                  { rank: 11, name: 'Remotive', score: 63, grade: 'B-', category: 'Remote' },
                  { rank: 12, name: 'RemoteOK', score: 62, grade: 'C+', category: 'Remote' },
                  { rank: 13, name: 'The Muse', score: 60, grade: 'C+', category: 'Tech' },
                  { rank: 14, name: 'CareerBuilder', score: 58, grade: 'C', category: 'General' },
                  { rank: 15, name: 'Hired', score: 57, grade: 'C', category: 'Tech' },
                  { rank: 16, name: 'FlexJobs', score: 56, grade: 'C', category: 'Remote' },
                  { rank: 17, name: 'AngelList', score: 54, grade: 'C', category: 'Tech' },
                  { rank: 18, name: 'WellFound', score: 53, grade: 'C', category: 'Tech' },
                  { rank: 19, name: 'Remote.co', score: 52, grade: 'D', category: 'Remote' },
                  { rank: 20, name: 'Dribbble Jobs', score: 51, grade: 'D', category: 'Tech' },
                  { rank: 21, name: 'Idealist.org', score: 49, grade: 'D', category: 'Niche' },
                  { rank: 22, name: 'Virtual Vocations', score: 47, grade: 'D', category: 'Remote' },
                  { rank: 23, name: 'Crunchboard', score: 45, grade: 'F', category: 'Tech' },
                  { rank: 24, name: 'Dice', score: 44, grade: 'F', category: 'Tech' },
                  { rank: 25, name: 'Data Jobs', score: 43, grade: 'F', category: 'Niche' },
                  { rank: 26, name: 'ProBlogger', score: 42, grade: 'F', category: 'Niche' },
                  { rank: 27, name: 'Design Observer', score: 41, grade: 'F', category: 'Niche' },
                  { rank: 28, name: 'Geekwork', score: 39, grade: 'F', category: 'Niche' },
                  { rank: 29, name: 'Blind', score: 39, grade: 'F', category: 'Tech' },
                  { rank: 30, name: 'iCrunchData', score: 38, grade: 'F', category: 'Niche' },
                  { rank: 31, name: 'EnvironmentalCareer.com', score: 37, grade: 'F', category: 'Niche' },
                  { rank: 32, name: 'Monster', score: 35, grade: 'F', category: 'General' },
                  { rank: 33, name: 'Mediabistro', score: 32, grade: 'F', category: 'Niche' },
                  { rank: 34, name: 'Reddit /r/sysadminjobs', score: 29, grade: 'F', category: 'Niche' },
                  { rank: 35, name: 'CraigsList', score: 28, grade: 'F', category: 'General' },
                  { rank: 36, name: 'Microsoft', score: 27, grade: 'F', category: 'Company Career Site' },
                ].map((board) => (
                  <tr key={board.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-300 font-semibold">{board.rank}</td>
                    <td className="py-3 px-4 text-gray-200">
                      <Link href={`/dashboard/profile?board=${encodeURIComponent(board.name)}`}>
                        <span className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer">
                          {board.name}
                        </span>
                      </Link>
                    </td>
                    <td className="text-center py-3 px-4 text-white font-bold">{board.score}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                          board.score >= 80
                            ? 'bg-green-600'
                            : board.score >= 60
                            ? 'bg-blue-600'
                            : board.score >= 40
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {board.grade}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-400 text-xs">{board.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Activity Section */}
      <Section title="Market Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-3">⚡ Hottest Roles</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Software Engineer</span>
                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                  ↑ 156
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Product Manager</span>
                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                  ↑ 45
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Data Scientist</span>
                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                  ↑ 32
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">DevOps Engineer</span>
                <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded text-xs">
                  → 8 jobs/day
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ML Engineer</span>
                <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                  ↓ -5
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-3">📈 Recent Changes</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-400">📈</span>
                <div>
                  <p className="text-gray-300 text-sm">Stack Overflow</p>
                  <p className="text-green-400 text-xs">+8 points this week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">📉</span>
                <div>
                  <p className="text-gray-300 text-sm">CraigsList</p>
                  <p className="text-red-400 text-xs">-6 points this week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <div>
                  <p className="text-gray-300 text-sm">Indeed</p>
                  <p className="text-yellow-400 text-xs">Anomaly detected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">→</span>
                <div>
                  <p className="text-gray-300 text-sm">Reddit Jobs</p>
                  <p className="text-gray-400 text-xs">Stable trend</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Quick Stats */}
      <Section title="Key Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-2">💼 Industry Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Tech (12 boards)</span>
                  <span className="text-white">78</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Remote (5 boards)</span>
                  <span className="text-white">71</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">General (10 boards)</span>
                  <span className="text-white">65</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Niche (6 boards)</span>
                  <span className="text-white">42</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-2">🎯 System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Data Pipeline</span>
                <span className="bg-green-900 text-green-200 px-3 py-1 rounded text-sm">
                  ✅ Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Scoring Engine</span>
                <span className="bg-green-900 text-green-200 px-3 py-1 rounded text-sm">
                  ✅ Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Update</span>
                <span className="text-gray-300 text-sm">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Data Quality</span>
                <span className="text-blue-300 text-sm font-medium">92.1%</span>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </DashboardLayout>
  )
}
