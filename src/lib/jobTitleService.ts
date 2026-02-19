import { supabase } from '@/lib/supabase'
import { normalizeJobTitle, RoleFamily } from '@/lib/titleNormalization'

/**
 * Normalize a job posting title and save to database
 */
export async function normalizeAndSaveJobTitle(
  jobPostingId: number,
  title: string
): Promise<{ original: string; normalized: RoleFamily } | null> {
  try {
    const normalized = normalizeJobTitle(title)

    const { error } = await supabase
      .from('job_postings')
      .update({ normalized_title: normalized })
      .eq('id', jobPostingId)

    if (error) throw error

    return { original: title, normalized }
  } catch (error) {
    console.error('Failed to normalize job title:', error)
    return null
  }
}

/**
 * Bulk normalize all job postings without titles
 */
export async function normalizeAllJobTitles(): Promise<{
  updated: number
  failed: number
}> {
  try {
    // Get all job postings that don't have normalized titles
    const { data: postings, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title')
      .is('normalized_title', null)

    if (fetchError) throw fetchError

    if (!postings || postings.length === 0) {
      return { updated: 0, failed: 0 }
    }

    let updated = 0
    let failed = 0

    // Normalize in batches
    const batchSize = 100
    for (let i = 0; i < postings.length; i += batchSize) {
      const batch = postings.slice(i, i + batchSize)

      const updates = batch.map((posting) => ({
        id: posting.id,
        title: posting.title,
        normalized_title: normalizeJobTitle(posting.title),
      }))

      const { error: updateError } = await supabase
        .from('job_postings')
        .upsert(updates)

      if (updateError) {
        console.error('Batch update error:', updateError)
        failed += batch.length
      } else {
        updated += batch.length
      }
    }

    return { updated, failed }
  } catch (error) {
    console.error('Failed to normalize all job titles:', error)
    return { updated: 0, failed: 0 }
  }
}

/**
 * Get job postings grouped by normalized title
 */
export async function getJobsByRoleFamily(
  roleFamily: RoleFamily,
  jobBoardId?: number
): Promise<any[]> {
  try {
    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('normalized_title', roleFamily)

    if (jobBoardId) {
      query = query.eq('job_board_id', jobBoardId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get jobs by role family:', error)
    return []
  }
}

/**
 * Get role family statistics for a job board
 */
export async function getRoleFamilyStatsForBoard(jobBoardId: number): Promise<
  Record<string, number>
> {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('normalized_title')
      .eq('job_board_id', jobBoardId)

    if (error) throw error

    const stats: Record<string, number> = {}
    data?.forEach((row) => {
      const family = row.normalized_title || 'unknown'
      stats[family] = (stats[family] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Failed to get role family stats:', error)
    return {}
  }
}

/**
 * Find duplicate or similar job postings
 */
export async function findSimilarPostings(
  jobPostingId: number,
  threshold: number = 0.8
): Promise<any[]> {
  try {
    // Get the source posting
    const { data: source, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title, normalized_title, company')
      .eq('id', jobPostingId)
      .single()

    if (fetchError || !source) throw fetchError

    // Get all postings with the same normalized title
    const { data: similar, error } = await supabase
      .from('job_postings')
      .select('id, title, company, created_at')
      .eq('normalized_title', source.normalized_title)
      .neq('id', jobPostingId)

    if (error) throw error
    return similar || []
  } catch (error) {
    console.error('Failed to find similar postings:', error)
    return []
  }
}
