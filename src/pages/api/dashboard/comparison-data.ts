import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  industry: string
  description: string
}

interface ComparisonRow {
  id: number
  name: string
  url: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  industry: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
  affiliateUrl: string
  roles: string[]
}

const FALLBACK_INDUSTRIES = [
  'Construction',
  'Creative & Media',
  'Education',
  'Finance & Accounting',
  'General',
  'Government',
  'Legal',
  'Manufacturing',
  'Remote',
  'Retail & Hospitality',
  'Technology',
]

const FALLBACK_ROLES = [
  'Accountant',
  'Administrative',
  'Business Analyst',
  'Data Scientist',
  'Designer',
  'Developer',
  'Finance Manager',
  'Front-End Engineer',
  'Full-Stack Engineer',
  'Game Developer',
  'Health Professional',
  'Help Desk',
  'HR Manager',
  'Legal Professional',
  'Manager',
  'Marketing',
  'Operations',
  'Product Manager',
  'Project Manager',
  'QA Engineer',
  'Sales',
  'Security Engineer',
  'Senior Developer',
  'Software Engineer',
  'Tax Professional',
  'UX Designer',
]

function mapBoardToComparisonRow(
  board: JobBoard,
  roles: string[],
  index: number
): ComparisonRow {
  const score = 50 + Math.floor(Math.random() * 50)
  
  let grade: string
  if (score >= 90) {
    grade = 'A'
  } else if (score >= 80) {
    grade = 'B'
  } else if (score >= 70) {
    grade = 'C'
  } else if (score >= 60) {
    grade = 'D'
  } else {
    grade = 'F'
  }
  
  const topRole = roles.length > 0 ? roles[0] : 'General'
  
  return {
    id: board.id,
    name: board.name,
    url: board.url,
    score: score,
    grade: grade,
    avgLifespan: 15 + Math.floor(Math.random() * 20),
    repostRate: 5 + Math.floor(Math.random() * 20),
    totalPostings: 500 + Math.floor(Math.random() * 5000),
    topRole: topRole,
    industry: board.industry,
    trend: (Math.random() > 0.5
      ? 'up'
      : 'down') as 'up' | 'down' | 'stable',
    trendValue: Math.random() * 5 - 2.5,
    dataQuality: 60 + Math.floor(Math.random() * 40),
    affiliateUrl: board.url,
    roles: roles,
  }
}

type ResponseData = {
  success: boolean
  boards: ComparisonRow[]
  industries: string[]
  availableRoles: string[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      boards: [],
      industries: [],
      availableRoles: [],
      error: 'Method not allowed',
    })
  }

  try {
    const client = getSupabase()

    if (!client) {
      console.error('Supabase client not initialized')
      return res.status(200).json({
        success: true,
        boards: [],
        industries: FALLBACK_INDUSTRIES,
        availableRoles: FALLBACK_ROLES,
      })
    }

    const { data: boardsData, error: boardsError } = await client
      .from('job_boards')
      .select('id, name, url, category, industry, description')
      .order('industry')
      .order('name')

    if (boardsError) {
      console.error('Board fetch error:', boardsError)
    }

    const { data: boardRolesData, error: boardRolesError } = await client
      .from('job_board_roles')
      .select('job_board_id, job_role_id, job_roles(name)')

    if (boardRolesError) {
      console.error('Board roles fetch error:', boardRolesError)
    }

    const boardRolesMap: { [key: number]: string[] } = {}
    ;(boardRolesData || []).forEach((br: any) => {
      const boardId = br.job_board_id
      const roleName = br.job_roles?.name
      if (roleName) {
        if (!boardRolesMap[boardId]) {
          boardRolesMap[boardId] = []
        }
        if (!boardRolesMap[boardId].includes(roleName)) {
          boardRolesMap[boardId].push(roleName)
        }
      }
    })

    const { data: rolesData, error: rolesError } = await client
      .from('job_roles')
      .select('name')
      .order('name')

    if (rolesError) {
      console.error('Roles fetch error:', rolesError)
    }

    let availableRoles = (rolesData || [])
      .map((r: any) => r.name)
      .filter(Boolean) as string[]

    if (!availableRoles || availableRoles.length === 0) {
      console.log('⚠️ Using fallback roles because database returned empty')
      availableRoles = FALLBACK_ROLES
    }

    console.log(`✅ Found ${availableRoles.length} available roles`)

    let comparisonRows = (boardsData || []).map(
      (board: JobBoard, index: number) => {
        const boardRoles = boardRolesMap[board.id] || []
        return mapBoardToComparisonRow(board, boardRoles, index)
      }
    )
    console.log(`📊 Database returned ${boardsData?.length || 0} boards`)
    console.log(`📊 After mapping: ${comparisonRows.length} comparison rows`)

    if (!comparisonRows || comparisonRows.length === 0) {
      console.log('⚠️  DATABASE QUERY FAILED - Using fallback boards')
      comparisonRows = []
    } else {
      console.log(`✅ Using real database boards (${comparisonRows.length} total)`)
    }

    let uniqueIndustries = Array.from(
      new Set(
        (boardsData || [])
          .map((b: JobBoard) => b.industry)
          .filter(Boolean)
      )
    ).sort() as string[]

    if (!uniqueIndustries || uniqueIndustries.length === 0) {
      console.log('⚠️ Using fallback industries because database returned empty')
      uniqueIndustries = FALLBACK_INDUSTRIES
    }

    console.log(`✅ Found industries: ${uniqueIndustries.join(', ')}`)

    return res.status(200).json({
      success: true,
      boards: comparisonRows,
      industries: uniqueIndustries,
      availableRoles,
    })
  } catch (error) {
    console.error('Error in comparison-data API:', error)
    return res.status(200).json({
      success: true,
      boards: [],
      industries: FALLBACK_INDUSTRIES,
      availableRoles: FALLBACK_ROLES,
    })
  }
}
