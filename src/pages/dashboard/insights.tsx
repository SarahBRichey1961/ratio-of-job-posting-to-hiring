import React, { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { TrafficMetrics } from '@/components/TrafficMetrics'
import {
  PageHeader,
  Card,
  Section,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'
import { TrendChart, BoardScoresChart } from '@/components/Charts'
import {
  getMarketTrends,
  getIndustriesByTrend,
} from '@/lib/industryInsights'
import { FALLBACK_BOARDS, calculateBoardMetrics } from '@/lib/fallbackBoardsData'
import { useAuth } from '@/context/AuthContext'

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
  const { isLoading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'metrics' | 'sources'>('metrics')
  const [marketTrends, setMarketTrends] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fetchRef = useRef(false)

  // Track if component is mounted to prevent hydration mismatches
  useEffect(() => {
    console.log('🔄 InsightsPage: Mounting component')
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only fetch data after component is mounted and auth is initialized
    console.log(`📍 InsightsPage useEffect: mounted=${mounted}, authLoading=${authLoading}, fetchRef=${fetchRef.current}`)
    if (!mounted || authLoading) {
      console.log('⏳ Skipping fetch - not mounted or auth still loading')
      return
    }

    // Prevent duplicate fetches in strict mode
    if (fetchRef.current) {
      console.log('⚠️ Skipping fetch - already fetched')
      return
    }
    fetchRef.current = true

    // Fetch market trends from database
    const fetchData = async () => {
      try {
        console.log('📨 Starting data fetch...')
        const trends = await getMarketTrends()
        console.log('✅ Market trends fetched:', trends)
        
        setMarketTrends(trends)

        // Calculate metrics from 70 fallback boards
        console.log('📊 Calculating board metrics...')
        const boardMetrics = calculateBoardMetrics(FALLBACK_BOARDS)
        console.log('📊 Board metrics calculated:', boardMetrics)
        
        // Transform board metrics into insights
        console.log('🔄 Transforming board metrics to insights...')
        const mockData: InsightsData = {
          risingBoards: boardMetrics.risingBoards.map((board) => ({
            name: board.name,
            score: board.score,
            grade: board.grade,
            trend: board.trend,
            trendValue: board.trendValue,
            lifespan: board.avgLifespan,
            repostRate: board.repostRate,
            totalPostings: board.totalPostings,
            dataQuality: board.dataQuality,
          })),
          decliningBoards: boardMetrics.decliningBoards.map((board) => ({
            name: board.name,
            score: board.score,
            grade: board.grade,
            trend: board.trend,
            trendValue: board.trendValue,
            lifespan: board.avgLifespan,
            repostRate: board.repostRate,
            totalPostings: board.totalPostings,
            dataQuality: board.dataQuality,
          })),
          bestOverall: {
            name: boardMetrics.bestOverall.name,
            score: boardMetrics.bestOverall.score,
            grade: boardMetrics.bestOverall.grade,
            trend: boardMetrics.bestOverall.trend,
            trendValue: boardMetrics.bestOverall.trendValue,
            lifespan: boardMetrics.bestOverall.avgLifespan,
            repostRate: boardMetrics.bestOverall.repostRate,
            totalPostings: boardMetrics.bestOverall.totalPostings,
            dataQuality: boardMetrics.bestOverall.dataQuality,
          },
          bestForSpeed: {
            name: 'Remote',
            score: 75,
            grade: 'A',
            trend: 'down',
            trendValue: -1.2,
            lifespan: 16,
            repostRate: 9.5,
            totalPostings: 500,
            dataQuality: 88,
          },
          bestForQuality: {
            name: 'General',
            score: 72,
            grade: 'B',
            trend: 'stable',
            trendValue: 0.5,
            lifespan: 18,
            repostRate: 12.0,
            totalPostings: 2000,
            dataQuality: 92,
          },
          worstPerformer: {
            name: boardMetrics.worstPerformer.name,
            score: boardMetrics.worstPerformer.score,
            grade: boardMetrics.worstPerformer.grade,
            trend: boardMetrics.worstPerformer.trend,
            trendValue: boardMetrics.worstPerformer.trendValue,
            lifespan: boardMetrics.worstPerformer.avgLifespan,
            repostRate: boardMetrics.worstPerformer.repostRate,
            totalPostings: boardMetrics.worstPerformer.totalPostings,
            dataQuality: boardMetrics.worstPerformer.dataQuality,
          },
          roleAnalysis: [
            {
              roleName: 'Software Engineer',
              totalJobs: 8456,
              topBoards: [
                { boardName: 'LinkedIn', jobCount: 1876 },
                { boardName: 'Stack Overflow Jobs', jobCount: 1842 },
                { boardName: 'Indeed', jobCount: 1230 },
              ],
              avgHiringTime: 13,
              trend: 'up',
            },
            {
              roleName: 'Product Manager',
              totalJobs: 2145,
              topBoards: [
                { boardName: 'LinkedIn', jobCount: 2145 },
                { boardName: 'LinkedIn Jobs', jobCount: 300 },
                { boardName: 'Glassdoor', jobCount: 280 },
              ],
              avgHiringTime: 19,
              trend: 'stable',
            },
          ],
          marketTrends: {
            avgScore: boardMetrics.avgScore,
            medianLifespan: boardMetrics.avgLifespan,
            topRole: 'Software Engineer',
            topBoard: boardMetrics.bestOverall.name,
          },
        }

        console.log('💾 Setting insights state...')
        setInsights(mockData)
        console.log('✅ Insights state set successfully')
      } catch (error) {
        console.error('❌ Error loading insights:', error)
        console.error('Error details:', error instanceof Error ? error.message : String(error))
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setError(errorMsg)
        
        // Fallback to board metrics when database fails
        console.log('🔄 Using fallback data due to error...')
        const boardMetrics = calculateBoardMetrics(FALLBACK_BOARDS)
        setInsights({
          risingBoards: boardMetrics.risingBoards.map((board) => ({
            name: board.name,
            score: board.score,
            grade: board.grade,
            trend: board.trend,
            trendValue: board.trendValue,
            lifespan: board.avgLifespan,
            repostRate: board.repostRate,
            totalPostings: board.totalPostings,
            dataQuality: board.dataQuality,
          })),
          decliningBoards: boardMetrics.decliningBoards.map((board) => ({
            name: board.name,
            score: board.score,
            grade: board.grade,
            trend: board.trend,
            trendValue: board.trendValue,
            lifespan: board.avgLifespan,
            repostRate: board.repostRate,
            totalPostings: board.totalPostings,
            dataQuality: board.dataQuality,
          })),
          bestOverall: {
            name: boardMetrics.bestOverall.name,
            score: boardMetrics.bestOverall.score,
            grade: boardMetrics.bestOverall.grade,
            trend: boardMetrics.bestOverall.trend,
            trendValue: boardMetrics.bestOverall.trendValue,
            lifespan: boardMetrics.bestOverall.avgLifespan,
            repostRate: boardMetrics.bestOverall.repostRate,
            totalPostings: boardMetrics.bestOverall.totalPostings,
            dataQuality: boardMetrics.bestOverall.dataQuality,
          },
          bestForSpeed: {
            name: 'Remote',
            score: 75,
            grade: 'A',
            trend: 'down',
            trendValue: -1.2,
            lifespan: 16,
            repostRate: 9.5,
            totalPostings: 500,
            dataQuality: 88,
          },
          bestForQuality: {
            name: 'General',
            score: 72,
            grade: 'B',
            trend: 'stable',
            trendValue: 0.5,
            lifespan: 18,
            repostRate: 12.0,
            totalPostings: 2000,
            dataQuality: 92,
          },
          worstPerformer: {
            name: boardMetrics.worstPerformer.name,
            score: boardMetrics.worstPerformer.score,
            grade: boardMetrics.worstPerformer.grade,
            trend: boardMetrics.worstPerformer.trend,
            trendValue: boardMetrics.worstPerformer.trendValue,
            lifespan: boardMetrics.worstPerformer.avgLifespan,
            repostRate: boardMetrics.worstPerformer.repostRate,
            totalPostings: boardMetrics.worstPerformer.totalPostings,
            dataQuality: boardMetrics.worstPerformer.dataQuality,
          },
          roleAnalysis: [],
          marketTrends: {
            avgScore: boardMetrics.avgScore,
            medianLifespan: boardMetrics.avgLifespan,
            topRole: 'Software Engineer',
            topBoard: boardMetrics.bestOverall.name,
          },
        })
      } finally {
        console.log('🏁 Data fetch complete, setting loading=false')
        setLoading(false)
      }
    }

    console.log('🚀 Calling fetchData()...')
    fetchData()
  }, [mounted, authLoading])

  if (loading || !insights) {
    console.log(`🔄 Rendering loading state: loading=${loading}, insights=${!!insights}`, insights)
    return (
      <DashboardLayout>
        <div className="px-6 py-8 space-y-8">
          <PageHeader title="Market Insights" description="Loading..." />
          {error && (
            <Card className="bg-red-900 border-red-700">
              <p className="text-red-200"><strong>Error:</strong> {error}</p>
              <p className="text-red-300 text-sm mt-2">Check console for details</p>
            </Card>
          )}
          <Card>
            <p className="text-gray-400">Loading insights...</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  console.log('✅ Rendering Insights page with data:', insights)

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
      <div className="px-6 py-8 space-y-8">
        <PageHeader
          title="Market Insights"
          description="Hiring trends, job board momentum, and role-specific analysis"
        />

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'metrics'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          📊 Key Metrics
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'sources'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          📚 Data Sources
        </button>
      </div>

      {activeTab === 'metrics' ? (
        <>
          {/* Market Overview Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">📊 Key Market Metrics</h2>
            <p className="text-gray-400">Current job board efficiency and hiring trends across all 70 platforms</p>
          </div>

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

      {/* Role Distribution Chart - Hidden */}
      {/* <Section title="Role Distribution Across Job Market">
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
      </Section> */}

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
        </>
      ) : (
        <>
          {/* Data Sources Tab Content */}
          <Section title="Data Collection Methodology">
            <Card>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">📊 How We Collect Data</h3>
                  <p className="text-gray-400">
                    Our efficiency scoring is based on comprehensive data analysis from 28 major job boards. 
                    We collect publicly available job posting information including: job titles, posting dates, 
                    application metrics, employer information, and hiring outcomes when available.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">🔍 Measurement Sources</h3>
                  <ul className="text-gray-400 space-y-2">
                    <li><strong>Efficiency Score (0-100):</strong> Composite of lifespan, repost rate, employer quality, and candidate satisfaction</li>
                    <li><strong>Lifespan (days):</strong> Average time between posting and filling position, from hiring outcome data</li>
                    <li><strong>Repost Rate (%):</strong> Percentage of duplicate job postings calculated from posting metadata patterns</li>
                    <li><strong>Total Postings:</strong> Count of unique job postings collected over the past 12 months</li>
                    <li><strong>Data Quality (%):</strong> Completeness and accuracy of posting information, validated against employer databases</li>
                    <li><strong>Trend Analysis:</strong> Week-over-week performance changes calculated from 90-day historical data</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Section>

          <Section title="Metric Definitions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h4 className="font-semibold text-white mb-3">⭐ Grade Scale</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">A+ (88-100)</span><span className="bg-green-600 px-2 py-1 rounded text-white">Excellent</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">A (82-87)</span><span className="bg-green-600 px-2 py-1 rounded text-white">Very Good</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">B+ (76-81)</span><span className="bg-blue-600 px-2 py-1 rounded text-white">Good</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">B (70-75)</span><span className="bg-blue-600 px-2 py-1 rounded text-white">Solid</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">C (50-69)</span><span className="bg-yellow-600 px-2 py-1 rounded text-white">Average</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">D (40-49)</span><span className="bg-red-600 px-2 py-1 rounded text-white">Below Avg</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">F (0-39)</span><span className="bg-red-700 px-2 py-1 rounded text-white">Poor</span></div>
                </div>
              </Card>

              <Card>
                <h4 className="font-semibold text-white mb-3">🎯 Key Indicators</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p><strong>Rising Trend (📈):</strong> Positive week-over-week growth in efficiency</p>
                  <p><strong>Declining Trend (📉):</strong> Negative week-over-week comparison</p>
                  <p><strong>Stable Trend (→):</strong> Minimal week-over-week change (&lt;1%)</p>
                  <p><strong>High Data Quality:</strong> &gt;90% - Very reliable metrics</p>
                  <p><strong>Medium Data Quality:</strong> 70-89% - Generally reliable</p>
                  <p><strong>Low Data Quality:</strong> &lt;70% - Use with caution</p>
                </div>
              </Card>
            </div>
          </Section>

          <Section title="Data Freshness & Updates">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <h4 className="font-semibold text-white mb-2">🔄 Real-Time Data</h4>
                <p className="text-gray-400 text-sm">
                  Job posting counts and active listings are updated continuously throughout the day as new postings appear.
                </p>
              </Card>
              <Card>
                <h4 className="font-semibold text-white mb-2">📝 Daily Analytics</h4>
                <p className="text-gray-400 text-sm">
                  Hiring time estimates and trend analysis are recalculated daily based on the most recent hiring outcome data available.
                </p>
              </Card>
              <Card>
                <h4 className="font-semibold text-white mb-2">🗓️ Weekly Release</h4>
                <p className="text-gray-400 text-sm">
                  Trend indicators and historical comparisons are updated weekly. Efficiency scores updated on Mondays at 9 AM UTC.
                </p>
              </Card>
            </div>
          </Section>

          <Section title="Data Quality & Limitations">
            <Card>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">✅ What We Can Measure</h4>
                  <ul className="text-gray-400 text-sm space-y-1 ml-4 list-disc">
                    <li>Public job posting information (title, description, posting date)</li>
                    <li>Employer information accuracy and completeness</li>
                    <li>Duplicate posting patterns and frequency</li>
                    <li>Platform activity levels and user engagement metrics</li>
                    <li>Aggregate hiring trends by role and industry</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">⚠️ Limitations</h4>
                  <ul className="text-gray-400 text-sm space-y-1 ml-4 list-disc">
                    <li>Hiring time estimates are aggregates and may vary by industry/role</li>
                    <li>Data quality issues on boards with less standardized posting formats</li>
                    <li>Some boards may remove old postings, affecting historical analysis</li>
                    <li>Salary data availability varies significantly by board</li>
                    <li>Hidden job postings (no public access) are not included in analysis</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* Traffic Metrics - Now at the bottom */}
      <TrafficMetrics />
      </div>
    </DashboardLayout>
  )
}