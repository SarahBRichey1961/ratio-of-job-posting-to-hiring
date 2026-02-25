/**
 * PM Analytics Dashboard Page
 * Displays daily job board activity metrics
 */

import React from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/DashboardLayout'
import PMDailyFeed from '../../components/PMDailyFeed'
import ProtectedRoute from '../../components/ProtectedRoute'

const PMAnalyticsDashboard: React.FC = () => {
  const router = useRouter()
  const { date } = router.query

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 p-6">
          {/* Navigation breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-slate-700 font-medium">PM Analytics</span>
          </div>

          {/* Main Content */}
          <PMDailyFeed date={date as string | undefined} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default PMAnalyticsDashboard
