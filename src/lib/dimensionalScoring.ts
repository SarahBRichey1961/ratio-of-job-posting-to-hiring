import { supabase } from '@/lib/supabase'
import { Logger } from './logging/logger'

const logger = new Logger('logs')

// Industry/Category mappings
const TECH_BOARDS = [
  'stack-overflow',
  'github-jobs',
  'hackernews',
  'dribbble',
  'cssdb',
  'producthunt',
]
const GENERAL_BOARDS = ['linkedin', 'indeed', 'glassdoor', 'hired', 'angelist']
const REMOTE_ONLY = [
'we-work-remotely',
  'remote-ok',
  'flexjobs',
  'time-doctor',
]
const NICHE_BOARDS = [
  'idealist',
  'craigslist',
  'reddit-jobs',
  'designer-hangout',
  'betalist',
]

export interface RoleScore {
  roleFamily: string
  boards: number // count of boards with this role
  avgScore: number
  medianScore: number
  minScore: number
  maxScore: number
  jobCount: number
  bestBoard: { id: number; name: string; score: number }
  worstBoard: { id: number; name: string; score: number }
  trend: number // change from previous period
}

export interface IndustryScore {
  industry: string
  description: string
  boardCount: number
  avgScore: number
  boards: Array<{ id: number; name: string; score: number }>
  jobCount: number
  topRole: string
  jobsByRole: Record<string, number>
}

export interface RolePerBoardScore {
  boardId: number
  boardName: string
  roleFamily: string
  jobCount: number
  avgLifespan: number
  avgRepostRate: number
  score: number
  grade: string
}

export interface RoleRecommendation {
  role: string
  topBoards: Array<{
    rank: number
    boardId: number
    boardName: string
    score: number
    jobCount: number
  }>
  avgScore: number
  recommendation: string
}

/**
 * Categorize board by industry
 */
function getBoardIndustry(boardId: number, boardName: string): string {
  const name = boardName.toLowerCase()

  if (TECH_BOARDS.some((b) => name.includes(b))) return 'Tech'
  if (REMOTE_ONLY.some((b) => name.includes(b))) return 'Remote'
  if (GENERAL_BOARDS.some((b) => name.includes(b))) return 'General'
  if (NICHE_BOARDS.some((b) => name.includes(b))) return 'Niche'

  // Default categorization based on name
  if (name.includes('tech') || name.includes('dev') || name.includes('engineer'))
    return 'Tech'
  if (name.includes('remote') || name.includes('distributed')) return 'Remote'
  if (name.includes('niche') || name.includes('specialist')) return 'Niche'

  return 'General'
}

/**
 * Get all scores by role family
 */
export async function getRoleScores(): Promise<RoleScore[]> {
  try {
    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('normalized_title, job_board_id')
      .not('normalized_title', 'is', null)

    if (error) throw error

    // Get all board scores
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    // Get latest scores for all boards
    const { data: scores } = await supabase
      .from('efficiency_scores')
      .select('job_board_id, overall_score')

    const scoreMap = new Map<number, number>()
    ;(scores || []).forEach((s) => {
      scoreMap.set(s.job_board_id, s.overall_score || 0)
    })

    // Group by role
    const grouped: Record<string, any> = {}

    ;(postings || []).forEach((posting) => {
      const role = posting.normalized_title
      const boardScore = scoreMap.get(posting.job_board_id) || 0

      if (!grouped[role]) {
        grouped[role] = {
          scores: [],
          boards: new Map(),
          jobCount: 0,
        }
      }

      grouped[role].scores.push(boardScore)
      grouped[role].jobCount++

      if (!grouped[role].boards.has(posting.job_board_id)) {
        grouped[role].boards.set(posting.job_board_id, {
          id: posting.job_board_id,
          name: boardMap.get(posting.job_board_id) || 'Unknown',
          score: boardScore,
        })
      }
    })

    // Calculate metrics
    const results: RoleScore[] = Object.entries(grouped).map(([role, data]) => {
      const scores = data.scores.sort((a: number, b: number) => a - b)
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      const median = scores[Math.floor(scores.length / 2)]

      const boardArray = Array.from(data.boards.values())
      const best = boardArray.sort((a, b) => b.score - a.score)[0]
      const worst = boardArray.sort((a, b) => a.score - b.score)[0]

      return {
        roleFamily: role,
        boards: data.boards.size,
        avgScore: Math.round(avg),
        medianScore: Math.round(median),
        minScore: scores[0],
        maxScore: scores[scores.length - 1],
        jobCount: data.jobCount,
        bestBoard: best,
        worstBoard: worst,
        trend: 0, // Would calculate from history
      }
    })

    return results.sort((a, b) => b.avgScore - a.avgScore)
  } catch (error) {
    logger.error('Failed to get role scores', error as Error)
    return []
  }
}

