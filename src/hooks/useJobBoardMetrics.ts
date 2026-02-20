/**
 * Hook for fetching job board metrics from the API
 */

import { useState, useEffect } from 'react'

export interface JobBoardMetric {
  id: string
  board_name: string
  total_postings: number
  avg_lifespan_days: number
  response_rate?: number
  acceptance_rate?: number
  data_source: 'api' | 'scraping' | 'estimate'
  collected_date: string
}

export function useJobBoardMetrics() {
  const [metrics, setMetrics] = useState<JobBoardMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        
        // Get the latest metric for each board
        const latestMetrics = new Map<string, JobBoardMetric>()
        data.forEach((metric: JobBoardMetric) => {
          if (
            !latestMetrics.has(metric.board_name) ||
            new Date(metric.collected_date) >
              new Date(latestMetrics.get(metric.board_name)!.collected_date)
          ) {
            latestMetrics.set(metric.board_name, metric)
          }
        })

        setMetrics(Array.from(latestMetrics.values()))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Return empty array on error so UI doesn't break
        setMetrics([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    // Refresh every 6 hours
    const interval = setInterval(fetchMetrics, 6 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { metrics, loading, error }
}

/**
 * Get metric for a specific board
 */
export function useJobBoardMetric(boardName: string) {
  const { metrics, loading, error } = useJobBoardMetrics()
  const metric = metrics.find((m) => m.board_name === boardName)

  return { metric, loading, error }
}
