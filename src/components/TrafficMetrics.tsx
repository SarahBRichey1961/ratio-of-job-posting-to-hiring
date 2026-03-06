import React from 'react'
import { Card } from '@/components/DashboardUI'

export function TrafficMetrics() {
  return (
    <div className="mb-8 space-y-6">
      {/* Traffic Overview Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          📊 Site Traffic & Visitor Trends
        </h2>
        <p className="text-gray-400">Real-time traffic analytics from Google Analytics</p>
      </div>

      {/* Google Analytics Dashboard Embed */}
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
          <p className="text-gray-300 mb-6 text-center max-w-md">
            View your complete analytics dashboard with real-time visitor metrics, traffic sources, and page performance.
          </p>
          <a
            href="https://analytics.google.com/analytics/web/#/a386799698p527402328/realtime/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            📊 Open Google Analytics Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-gray-500 text-sm mt-4">Opens in a new tab</p>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white mb-4">✨ Key Insights</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Real-time visitor tracking enabled with Google Analytics 4</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>Automatic page view tracking on all routes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>Use the dashboard button above to access detailed analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>Data appears in your GA dashboard within 24-48 hours for historical reports</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