/**
 * Get scores by industry
 */
export async function getIndustryScores(): Promise<IndustryScore[]> {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('job_boards')
      .select('id, name')

    if (boardsError) throw boardsError

    // Get scores for all boards
    const { data: scores } = await supabase
      .from('efficiency_scores')
      .select('job_board_id, overall_score')

    const scoreMap = new Map<number, number>()
    ;(scores || []).forEach((s) => {
      scoreMap.set(s.job_board_id, s.overall_score || 0)
    })

    // Get job postings by board
    const { data: postings } = await supabase
      .from('job_postings')
      .select('job_board_id, normalized_title')

    const postingsByBoard = new Map<number, string[]>()
    ;(postings || []).forEach((p) => {
      if (!postingsByBoard.has(p.job_board_id)) {
        postingsByBoard.set(p.job_board_id, [])
      }
      postingsByBoard.get(p.job_board_id)!.push(p.normalized_title)
    })

    // Group by industry
    const industries: Record<string, any> = {
      Tech: { boards: [], scores: [], jobCount: 0, roles: {} },
      Remote: { boards: [], scores: [], jobCount: 0, roles: {} },
      General: { boards: [], scores: [], jobCount: 0, roles: {} },
      Niche: { boards: [], scores: [], jobCount: 0, roles: {} },
    }

    ;(boards || []).forEach((board) => {
      const industry = getBoardIndustry(board.id, board.name)
      const score = scoreMap.get(board.id) || 0
      const jobsForBoard = postingsByBoard.get(board.id) || []

      industries[industry].boards.push({ id: board.id, name: board.name, score })
      industries[industry].scores.push(score)
      industries[industry].jobCount += jobsForBoard.length

      // Count roles
      jobsForBoard.forEach((role) => {
        industries[industry].roles[role] = (industries[industry].roles[role] || 0) + 1
      })
    })

    // Calculate metrics
    const results: IndustryScore[] = Object.entries(industries)
      .filter(([, data]) => data.boards.length > 0)
      .map(([industry, data]) => {
        const avg =
          data.scores.length > 0 ? data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length : 0
        const topRole = Object.entries(data.roles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

        return {
          industry,
          description: getIndustryDescription(industry),
          boardCount: data.boards.length,
          avgScore: Math.round(avg),
          boards: data.boards.sort((a: any, b: any) => b.score - a.score),
          jobCount: data.jobCount,
          topRole,
          jobsByRole: data.roles,
        }
      })

    return results.sort((a, b) => b.avgScore - a.avgScore)
  } catch (error) {
    logger.error('Failed to get industry scores', error as Error)
    return []
  }
}

/**
 * Get description for industry
 */
function getIndustryDescription(industry: string): string {
  const descriptions: Record<string, string> = {
    Tech: 'Technology and developer-focused job boards',
    Remote: 'Remote-first and distributed work boards',
    General: 'General purpose job boards',
    Niche: 'Specialized and niche job boards',
  }
  return descriptions[industry] || industry
}

/**
 * Get best boards for a specific role family
 */
export async function getBestBoardsForRole(roleFamily: string): Promise<RolePerBoardScore[]> {
  try {
    const { data: postings, error } = await supabase
      .from('job_postings')
      .select('job_board_id, normalized_title, lifespan_days, repost_count')
      .eq('normalized_title', roleFamily)

    if (error) throw error

    if (!postings || postings.length === 0) {
      return []
    }

    // Get board names and scores
    const { data: boards } = await supabase.from('job_boards').select('id, name')
    const boardMap = new Map(boards?.map((b) => [b.id, b.name]) || [])

    const { data: scores } = await supabase
      .from('efficiency_scores')
      .select('job_board_id, overall_score')

    const scoreMap = new Map(scores?.map((s) => [s.job_board_id, s.overall_score || 50]) || [])

    // Group by board
    const byBoard: Record<number, any> = {}
    postings.forEach((p) => {
      if (!byBoard[p.job_board_id]) {
        byBoard[p.job_board_id] = {
          lifespans: [],
          reposts: [],
          count: 0,
        }
      }
      byBoard[p.job_board_id].lifespans.push(p.lifespan_days || 0)
      byBoard[p.job_board_id].reposts.push(p.repost_count || 0)
      byBoard[p.job_board_id].count++
    })

    // Calculate metrics
    const results: RolePerBoardScore[] = Object.entries(byBoard).map(([boardId, data]) => {
      const avgLifespan =
        data.lifespans.reduce((a: number, b: number) => a + b, 0) / data.lifespans.length
      const avgReposts = data.reposts.reduce((a: number, b: number) => a + b, 0) / data.reposts.length
      const score = scoreMap.get(Number(boardId)) || 50
      const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D'

      return {
        boardId: Number(boardId),
        boardName: boardMap.get(Number(boardId)) || 'Unknown',
        roleFamily,
        jobCount: data.count,
        avgLifespan: Math.round(avgLifespan),
        avgRepostRate: Math.round(avgReposts * 100) / 100,
        score,
        grade,
      }
    })

    return results.sort((a, b) => b.score - a.score)
  } catch (error) {
    logger.error('Failed to get boards for role', error as Error, { roleFamily })
    return []
  }
}

