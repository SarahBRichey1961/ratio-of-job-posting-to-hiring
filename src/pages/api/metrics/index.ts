/**
 * API endpoint for collecting and storing job board metrics
 * POST /api/metrics/collect - Triggers data collection
 * GET /api/metrics - Retrieves latest metrics
 * GET /api/metrics/history - Retrieves historical metrics
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * GET /api/metrics
 * Retrieves the latest metrics for all job boards
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boardName = searchParams.get('boardName')

    let query = supabase
      .from('job_board_metrics')
      .select('*')
      .order('collected_date', { ascending: false })
      .limit(100)

    if (boardName) {
      query = query.eq('board_name', boardName)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/metrics/collect
 * Triggers data collection from all job boards
 */
export async function POST(request: NextRequest) {
  try {
    const { boardName, metrics } = await request.json()

    if (!boardName || !metrics) {
      return NextResponse.json(
        { error: 'boardName and metrics are required' },
        { status: 400 }
      )
    }

    // Insert metrics into database
    const { data, error } = await supabase
      .from('job_board_metrics')
      .insert([
        {
          board_name: boardName,
          total_postings: metrics.totalPostings,
          avg_lifespan_days: metrics.avgLifespanDays,
          response_rate: metrics.responseRate,
          acceptance_rate: metrics.acceptanceRate,
          data_source: metrics.dataSource,
          collected_date: new Date(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error collecting metrics:', error)
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    )
  }
}
