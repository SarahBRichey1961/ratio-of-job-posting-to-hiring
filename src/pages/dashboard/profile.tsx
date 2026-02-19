import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  FilterBar,
  Select,
  Card,
  Section,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'

export default function ProfilePage() {
  const [selectedBoard, setSelectedBoard] = useState('stack-overflow')

  const boardData: Record<string, any> = {
    'stack-overflow': {
      name: 'Stack Overflow',
      score: 88,
      grade: 'A+',
      lifespan: 12,
      reposts: '3%',
      jobs: 2456,
      topRoles: ['Software Engineer', 'DevOps Engineer', 'ML Engineer'],
      trend: 'up',
      anomalies: 0,
    },
    linkedin: {
      name: 'LinkedIn',
      score: 85,
      grade: 'A',
      lifespan: 14,
      reposts: '5%',
      jobs: 5432,
      topRoles: ['Product Manager', 'Software Engineer', 'Sales Engineer'],
      trend: 'up',
      anomalies: 0,
    },
  }

  const board = boardData[selectedBoard]

  return (
    <DashboardLayout>
      <PageHeader
        title="Board Profile"
        description="Detailed analysis of a single job board's efficiency and characteristics"
      />

      {/* Board Selector */}
      <FilterBar>
        <Select
          label="Select Board"
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
          options={[
            { value: 'stack-overflow', label: 'Stack Overflow' },
            { value: 'linkedin', label: 'LinkedIn' },
          ]}
        />
      </FilterBar>

      {/* Overview */}
      <StatsSection>
        <MetricCard
          label="Efficiency Score"
          value={board.score}
          subtitle={`Grade: ${board.grade}`}
          icon="⭐"
        />
        <MetricCard
          label="Avg Lifespan"
          value={`${board.lifespan}d`}
          subtitle="Days to fill position"
          icon="⏱️"
        />
        <MetricCard
          label="Data Quality"
          value={board.reposts}
          subtitle="Repost rate"
          icon="🔄"
        />
        <MetricCard
          label="Jobs Listed"
          value={board.jobs}
          subtitle="In database"
          trend="up"
          trendValue="+12%"
          icon="📝"
        />
      </StatsSection>

      {/* Details */}
      <Section title="Board Details">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-4">📊 Performance Metrics</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Hiring Speed</span>
                  <span className="text-white">{board.lifespan} days</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(30 - board.lifespan * 2.5) / 3}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Data Quality</span>
                  <span className="text-white">{board.reposts} duplication</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${100 - parseFloat(board.reposts)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Overall Efficiency</span>
                  <span className="text-white">{board.score}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${board.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">👔 Top Roles</h3>
            <div className="space-y-2">
              {board.topRoles.map((role, idx) => (
                <div key={role} className="flex items-center gap-2">
                  <span className="text-gray-400">#{idx + 1}.</span>
                  <span className="text-white flex-1">{role}</span>
                  <span className="text-gray-500 text-sm">{256 - idx * 50} jobs</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">📈 Trend</h3>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{board.trend === 'up' ? '📈' : '📉'}</div>
              <div>
                <p className="text-white font-semibold">
                  {board.trend === 'up' ? 'Improving' : 'Declining'} Trend
                </p>
                <p className="text-gray-400 text-sm">+4.5% over past 30 days</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">⚠️ System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Active data collection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">No anomalies detected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-gray-300">Low sample size in some roles</span>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Score Breakdown */}
      <Section title="Efficiency Score Breakdown">
        <Card>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Lifespan Component (40%)</span>
                <span className="text-white font-semibold">35 / 40 points</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '87.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Repost Quality (30%)</span>
                <span className="text-white font-semibold">30 / 30 points</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Employer Feedback (20%)</span>
                <span className="text-white font-semibold">19 / 20 points</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Candidate Visibility (10%)</span>
                <span className="text-white font-semibold">4 / 10 points</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-yellow-600 h-3 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </Section>
    </DashboardLayout>
  )
}
