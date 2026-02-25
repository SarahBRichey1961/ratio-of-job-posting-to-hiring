import { getSupabase } from '@/lib/supabase'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')
const supabase = getSupabase()

interface IndustryMetric {
  industry: string
  totalBoards: number
  avgScore: number
  medianLifespan: number
  avgRepostRate: number
  totalJobPostings: number
  topBoard: string
  topRole: string
  boardCount: number
  trend: 'up' | 'down' | 'stable'
}

async function updateIndustryMetrics() {
  try {
    console.log('🔄 Updating industry insight metrics...\n')

    // Fetch all boards with their metrics
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select(`
        id,
        name,
        industry,
        score,
        lifespan,
        repost_rate,
        total_postings,
        job_roles (
          name
        )
      `)

    if (boardError) {
      logger.error('Failed to fetch boards', boardError)
      console.error('❌ Error fetching boards:', boardError)
      return
    }

    if (!boards || boards.length === 0) {
      console.log('⚠️  No boards found in database')
      return
    }

    // Group boards by industry
    const industryData: { [key: string]: any[] } = {}
    boards.forEach((board: any) => {
      if (!industryData[board.industry]) {
        industryData[board.industry] = []
      }
      industryData[board.industry].push(board)
    })

    // Calculate metrics for each industry
    const metricsToUpsert: IndustryMetric[] = []

    for (const [industry, boardsList] of Object.entries(industryData)) {
      const scores = boardsList.map((b: any) => b.score || 0)
      const lifespans = boardsList.map((b: any) => b.lifespan || 0)
      const repostRates = boardsList.map((b: any) => b.repost_rate || 0)
      const totalPostings = boardsList.reduce((sum: number, b: any) => sum + (b.total_postings || 0), 0)

      // Calculate average score
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      // Calculate median lifespan
      const sortedLifespans = lifespans.sort((a, b) => a - b)
      const medianLifespan = sortedLifespans.length > 0 
        ? sortedLifespans[Math.floor(sortedLifespans.length / 2)]
        : 0

      // Calculate average repost rate
      const avgRepostRate = repostRates.length > 0 
        ? Math.round(repostRates.reduce((a, b) => a + b, 0) / repostRates.length)
        : 0

      // Get top board by score
      const topBoard = boardsList.length > 0 
        ? boardsList.reduce((top: any, b: any) => (b.score > (top.score || 0) ? b : top)).name
        : 'N/A'

      // Get top role
      const rolesCombined = boardsList
        .flatMap((b: any) => b.job_roles || [])
        .map((r: any) => r.name)
      
      const roleCounts: { [key: string]: number } = {}
      rolesCombined.forEach((role: string) => {
        roleCounts[role] = (roleCounts[role] || 0) + 1
      })

      const topRole = Object.entries(roleCounts).length > 0
        ? Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A'

      // Determine trend (comparing with average score of 75)
      const trend: 'up' | 'down' | 'stable' = avgScore >= 75 ? 'up' : avgScore < 50 ? 'down' : 'stable'

      metricsToUpsert.push({
        industry,
        totalBoards: boardsList.length,
        avgScore,
        medianLifespan,
        avgRepostRate,
        totalJobPostings: totalPostings,
        topBoard,
        topRole,
        boardCount: boardsList.length,
        trend,
      })

      console.log(`📊 ${industry}`)
      console.log(`   Boards: ${boardsList.length} | Avg Score: ${avgScore} | Median Lifespan: ${medianLifespan}d`)
      console.log(`   Repost Rate: ${avgRepostRate}% | Jobs: ${totalPostings} | Trend: ${trend} ↑↓→`)
      console.log(`   Top Board: ${topBoard} | Top Role: ${topRole}\n`)
    }

    // Create or update industry_metrics table
    console.log('💾 Upserting metrics to database...\n')
    
    for (const metric of metricsToUpsert) {
      const { error } = await supabase
        .from('industry_metrics')
        .upsert(
          {
            industry: metric.industry,
            total_boards: metric.totalBoards,
            avg_score: metric.avgScore,
            median_lifespan: metric.medianLifespan,
            avg_repost_rate: metric.avgRepostRate,
            total_job_postings: metric.totalJobPostings,
            top_board: metric.topBoard,
            top_role: metric.topRole,
            trend: metric.trend,
            updated_at: new Date(),
          },
          { onConflict: 'industry' }
        )

      if (error) {
        logger.error(`Failed to upsert metrics for ${metric.industry}`, error)
        console.error(`❌ Error upserting ${metric.industry}:`, error)
      } else {
        console.log(`✅ Updated ${metric.industry}`)
      }
    }

    console.log('\n✨ Industry metrics updated successfully!')

  } catch (error) {
    logger.error('Failed to update industry metrics', error as Error)
    console.error('❌ Error updating metrics:', error)
  }
}

// Run the update
updateIndustryMetrics()
