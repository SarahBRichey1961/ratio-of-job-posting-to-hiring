import type { NextApiRequest, NextApiResponse } from 'next'

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

interface InsightsResponse {
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
  timestamp: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<InsightsResponse>
) {
  try {
    // Mock data - in production, would query Supabase
    const allBoards: BoardInsight[] = [
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
      {
        name: 'GitHub Jobs',
        score: 84,
        grade: 'A',
        trend: 'up',
        trendValue: 2.8,
        lifespan: 13,
        repostRate: 4,
        totalPostings: 1834,
        dataQuality: 96,
      },
      {
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
      {
        name: 'We Work Remotely',
        score: 74,
        grade: 'B+',
        trend: 'up',
        trendValue: 1.2,
        lifespan: 16,
        repostRate: 8,
        totalPostings: 1234,
        dataQuality: 92,
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
      {
        name: 'Glassdoor',
        score: 68,
        grade: 'B',
        trend: 'down',
        trendValue: -1.8,
        lifespan: 21,
        repostRate: 15,
        totalPostings: 2890,
        dataQuality: 85,
      },
      {
        name: 'Monster',
        score: 52,
        grade: 'D',
        trend: 'stable',
        trendValue: -0.3,
        lifespan: 28,
        repostRate: 28,
        totalPostings: 1456,
        dataQuality: 72,
      },
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
    ]

    // Rising boards (trend > 2%)
    const risingBoards = allBoards
      .filter((b) => b.trendValue > 2)
      .sort((a, b) => b.trendValue - a.trendValue)

    // Declining boards (trend < -2%)
    const decliningBoards = allBoards
      .filter((b) => b.trendValue < -2)
      .sort((a, b) => a.trendValue - b.trendValue)

    // Best overall (highest score)
    const bestOverall = allBoards.reduce((max, b) =>
      b.score > max.score ? b : max
    )

    // Best for speed (lowest lifespan)
    const bestForSpeed = allBoards.reduce((min, b) =>
      b.lifespan < min.lifespan ? b : min
    )

    // Best for quality (highest dataQuality)
    const bestForQuality = allBoards.reduce((max, b) =>
      b.dataQuality > max.dataQuality ? b : max
    )

    // Worst performer (lowest score)
    const worstPerformer = allBoards.reduce((min, b) =>
      b.score < min.score ? b : min
    )

    // Role analysis
    const roleAnalysis: RoleInsight[] = [
      {
        roleName: 'Software Engineer',
        totalJobs: 8456,
        topBoards: [
          { boardName: 'LinkedIn', jobCount: 1876 },
          { boardName: 'Stack Overflow', jobCount: 1842 },
          { boardName: 'Indeed', jobCount: 1230 },
          { boardName: 'GitHub Jobs', jobCount: 1456 },
          { boardName: 'We Work Remotely', jobCount: 600 },
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
          { boardName: 'Indeed', jobCount: 400 },
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
          { boardName: 'Indeed', jobCount: 224 },
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
          { boardName: 'HackerNews', jobCount: 168 },
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
          { boardName: 'Monster', jobCount: 160 },
        ],
        avgHiringTime: 22,
        trend: 'down',
      },
    ]

    // Market trends
    const avgScore =
      allBoards.reduce((sum, b) => sum + b.score, 0) / allBoards.length
    const sortedByLifespan = [...allBoards].sort((a, b) => a.lifespan - b.lifespan)
    const medianLifespan =
      sortedByLifespan[Math.floor(sortedByLifespan.length / 2)].lifespan
    const topRole = roleAnalysis.reduce((max, r) =>
      r.totalJobs > max.totalJobs ? r : max
    ).roleName
    const topBoard = bestOverall.name

    const response: InsightsResponse = {
      risingBoards: risingBoards.slice(0, 5),
      decliningBoards: decliningBoards.slice(0, 5),
      bestOverall,
      bestForSpeed,
      bestForQuality,
      worstPerformer,
      roleAnalysis,
      marketTrends: {
        avgScore: Math.round(avgScore * 10) / 10,
        medianLifespan,
        topRole,
        topBoard,
      },
      timestamp: new Date().toISOString(),
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching insights:', error)
    res.status(500).json({
      risingBoards: [],
      decliningBoards: [],
      bestOverall: { name: '', score: 0, grade: '', trend: 'stable', trendValue: 0, lifespan: 0, repostRate: 0, totalPostings: 0, dataQuality: 0 },
      bestForSpeed: { name: '', score: 0, grade: '', trend: 'stable', trendValue: 0, lifespan: 0, repostRate: 0, totalPostings: 0, dataQuality: 0 },
      bestForQuality: { name: '', score: 0, grade: '', trend: 'stable', trendValue: 0, lifespan: 0, repostRate: 0, totalPostings: 0, dataQuality: 0 },
      worstPerformer: { name: '', score: 0, grade: '', trend: 'stable', trendValue: 0, lifespan: 0, repostRate: 0, totalPostings: 0, dataQuality: 0 },
      roleAnalysis: [],
      marketTrends: { avgScore: 0, medianLifespan: 0, topRole: '', topBoard: '' },
      timestamp: new Date().toISOString(),
    } as any)
  }
}
