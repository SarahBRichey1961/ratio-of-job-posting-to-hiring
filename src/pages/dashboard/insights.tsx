import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  Card,
  Section,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'
import { TrendChart, RoleDistributionChart, BoardScoresChart } from '@/components/Charts'

interface BoardInsight {
  name: string
  score: number
  grade: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  lifespan: number
  repostRate: number
  totalPostings: number
  dataQuality: number
}

interface RoleInsight {
  roleName: string
  totalJobs: number
  topBoards: Array<{
    boardName: string
    jobCount: number
    avgSalary?: number
  }>
  avgHiringTime: number
  trend: 'up' | 'down' | 'stable'
}

interface InsightsData {
  risingBoards: BoardInsight[]
  decliningBoards: BoardInsight[]
  bestOverall: BoardInsight
  bestForSpeed: BoardInsight
  bestForQuality: BoardInsight
  worstPerformer: BoardInsight
  roleAnalysis: RoleInsight[]
  marketTrends: {
    avgScore: number
    medianLifespan: number
    topRole: string
    topBoard: string
  }
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch insights data
    const mockData: InsightsData = {
      risingBoards: [
        {
          name: 'Stack Overflow',
          score: 88,
          grade: 'A+',
          trend: 'up',
          trendValue: 5.2,
          lifespan: 12,
          repostRate: 3,
          totalPostings: 2456,
          dataQuality: 97,
        },
        {
          name: 'LinkedIn',
          score: 85,
          grade: 'A',
          trend: 'up',
          trendValue: 3.1,
          lifespan: 14,
          repostRate: 5,
          totalPostings: 5432,
          dataQuality: 95,
        },
      ],
      decliningBoards: [
        {
          name: 'CraigsList',
          score: 45,
          grade: 'F',
          trend: 'down',
          trendValue: -8.5,
          lifespan: 35,
          repostRate: 42,
          totalPostings: 789,
          dataQuality: 58,
        },
        {
          name: 'Indeed',
          score: 72,
          grade: 'B',
          trend: 'down',
          trendValue: -2.3,
          lifespan: 18,
          repostRate: 12,
          totalPostings: 3200,
          dataQuality: 88,
        },
      ],
      bestOverall: {
        name: 'Stack Overflow',
        score: 88,
        grade: 'A+',
        trend: 'up',
        trendValue: 5.2,
        lifespan: 12,
        repostRate: 3,
        totalPostings: 2456,
        dataQuality: 97,
      },
      bestForSpeed: {
        name: 'HackerNews',
        score: 82,
        grade: 'A',
        trend: 'stable',
        trendValue: 0.5,
        lifespan: 11,
        repostRate: 2,
        totalPostings: 892,
        dataQuality: 98,
      },
      bestForQuality: {
        name: 'HackerNews',
        score: 82,
        grade: 'A',
        trend: 'stable',
        trendValue: 0.5,
        lifespan: 11,
        repostRate: 2,
        totalPostings: 892,
        dataQuality: 98,
      },
      worstPerformer: {
        name: 'CraigsList',
        score: 45,
        grade: 'F',
        trend: 'down',
        trendValue: -8.5,
        lifespan: 35,
        repostRate: 42,
        totalPostings: 789,
        dataQuality: 58,
      },
      roleAnalysis: [
        {
          roleName: 'Software Engineer',
          totalJobs: 8456,
          topBoards: [
            { boardName: 'LinkedIn', jobCount: 1876 },
            { boardName: 'Stack Overflow', jobCount: 1842 },
            { boardName: 'Indeed', jobCount: 1230 },
            { boardName: 'GitHub Jobs', jobCount: 1456 },
          ],
          avgHiringTime: 13,
          trend: 'up',
        },
        {
          roleName: 'Product Manager',
          totalJobs: 2145,
          topBoards: [
            { boardName: 'LinkedIn', jobCount: 2145 },
            { boardName: 'We Work Remotely', jobCount: 300 },
            { boardName: 'Glassdoor', jobCount: 280 },
          ],
          avgHiringTime: 19,
          trend: 'stable',
        },
        {
          roleName: 'Data Scientist',
          totalJobs: 1524,
          topBoards: [
            { boardName: 'LinkedIn', jobCount: 654 },
            { boardName: 'Stack Overflow', jobCount: 412 },
            { boardName: 'GitHub Jobs', jobCount: 234 },
          ],
          avgHiringTime: 14,
          trend: 'up',
        },
        {
          roleName: 'DevOps Engineer',
          totalJobs: 987,
          topBoards: [
            { boardName: 'Stack Overflow', jobCount: 287 },
            { boardName: 'GitHub Jobs', jobCount: 234 },
            { boardName: 'LinkedIn', jobCount: 298 },
          ],
          avgHiringTime: 12,
          trend: 'up',
        },
        {
          roleName: 'Sales',
          totalJobs: 2314,
          topBoards: [
            { boardName: 'LinkedIn', jobCount: 1050 },
            { boardName: 'Indeed', jobCount: 654 },
            { boardName: 'Glassdoor', jobCount: 450 },
          ],
          avgHiringTime: 22,
          trend: 'down',
        },
      ],
      marketTrends: {
        avgScore: 70.1,
        medianLifespan: 16,
        topRole: 'Software Engineer',
        topBoard: 'Stack Overflow',
      },
    }