/**
 * Get hiring velocity by role family
 */
export async function getRoleHiringVelocity(): Promise<
  Array<{
    roleFamily: string
    jobCount: number
    newJobsPerDay: number
    repostRate: number
    averageLifespan: number
    demandLevel: 'High' | 'Medium' | 'Low'
  }>
> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const { data: allPostings } = await supabase
      .from('job_postings')
      .select('normalized_title, first_seen, repost_count, lifespan_days')
      .not('normalized_title', 'is', null)

    const { data: recentPostings } = await supabase
      .from('job_postings')
      .select('normalized_title')
      .gte('first_seen', thirtyDaysAgo)
      .not('normalized_title', 'is', null)

    if (!allPostings) {
      return []
    }

    // Group by role
    const grouped: Record<string, any> = {}

    allPostings.forEach((p) => {
      const role = p.normalized_title
      if (!grouped[role]) {
        grouped[role] = {
          totalJobs: 0,
          totalReposts: 0,
          totalLifespan: 0,
          lifespanCount: 0,
        }
      }
      grouped[role].totalJobs++
      grouped[role].totalReposts += p.repost_count || 0
      if (p.lifespan_days) {
        grouped[role].totalLifespan += p.lifespan_days
        grouped[role].lifespanCount++
      }
    })

    const recentCount: Record<string, number> = {}
    recentPostings?.forEach((p) => {
      recentCount[p.normalized_title] = (recentCount[p.normalized_title] || 0) + 1
    })

    // Calculate metrics
    const results = Object.entries(grouped).map(([role, data]) => {
      const repostRate = (data.totalReposts / data.totalJobs) * 100
      const avgLifespan = data.lifespanCount > 0 ? data.totalLifespan / data.lifespanCount : 0
      const newJobsPerDay = (recentCount[role] || 0) / 30
      const demandLevel: 'High' | 'Medium' | 'Low' =
        data.totalJobs > 200 ? 'High' : data.totalJobs > 50 ? 'Medium' : 'Low'

      return {
        roleFamily: role,
        jobCount: data.totalJobs,
        newJobsPerDay: Math.round(newJobsPerDay * 100) / 100,
        repostRate: Math.round(repostRate * 10) / 10,
        averageLifespan: Math.round(avgLifespan),
        demandLevel,
      }
    })

    return results.sort((a, b) => b.jobCount - a.jobCount)
  } catch (error) {
    logger.error('Failed to get hiring velocity', error as Error)
    return []
  }
}

/**
 * Get role recommendations
 */
export async function getRoleRecommendations(): Promise<RoleRecommendation[]> {
  try {
    const roleScores = await getRoleScores()

    const recommendations: RoleRecommendation[] = roleScores.slice(0, 20).map((role) => {
      let recommendation = ''

      if (role.avgScore >= 80) {
        recommendation = `${role.roleFamily} has high demand and good quality on hiring boards. All top boards are reliable for this role.`
      } else if (role.avgScore >= 60) {
        recommendation = `${role.roleFamily} is moderately well served. Focus on the top 3 boards for best hiring outcomes.`
      } else {
        recommendation = `${role.roleFamily} shows lower efficiency. Consider diversifying across boards and investigating data quality.`
      }

      // Get top 3 boards for this role
      const topBoards = role.jobCount > 0
        ? [
            { rank: 1, ...role.bestBoard, jobCount: role.jobCount / role.boards },
          ]
        : []

      return {
        role: role.roleFamily,
        topBoards,
        avgScore: role.avgScore,
        recommendation,
      }
    })

    return recommendations
  } catch (error) {
    logger.error('Failed to get role recommendations', error as Error)
    return []
  }
}
