import { supabase } from './supabase'

export interface JobBoard {
  id: number
  name: string
  url: string
  category: 'general' | 'tech' | 'remote' | 'niche'
  description: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all job boards filtered by category
 */
export async function getJobBoards(category?: string): Promise<JobBoard[]> {
  let query = supabase.from('job_boards').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('category').order('name')

  if (error) {
    console.error('Error fetching job boards:', error)
    return []
  }

  return data || []
}

/**
 * Get a single job board by ID
 */
export async function getJobBoardById(id: number): Promise<JobBoard | null> {
  const { data, error } = await supabase
    .from('job_boards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching job board:', error)
    return null
  }

  return data
}

/**
 * Get job boards grouped by category
 */
export async function getJobBoardsByCategory(): Promise<Record<string, JobBoard[]>> {
  const boards = await getJobBoards()
  
  const grouped: Record<string, JobBoard[]> = {
    general: [],
    tech: [],
    remote: [],
    niche: [],
  }

  boards.forEach((board) => {
    if (grouped[board.category]) {
      grouped[board.category].push(board)
    }
  })

  return grouped
}

/**
 * Count total job boards
 */
export async function countJobBoards(): Promise<number> {
  const { count, error } = await supabase
    .from('job_boards')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error counting job boards:', error)
    return 0
  }

  return count || 0
}
