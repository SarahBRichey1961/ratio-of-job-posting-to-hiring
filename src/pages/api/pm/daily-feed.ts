/**
 * PM Daily Feed API Endpoint
 * Returns comprehensive board activity metrics for a given date
 * 
 * GET /api/pm/daily-feed?date=YYYY-MM-DD
 * GET /api/pm/daily-feed  (defaults to yesterday)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '../../../lib/supabase'

interface BoardMetrics {
  board_id: number
  board_name: string
  volume: {
    new_postings: number
    posting_velocity: number
    total_active_postings: number
  }
  seniority_mix: {
    entry_level: { pct: number; count: number }
    mid_level: { pct: number; count: number }
    senior_level: { pct: number; count: number }
  }
  geography: {
    remote: { pct: number; count: number }
    onsite: { pct: number; count: number }
    hybrid: { pct: number; count: number }
  }
  company_concentration: {
    unique_companies: number
    top_company_concentration: number
    top_companies: Array<{ rank: number; name: string; postings: number; pct: number }>
  }
  roles_by_seniority: Array<{
    role: string
    entry: number
    mid: number
    senior: number
    total: number
  }>
}

interface SummaryMetrics {
  total_postings: number
  avg_velocity: number
  highest_velocity_board: string
  lowest_velocity_board: string
  avg_remote_pct: number
  avg_senior_pct: number
  top_board_by_volume: string
  boards_processed: number
}

interface DailyFeedResponse {
  date: string
  summary: SummaryMetrics
  boards: BoardMetrics[]
  timestamp: string
}

function getYesterdayDate(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

async function getDailyFeed(
  date: string
): Promise<{ data?: DailyFeedResponse; error?: string }> {
  const client = getSupabase()
  
  if (!client) {
    return { error: 'Database connection failed' }
  }

  try {
    // Fetch daily_board_activity for the date
    const { data: activities, error: activitiesError } = await client
      .from('daily_board_activity')
      .select('*')
      .eq('date', date)
      .order('board_id', { ascending: true })

    if (activitiesError) {
      return { error: `Failed to fetch activities: ${activitiesError.message}` }
    }

    if (!activities || activities.length === 0) {
      return { error: `No data available for date ${date}` }
    }

    // Fetch company mix data
    const { data: companyMix, error: companyError } = await client
      .from('daily_board_company_mix')
      .select('*')
      .eq('date', date)
      .order('board_id', { ascending: true })
      .order('rank_position', { ascending: true })

    if (companyError) {
      console.warn('Warning: Could not fetch company mix:', companyError)
    }

    // Fetch role/seniority data
    const { data: roleSeniority, error: roleError } = await client
      .from('daily_role_seniority')
      .select('*')
      .eq('date', date)
      .order('board_id', { ascending: true })

    if (roleError) {
      console.warn('Warning: Could not fetch role seniority:', roleError)
    }

    // Build board metrics
    const boards: BoardMetrics[] = activities.map(activity => {
      // Calculate counts based on percentages
      const entryCount = Math.round(
        activity.new_postings * (activity.entry_level_pct / 100)
      )
      const midCount = Math.round(
        activity.new_postings * (activity.mid_level_pct / 100)
      )
      const seniorCount = activity.new_postings - entryCount - midCount

      const remoteCount = Math.round(
        activity.new_postings * (activity.remote_pct / 100)
      )
      const onsiteCount = Math.round(
        activity.new_postings * (activity.onsite_pct / 100)
      )
      const hybridCount = activity.new_postings - remoteCount - onsiteCount

      // Get company data for this board
      const boardCompanies = companyMix
        ?.filter(c => c.board_id === activity.board_id)
        .slice(0, 10) || []

      // Get role data for this board
      const boardRoles = roleSeniority
        ?.filter(r => r.board_id === activity.board_id)
        .reduce(
          (acc, r) => {
            const existing = acc.find(role => role.role === r.role_type)
            if (existing) {
              existing[
                r.seniority_level.toLowerCase() as
                  | 'entry'
                  | 'mid'
                  | 'senior'
              ] += r.postings_count
              existing.total += r.postings_count
            } else {
              acc.push({
                role: r.role_type,
                entry: r.seniority_level === 'Entry' ? r.postings_count : 0,
                mid: r.seniority_level === 'Mid' ? r.postings_count : 0,
                senior: r.seniority_level === 'Senior' ? r.postings_count : 0,
                total: r.postings_count,
              })
            }
            return acc
          },
          [] as Array<{
            role: string
            entry: number
            mid: number
            senior: number
            total: number
          }>
        ) || []

      return {
        board_id: activity.board_id,
        board_name: activity.board_name,
        volume: {
          new_postings: activity.new_postings,
          posting_velocity: activity.posting_velocity,
          total_active_postings: activity.total_active_postings,
        },
        seniority_mix: {
          entry_level: {
            pct: activity.entry_level_pct,
            count: entryCount,
          },
          mid_level: {
            pct: activity.mid_level_pct,
            count: midCount,
          },
          senior_level: {
            pct: activity.senior_level_pct,
            count: seniorCount,
          },
        },
        geography: {
          remote: {
            pct: activity.remote_pct,
            count: remoteCount,
          },
          onsite: {
            pct: activity.onsite_pct,
            count: onsiteCount,
          },
          hybrid: {
            pct: activity.hybrid_pct,
            count: hybridCount,
          },
        },
        company_concentration: {
          unique_companies: activity.unique_companies,
          top_company_concentration: activity.top_company_concentration,
          top_companies: boardCompanies.map(c => ({
            rank: c.rank_position,
            name: c.company_name,
            postings: c.postings_count,
            pct: c.pct_of_board,
          })),
        },
        roles_by_seniority: boardRoles.sort((a, b) => b.total - a.total),
      }
    })

    // Calculate summary metrics
    const totalPostings = activities.reduce(
      (sum, a) => sum + a.new_postings,
      0
    )
    const avgVelocity =
      activities.reduce((sum, a) => sum + a.posting_velocity, 0) /
      activities.length
    const avgRemotePct =
      activities.reduce((sum, a) => sum + a.remote_pct, 0) / activities.length
    const avgSeniorPct =
      activities.reduce((sum, a) => sum + a.senior_level_pct, 0) /
      activities.length

    const highestVelocity = Math.max(...activities.map(a => a.posting_velocity))
    const lowestVelocity = Math.min(...activities.map(a => a.posting_velocity))
    const highest = activities.find(a => a.posting_velocity === highestVelocity)
    const lowest = activities.find(a => a.posting_velocity === lowestVelocity)

    const topBoard = activities.reduce((max, a) =>
      a.new_postings > max.new_postings ? a : max
    )

    const summary: SummaryMetrics = {
      total_postings: totalPostings,
      avg_velocity: parseFloat(avgVelocity.toFixed(2)),
      highest_velocity_board: highest?.board_name || 'N/A',
      lowest_velocity_board: lowest?.board_name || 'N/A',
      avg_remote_pct: parseFloat(avgRemotePct.toFixed(2)),
      avg_senior_pct: parseFloat(avgSeniorPct.toFixed(2)),
      top_board_by_volume: topBoard.board_name,
      boards_processed: boards.length,
    }

    return {
      data: {
        date,
        summary,
        boards,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Error fetching daily feed:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DailyFeedResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get date from query params, default to yesterday
    const date = (req.query.date as string) || getYesterdayDate()

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    // Fetch daily feed
    const result = await getDailyFeed(date)

    if (result.error) {
      return res.status(404).json({ error: result.error })
    }

    // Return with cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    return res.status(200).json(result.data!)
  } catch (error) {
    console.error('API error:', error)
    return res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Internal server error',
      })
  }
}
