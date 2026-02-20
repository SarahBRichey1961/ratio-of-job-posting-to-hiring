/**
 * Job Board Scoring System
 * Converts raw metrics into Job Board Scores and grades
 */

export interface rawMetrics {
  totalPostings: number
  avgLifespanDays: number
  responseRate?: number
  acceptanceRate?: number
}

export interface ScoredBoard {
  name: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  totalPostings: number
  avgLifespanDays: number
  scoreBreakdown: {
    listingVolume: number
    postingQuality: number
    responseRate: number
    acceptanceRate: number
  }
}

/**
 * Calculate Job Board Score (0-100)
 * Based on:
 * - Listing Volume: More postings = higher score (35%)
 * - Posting Quality/Lifespan: Longer lifespan = better quality (25%)
 * - Response Rate: Higher response = better match (20%)
 * - Acceptance Rate: Higher acceptance = better quality (20%)
 */
export function calculateBoardScore(metrics: RawMetrics): ScoredBoard {
  const {
    totalPostings,
    avgLifespanDays,
    responseRate = 0.5,
    acceptanceRate = 0.3,
  } = metrics

  // Normalize metrics to 0-100 scale
  // Listing Volume: 0-150,000 postings max
  const listingVolumeScore = Math.min((totalPostings / 150000) * 100, 100)

  // Posting Quality: 0-60 days avg lifespan
  const postingQualityScore = Math.min((avgLifespanDays / 60) * 100, 100)

  // Response Rate: 0-100% scale
  const responseRateScore = (responseRate || 0.5) * 100

  // Acceptance Rate: 0-100% scale
  const acceptanceRateScore = (acceptanceRate || 0.3) * 100

  // Calculate weighted score
  const totalScore =
    listingVolumeScore * 0.35 +
    postingQualityScore * 0.25 +
    responseRateScore * 0.2 +
    acceptanceRateScore * 0.2

  const finalScore = Math.round(totalScore)

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (finalScore >= 85) grade = 'A'
  else if (finalScore >= 70) grade = 'B'
  else if (finalScore >= 60) grade = 'C'
  else if (finalScore >= 50) grade = 'D'
  else grade = 'F'

  return {
    name: metrics.name || 'Unknown',
    score: finalScore,
    grade,
    totalPostings,
    avgLifespanDays,
    scoreBreakdown: {
      listingVolume: Math.round(listingVolumeScore),
      postingQuality: Math.round(postingQualityScore),
      responseRate: Math.round(responseRateScore),
      acceptanceRate: Math.round(acceptanceRateScore),
    },
  }
}

/**
 * Score all job boards and return ranked list
 */
export function rankJobBoards(
  metricsData: (RawMetrics & { name: string })[]
): ScoredBoard[] {
  return metricsData
    .map((metrics) => calculateBoardScore(metrics))
    .sort((a, b) => b.score - a.score)
    .map((board, index) => ({
      ...board,
      rank: index + 1,
    }))
}

/**
 * Get category for a job board
 */
export function getBoardCategory(
  boardName: string
): 'General' | 'Tech-Focused' | 'Remote' | 'Niche' | 'Company Career Site' {
  const remoteBoards = [
    'Remote Tech Jobs',
    'We Work Remotely',
    'FlexJobs',
    'WorkInStartups',
  ]
  const techBoards = [
    'Stack Overflow',
    'GitHub Jobs',
    'JSJobs',
    'Dice',
    'InfosecJobs',
  ]
  const nicheBoards = [
    'Data Jobs',
    'iCrunchData',
    'EnvironmentalCareer.com',
    'Mediabistro',
    'AustinTech',
    'Hacker News',
    'Reddit /r/sysadminjobs',
  ]
  const companyBoards = ['Microsoft', 'CiscoJobs', 'Twitch']

  if (remoteBoards.includes(boardName)) return 'Remote'
  if (techBoards.includes(boardName)) return 'Tech-Focused'
  if (nicheBoards.includes(boardName)) return 'Niche'
  if (companyBoards.includes(boardName)) return 'Company Career Site'
  return 'General'
}

interface RawMetrics {
  name?: string
  totalPostings: number
  avgLifespanDays: number
  responseRate?: number
  acceptanceRate?: number
}
