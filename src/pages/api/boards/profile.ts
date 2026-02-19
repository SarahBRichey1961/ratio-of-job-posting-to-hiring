import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardProfile | { error: string }>
) {
  const { boardName } = req.query

  if (!boardName) {
    return res.status(400).json({ error: 'boardName query parameter required' })
  }

  try {
    // Mock comprehensive board profile data
    // In production, would aggregate from multiple tables
    const boardProfiles: Record<string, BoardProfile> = {
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
      linkedin: {
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

    const normalizedName = (boardName as string)
      .toLowerCase()
      .replace(/\s+/g, '-')

    const profile =
      boardProfiles[normalizedName] ||
      boardProfiles[Object.keys(boardProfiles)[0]]

    res.status(200).json(profile)
  } catch (error) {
    console.error('Board profile API error:', error)
    res.status(500).json({ error: 'Failed to fetch board profile' })
  }
}
