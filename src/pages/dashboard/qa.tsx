import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'
import { QAStatusBar, QAResultsTable } from '@/components/QADisplay'

export default function QAPage() {
  // Mock QA summary for now
  const summary = {
    totalTests: 38,
    passed: 35,
    failed: 2,
    warnings: 1,
    successRate: 92.1,
    criticalIssues: 0,
    timestamp: new Date().toISOString(),
    results: [
      {
        test: 'Table exists: job_boards',
        status: 'pass' as const,
        message: 'Table job_boards accessible',
        severity: 'critical' as const,
      },
      {
        test: 'Table exists: job_postings',
        status: 'pass' as const,
        message: 'Table job_postings accessible',
        severity: 'critical' as const,
      },
      {
        test: 'No orphaned postings',
        status: 'pass' as const,
        message: 'All postings have valid board_id',
        severity: 'major' as const,
      },
      {
        test: 'Efficiency scores exist',
        status: 'pass' as const,
        message: '28 efficiency scores computed',
        severity: 'minor' as const,
      },
      {
        test: 'Recent pipeline execution',
        status: 'warning' as const,
        message: 'Last pipeline run was 24 hours ago',
        severity: 'minor' as const,
      },
      {
        test: 'Lifespan metrics calculated',
        status: 'pass' as const,
        message: '89.3% of postings have lifespan calculated',
        severity: 'major' as const,
      },
    ],
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="QA & System Health"
        description="Monitor system health, data integrity, and pipeline status"
      />

      {/* Status Bar */}
      <div className="mb-8">
        <QAStatusBar summary={summary} />
      </div>

      {/* System Details */}
      <Section title="System Components">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Database Schema</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">All 7 required tables present</p>
            <p className="text-gray-500 text-xs mt-2">Last checked: 2 mins ago</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Data Pipeline</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">Running without errors</p>
            <p className="text-gray-500 text-xs mt-2">Last run: 24 mins ago</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Scoring Engine</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">Calculating correctly</p>
            <p className="text-gray-500 text-xs mt-2">28 boards scored</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Lifespan Metrics</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">89.3% postings analyzed</p>
            <p className="text-gray-500 text-xs mt-2">Coverage excellent</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Repost Detection</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">3.2% repost rate detected</p>
            <p className="text-gray-500 text-xs mt-2">Data quality healthy</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">Trend Tracking</h3>
              <span className="text-green-400 text-lg">✅</span>
            </div>
            <p className="text-gray-400 text-sm">830 snapshots collected</p>
            <p className="text-gray-500 text-xs mt-2">Trending normally</p>
          </Card>
        </div>
      </Section>

      {/* Data Quality Metrics */}
      <Section title="Data Quality Metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-gray-400 text-sm mb-2">Overall Data Quality</p>
            <p className="text-4xl font-bold text-green-400 mb-2">92.1%</p>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: '92.1%' }}></div>
            </div>
          </Card>

          <Card>
            <p className="text-gray-400 text-sm mb-2">Duplicate-Free Data</p>
            <p className="text-4xl font-bold text-blue-400 mb-2">96.8%</p>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '96.8%' }}></div>
            </div>
          </Card>

          <Card>
            <p className="text-gray-400 text-sm mb-2">Critical Field Coverage</p>
            <p className="text-4xl font-bold text-purple-400 mb-2">100%</p>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div className="bg-purple-500 h-3 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Recent Checks */}
      <Section title="Validation Results">
        <QAResultsTable results={summary.results} />
      </Section>
    </DashboardLayout>
  )
}
