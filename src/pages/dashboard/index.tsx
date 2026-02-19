import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  PageHeader,
  StatsSection,
  MetricCard,
  Section,
  Card,
} from '@/components/DashboardUI'

export default function DashboardHome() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Overall job board efficiency metrics and market overview"
      />

      {/* Key Metrics */}
      <StatsSection>
        <MetricCard
          label="Total Boards"
          value="28"
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
      <Section title="Market Overview">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-3">🏆 Top 5 Boards</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">1. Stack Overflow</span>
                <span className="text-white font-semibold">88</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">2. LinkedIn</span>
                <span className="text-white font-semibold">85</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">3. GitHub Jobs</span>
                <span className="text-white font-semibold">84</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">4. Indeed</span>
                <span className="text-white font-semibold">72</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">5. Glassdoor</span>
                <span className="text-white font-semibold">68</span>
              </div>
            </div>
          </Card>

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
    </ProtectedRoute>
  )
}
