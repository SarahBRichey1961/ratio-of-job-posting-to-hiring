import { supabase } from '@/lib/supabase'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')

export interface IndustryMetric {
  id: number
  industry: string
  total_boards: number
  avg_score: number
  median_lifespan: number
  avg_repost_rate: number
  total_job_postings: number
  top_board: string
  top_role: string
  trend: 'up' | 'down' | 'stable'
  updated_at: string
  created_at: string
}

/**
 * Get all industry metrics
 */
export async function getAllIndustryMetrics(): Promise<IndustryMetric[]> {
  try {
    const { data, error } = await supabase
      .from('industry_metrics')
      .select('*')
      .order('avg_score', { ascending: false })

    if (error) {
      logger.error('Failed to fetch industry metrics', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error loading industry metrics', error as Error)
    return []
  }
}

/**
 * Get metrics for a specific industry
 */
export async function getIndustryMetric(industry: string): Promise<IndustryMetric | null> {
  try {
    const { data, error } = await supabase
      .from('industry_metrics')
      .select('*')
      .eq('industry', industry)
      .single()

    if (error) {
      logger.error(`Failed to fetch metrics for ${industry}`, error)
      return null
    }

    return data
  } catch (error) {
    logger.error(`Error loading metrics for ${industry}`, error as Error)
    return null
  }
}

/**
 * Get industry metrics ordered by score for top/bottom performers
 */
export async function getIndustryRankings(): Promise<IndustryMetric[]> {
  try {
    const { data, error } = await supabase
      .from('industry_metrics')
      .select('*')
      .order('avg_score', { ascending: false })

    if (error) {
      logger.error('Failed to fetch industry rankings', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error loading industry rankings', error as Error)
    return []
  }
}

/**
 * Calculate market-wide averages from industry metrics
 */
export async function getMarketTrends() {
  try {
    const metrics = await getAllIndustryMetrics()

    if (metrics.length === 0) {
      return {
        avgScore: 0,
        medianLifespan: 0,
        topIndustry: 'N/A',
        totalBoards: 0,
      }
    }

    const avgScore = Math.round(
      metrics.reduce((sum, m) => sum + m.avg_score, 0) / metrics.length
    )

    const medianLifespan = Math.round(
      metrics.reduce((sum, m) => sum + m.median_lifespan, 0) / metrics.length
    )

    const topIndustry = metrics[0]?.industry || 'N/A'
    const totalBoards = metrics.reduce((sum, m) => sum + m.total_boards, 0)

    return {
      avgScore,
      medianLifespan,
      topIndustry,
      totalBoards,
    }
  } catch (error) {
    logger.error('Error calculating market trends', error as Error)
    return {
      avgScore: 0,
      medianLifespan: 0,
      topIndustry: 'N/A',
      totalBoards: 0,
    }
  }
}

/**
 * Get industries by trend
 */
export async function getIndustriesByTrend(trend: 'up' | 'down' | 'stable'): Promise<IndustryMetric[]> {
  try {
    const { data, error } = await supabase
      .from('industry_metrics')
      .select('*')
      .eq('trend', trend)
      .order('avg_score', { ascending: false })

    if (error) {
      logger.error(`Failed to fetch ${trend} trending industries`, error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error(`Error loading ${trend} trending industries`, error as Error)
    return []
  }
}