    setInsights(mockData)
    setLoading(false)
  }, [])

  if (loading || !insights) {
    return (
      <DashboardLayout>
        <PageHeader title="Market Insights" description="Loading..." />
        <Card>
          <p className="text-gray-400">Loading insights...</p>
        </Card>
      </DashboardLayout>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      default:
        return '→'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Market Insights"
        description="Hiring trends, job board momentum, and role-specific analysis"
      />

      {/* Market Overview Cards */}
      <StatsSection>
        <MetricCard
          label="Average Score"
          value={insights.marketTrends.avgScore}
          subtitle="Across all boards"
          icon="📊"
        />
        <MetricCard
          label="Median Hiring Time"
          value={`${insights.marketTrends.medianLifespan}d`}
          subtitle="Days to fill position"
          icon="⏱️"
        />
        <MetricCard
          label="Top Role"
          value={insights.marketTrends.topRole}
          subtitle={`${insights.roleAnalysis[0]?.totalJobs || 0} openings`}
          icon="👤"
        />
        <MetricCard
          label="Best Board"
          value={insights.marketTrends.topBoard}
          subtitle={`Score: ${insights.bestOverall.score}`}
          icon="⭐"
        />
      </StatsSection>

      {/* Visualizations */}
      <Section title="Board Performance Trends">
        <Card>
          <BoardScoresChart
            data={[
              insights.bestOverall,
              insights.bestForSpeed,
              insights.bestForQuality,
              insights.worstPerformer,
              insights.risingBoards[0] || insights.bestOverall,
            ]}
            title="Top & Bottom Performing Boards"
            height={300}
          />
        </Card>
      </Section>

      <Section title="Role Distribution Across Job Market">
        <Card>
          <RoleDistributionChart
            data={insights.roleAnalysis.map((r) => ({
              name: r.roleName,
              value: r.totalJobs,
            }))}
            title="Total Job Openings by Role"
            height={300}
          />
        </Card>
      </Section>

      {/* Rising and Declining Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Rising Boards */}
        <Section title="📈 Rising Job Boards">
          <div className="space-y-3">
            {insights.risingBoards.map((board) => (
              <Card key={board.name}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-semibold">{board.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-sm">Score: {board.score}</span>
                      <span className={`text-sm font-semibold ${
                        board.grade.startsWith('A')
                          ? 'text-green-400'
                          : board.grade.startsWith('B')
                          ? 'text-blue-400'
                          : 'text-yellow-400'
                      }`}>
                        {board.grade}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">📈</div>
                    <p className="text-green-400 font-semibold text-sm">
                      +{board.trendValue}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-xs">
                    {board.totalPostings} jobs • {board.lifespan}d avg fill time
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* Declining Boards */}
        <Section title="📉 Declining Job Boards">
          <div className="space-y-3">
            {insights.decliningBoards.map((board) => (
              <Card key={board.name}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-semibold">{board.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-sm">Score: {board.score}</span>
                      <span className={`text-sm font-semibold ${
                        board.grade.startsWith('A')
                          ? 'text-green-400'
                          : board.grade.startsWith('B')
                          ? 'text-blue-400'
                          : board.grade.startsWith('C')
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {board.grade}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">📉</div>
                    <p className="text-red-400 font-semibold text-sm">
                      {board.trendValue}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-xs">
                    {board.totalPostings} jobs • {board.lifespan}d avg fill time
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Section title="🏆 Best Overall">
          <Card>
            <div className="text-center">
              <h4 className="text-white font-semibold text-lg">
                {insights.bestOverall.name}
              </h4>
              <div className="mt-3">
                <p className="text-4xl font-bold text-green-400">
                  {insights.bestOverall.score}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Grade: {insights.bestOverall.grade}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 text-left">
                <p className="text-gray-400 text-xs">
                  📝 {insights.bestOverall.totalPostings} jobs<br />
                  ⏱️ {insights.bestOverall.lifespan}d avg<br />
                  ✅ {insights.bestOverall.dataQuality}% quality
                </p>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="⚡ Fastest to Hire">
          <Card>
            <div className="text-center">
              <h4 className="text-white font-semibold text-lg">
                {insights.bestForSpeed.name}
              </h4>
              <div className="mt-3">
                <p className="text-4xl font-bold text-blue-400">
                  {insights.bestForSpeed.lifespan}d
                </p>
                <p className="text-gray-400 text-sm mt-1">Average fill time</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 text-left">
                <p className="text-gray-400 text-xs">
                  📊 {insights.bestForSpeed.score} score<br />
                  🔄 {insights.bestForSpeed.repostRate}% repost rate<br />
                  📝 {insights.bestForSpeed.totalPostings} jobs
                </p>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="✨ Cleanest Data">
          <Card>
            <div className="text-center">
              <h4 className="text-white font-semibold text-lg">
                {insights.bestForQuality.name}
              </h4>
              <div className="mt-3">
                <p className="text-4xl font-bold text-purple-400">
                  {insights.bestForQuality.dataQuality}%
                </p>
                <p className="text-gray-400 text-sm mt-1">Data quality score</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 text-left">
                <p className="text-gray-400 text-xs">
                  📊 {insights.bestForQuality.score} score<br />
                  🔄 {insights.bestForQuality.repostRate}% duplication<br />
                  📝 {insights.bestForQuality.totalPostings} jobs
                </p>
              </div>
            </div>
          </Card>
        </Section>
      </div>

      {/* Role Analysis */}
      <Section title="👔 Role-Specific Analysis">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.roleAnalysis.map((role) => (
            <Card key={role.roleName}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{role.roleName}</h4>
                  <span className={`text-lg ${getTrendColor(role.trend)}`}>
                    {getTrendIcon(role.trend)}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">
                  {role.totalJobs} total openings
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-400 text-xs font-semibold uppercase">
                  Top Boards
                </p>
                {role.topBoards.map((board, idx) => (
                  <div key={board.boardName} className="flex items-center justify-between">
                    <a
                      href={`/dashboard/profile?board=${encodeURIComponent(board.boardName)}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      #{idx + 1} {board.boardName}
                    </a>
                    <span className="text-gray-400 text-xs">
                      {board.jobCount} jobs
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-700">
                <p className="text-gray-400 text-xs">
                  ⏱️ Avg fill: {role.avgHiringTime} days
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Strategic Insights */}
      <Section title="💡 Strategic Insights">
        <div className="space-y-3">
          <Card>
            <div className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <p className="text-gray-300">
                <strong>Specialize by Role:</strong> Software Engineer roles cluster on
                Stack Overflow, LinkedIn, and GitHub Jobs. Product Manager roles are
                heavily concentrated on LinkedIn (100% of top 3 boards).
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex gap-3">
              <span className="text-2xl">⚡</span>
              <p className="text-gray-300">
                <strong>Speed Leaders:</strong> HackerNews (11d) and Stack Overflow (12d)
                consistently deliver the fastest hiring. CraigsList (35d) and Monster (28d)
                should be deprioritized unless volume is your goal.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex gap-3">
              <span className="text-2xl">📊</span>
              <p className="text-gray-300">
                <strong>Quality Variance:</strong> Data quality ranges from 98%
                (HackerNews) to 58% (CraigsList). High-quality data directly correlates
                with faster hiring and better outcomes.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex gap-3">
              <span className="text-2xl">📈</span>
              <p className="text-gray-300">
                <strong>Momentum Matters:</strong> Stack Overflow (+5.2%) and LinkedIn
                (+3.1%) are in growth phases. CraigsList (-8.5%) is in decline and not
                recommended for new initiatives.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex gap-3">
              <span className="text-2xl">🎓</span>
              <p className="text-gray-300">
                <strong>Recommended Strategy:</strong> For tech hiring, use Stack
                Overflow + GitHub Jobs + LinkedIn. For broad roles, add Indeed. For remote
                positions, prioritize We Work Remotely + LinkedIn.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* Comparison Link */}
      <Section title="Compare Job Boards">
        <Card>
          <p className="text-gray-400 mb-4">
            Compare all metrics side-by-side with real-time sorting and filtering.
          </p>
          <a
            href="/dashboard/comparison"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Comparison Table →
          </a>
        </Card>
      </Section>
    </DashboardLayout>
  )
}
