import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  Card,
  Section,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'

interface BoardProfile {
  name: string
  score: number
  grade: string
  lifespan: number
  repostRate: number
  totalPostings: number
  topRoles: Array<{ name: string; count: number }>
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  scoreBreakdown: {
    lifespan: number
    reposts: number
    employer: number
    candidate: number
  }
  dataQuality: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { board: boardParam } = router.query
  const [profile, setProfile] = useState<BoardProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!boardParam) return

    // For now, we'll use mock data
    // In production, would fetch from API
    const mockProfiles: Record<string, BoardProfile> = {
      'stack-overflow': {
        name: 'Stack Overflow',
        score: 88,
        grade: 'A+',
        lifespan: 12,
        repostRate: 3,
        totalPostings: 2456,
        topRoles: [
          { name: 'Software Engineer', count: 1842 },
          { name: 'DevOps Engineer', count: 287 },
          { name: 'ML Engineer', count: 156 },
          { name: 'Full Stack Developer', count: 123 },
          { name: 'Backend Engineer', count: 48 },
        ],
        trend: 'up',
        trendValue: 5.2,
        strengths: [
          'Exceptional data quality (97%)',
          'Fastest average hiring (12 days)',
          'Strong tech talent pool',
          'Minimal duplicate postings',
          'Excellent employer reputation',
        ],
        weaknesses: [
          'Premium pricing',
          'Tech-only focus',
          'Smaller non-tech talent pool',
        ],
        recommendations: [
          'Primary channel for tech roles',
          'Excellent for senior engineers',
          'Best ROI for long-term hiring',
          'Combine with LinkedIn for broader reach',
        ],
        scoreBreakdown: {
          lifespan: 35,
          reposts: 30,
          employer: 19,
          candidate: 4,
        },
        dataQuality: 97,
      },
      'linkedin': {
        name: 'LinkedIn',
        score: 85,
        grade: 'A',
        lifespan: 14,
        repostRate: 5,
        totalPostings: 5432,
        topRoles: [
          { name: 'Product Manager', count: 2145 },
          { name: 'Software Engineer', count: 1876 },
          { name: 'Data Scientist', count: 654 },
          { name: 'Sales Engineer', count: 432 },
          { name: 'Manager', count: 325 },
        ],
        trend: 'up',
        trendValue: 3.1,
        strengths: [
          'Largest talent pool (5432 jobs)',
          'Excellent employer branding',
          'Good for all role types',
          'Professional network leverage',
        ],
        weaknesses: [
          'Higher repost rate (5%)',
          'Can be slower to fill (14 days)',
          'More competition',
        ],
        recommendations: [
          'Best for broad reach',
          'Essential for all hiring',
          'Excellent for brand building',
          'Consider premium features',
        ],
        scoreBreakdown: {
          lifespan: 32,
          reposts: 28,
          employer: 20,
          candidate: 5,
        },
        dataQuality: 95,
      },
      'github-jobs': {
        name: 'GitHub Jobs',
        score: 84,
        grade: 'A',
        lifespan: 13,
        repostRate: 4,
        totalPostings: 1834,
        topRoles: [
          { name: 'Software Engineer', count: 1456 },
          { name: 'DevOps Engineer', count: 234 },
          { name: 'Security Engineer', count: 89 },
          { name: 'Site Reliability Engineer', count: 55 },
        ],
        trend: 'up',
        trendValue: 2.8,
        strengths: [
          'Developer-focused audience',
          'High-quality applicants',
          'Clean data (96%)',
          'Growing platform',
        ],
        weaknesses: [
          'Smaller pool than LinkedIn',
          'Limited non-tech roles',
          'Newer platform (less brand recognition)',
        ],
        recommendations: [
          'Go-to for developers',
          'Excellent technical talent quality',
          'Worth premium investment',
        ],
        scoreBreakdown: {
          lifespan: 34,
          reposts: 29,
          employer: 18,
          candidate: 3,
        },
        dataQuality: 96,
      },
      'indeed': {
        name: 'Indeed',
        score: 72,
        grade: 'B',
        lifespan: 18,
        repostRate: 12,
        totalPostings: 3200,
        topRoles: [
          { name: 'Software Engineer', count: 1230 },
          { name: 'Sales', count: 654 },
          { name: 'Warehouse', count: 432 },
          { name: 'Support', count: 345 },
        ],
        trend: 'down',
        trendValue: -2.3,
        strengths: [
          'Large job pool (3200)',
          'Good for non-tech roles',
          'Established platform',
        ],
        weaknesses: [
          'Data quality concerns (88%)',
          'Slower hiring (18 days)',
          'High duplicate rate (12%)',
          'Mixed quality of applicants',
        ],
        recommendations: [
          'Best for volume hiring',
          'Include for broader reach',
          'Monitor quality of applicants',
          'Budget for higher screening time',
        ],
        scoreBreakdown: {
          lifespan: 25,
          reposts: 23,
          employer: 18,
          candidate: 6,
        },
        dataQuality: 88,
      },
    }

    const normalizedBoard = (boardParam as string)
      .toLowerCase()
      .replace(/\s+/g, '-')

    const foundProfile =
      mockProfiles[normalizedBoard] ||
      mockProfiles['stack-overflow']

    setProfile(foundProfile)
    setLoading(false)
  }, [boardParam])

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <PageHeader title="Board Profile" description="Loading..." />
        <Card>
          <p className="text-gray-400">Loading board profile...</p>
        </Card>
      </DashboardLayout>
    )
  }

  const gradeColor =
    profile.grade.startsWith('A')
      ? 'text-green-400'
      : profile.grade.startsWith('B')
      ? 'text-blue-400'
      : profile.grade.startsWith('C')
      ? 'text-yellow-400'
      : 'text-red-400'

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    return 'bg-red-500'
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={profile.name}
        description="Detailed board analysis and performance metrics"
      />

      {/* Overview Cards */}
      <StatsSection>
        <MetricCard
          label="Efficiency Score"
          value={profile.score}
          subtitle={`Grade: ${profile.grade}`}
          icon="⭐"
        />
        <MetricCard
          label="Avg Lifespan"
          value={`${profile.lifespan}d`}
          subtitle="Days to fill"
          icon="⏱️"
        />
        <MetricCard
          label="Data Quality"
          value={`${profile.dataQuality}%`}
          subtitle="Duplicate-free"
          icon="✅"
        />
        <MetricCard
          label="Total Jobs"
          value={profile.totalPostings}
          subtitle="In database"
          trend={profile.trend}
          trendValue={`${profile.trendValue > 0 ? '+' : ''}${profile.trendValue}%`}
          icon="📝"
        />
      </StatsSection>

      {/* Score Breakdown */}
      <Section title="Efficiency Score Breakdown (Out of 100)">
        <Card>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Lifespan Component (40%)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    How fast jobs get filled
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.lifespan} / 40 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(profile.scoreBreakdown.lifespan / 40) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Repost Quality (30%)</span>
                  <p className="text-xs text-gray-500 mt-1">Data cleanliness</p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.reposts} / 30 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(profile.scoreBreakdown.reposts / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Employer Feedback (20%)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Hiring satisfaction ratings
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.employer} / 20 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={
                    { width: `${(profile.scoreBreakdown.employer / 20) * 100}%` }
                  }
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">
                    Candidate Visibility (10%)
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Job seeker engagement
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.candidate} / 10 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full"
                  style={
                    { width: `${(profile.scoreBreakdown.candidate / 10) * 100}%` }
                  }
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Performance and Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Performance Metrics */}
        <Section title="Performance Metrics">
          <Card>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Hiring Speed</span>
                  <span className="text-white">{profile.lifespan} days</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.max(100 - profile.lifespan * 3, 20)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Data Quality</span>
                  <span className="text-white">{profile.dataQuality}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${profile.dataQuality}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Overall Score</span>
                  <span className="text-white">{profile.score}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${scoreColor(profile.score)}`}
                    style={{ width: `${profile.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {profile.trend === 'up' ? '📈' : profile.trend === 'down' ? '📉' : '→'}
                  </span>
                  <div>
                    <p className="text-white font-semibold">
                      {profile.trend === 'up'
                        ? 'Improving'
                        : profile.trend === 'down'
                        ? 'Declining'
                        : 'Stable'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {profile.trendValue > 0 ? '+' : ''}
                      {profile.trendValue}% over 30 days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Top Roles */}
        <Section title="Top Roles">
          <Card>
            <div className="space-y-3">
              {profile.topRoles.map((role, idx) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-semibold">#{idx + 1}</span>
                    <span className="text-white">{role.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-300 text-sm font-medium">
                      {role.count} jobs
                    </span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            (role.count /
                              profile.topRoles[0].count) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Section title="✅ Strengths">
          <Card>
            <ul className="space-y-2">
              {profile.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Section title="⚠️ Weaknesses">
          <Card>
            <ul className="space-y-2">
              {profile.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span className="text-gray-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>

      {/* Strategic Recommendations */}
      <Section title="💡 Strategic Recommendations">
        <div className="space-y-3">
          {profile.recommendations.map((rec, idx) => (
            <Card key={idx}>
              <div className="flex gap-3">
                <span className="text-yellow-400 text-xl">💡</span>
                <p className="text-gray-300">{rec}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Comparison Link */}
      <Section title="Compare with Other Boards">
        <Card>
          <p className="text-gray-400 mb-4">
            Want to see how {profile.name} stacks up against other job boards?
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
