/**
 * Daily board activity ingestion job
 * Computes metrics from job postings and populates daily_board_activity tables
 * 
 * Usage: node scripts/computeDailyBoardActivity.ts <date>
 * Example: node scripts/computeDailyBoardActivity.ts 2026-02-24
 */

import { getSupabase } from '../src/lib/supabase'
import { FALLBACK_BOARDS } from '../src/lib/fallbackBoardsData'

interface SeniorityBreakdown {
  entry: number
  mid: number
  senior: number
}

interface GeographyBreakdown {
  remote: number
  onsite: number
  hybrid: number
}

interface RoleMetrics {
  [role: string]: SeniorityBreakdown
}

interface DailyMetrics {
  boardId: number
  boardName: string
  newPostings: number
  postingVelocity: number
  totalActive: number
  seniorityBreakdown: SeniorityBreakdown
  geographyBreakdown: GeographyBreakdown
  uniqueCompanies: number
  topCompanies: Array<{ name: string; count: number }>
  roleMetrics: RoleMetrics
}

const SENIORITY_KEYWORDS = {
  entry: ['entry', 'junior', 'graduate', 'intern', '0-2 years'],
  mid: ['mid', 'mid-level', 'intermediate', '2-5 years', 'experienced'],
  senior: ['senior', 'lead', 'principal', 'staff', '5+ years', 'expert'],
}

const GEOGRAPHY_KEYWORDS = {
  remote: ['remote', 'work from home', 'wfh', 'distributed', '100% remote'],
  hybrid: ['hybrid', 'flexible', 'some remote', '3 days', 'mixed'],
  onsite: ['on-site', 'onsite', 'office', 'in-person', 'workplace'],
}

async function inferSeniorityFromTitle(title: string): Promise<string> {
  const lower = title.toLowerCase()
  
  for (const keyword of SENIORITY_KEYWORDS.senior) {
    if (lower.includes(keyword)) return 'Senior'
  }
  for (const keyword of SENIORITY_KEYWORDS.mid) {
    if (lower.includes(keyword)) return 'Mid'
  }
  for (const keyword of SENIORITY_KEYWORDS.entry) {
    if (lower.includes(keyword)) return 'Entry'
  }
  
  // Default: assume mid-level
  return 'Mid'
}

async function inferGeographyFromDescription(
  title: string,
  description?: string
): Promise<string> {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  for (const keyword of GEOGRAPHY_KEYWORDS.remote) {
    if (text.includes(keyword)) return 'remote'
  }
  for (const keyword of GEOGRAPHY_KEYWORDS.hybrid) {
    if (text.includes(keyword)) return 'hybrid'
  }
  for (const keyword of GEOGRAPHY_KEYWORDS.onsite) {
    if (text.includes(keyword)) return 'onsite'
  }
  
  // Default: assume onsite
  return 'onsite'
}

async function extractRoleType(title: string): Promise<string> {
  const roles = [
    'software engineer',
    'developer',
    'product manager',
    'pm',
    'designer',
    'ux designer',
    'data scientist',
    'data engineer',
    'devops',
    'sales',
    'marketing',
    'customer support',
    'accountant',
    'financial',
    'operations',
    'manager',
    'director',
    'executive',
  ]
  
  const lower = title.toLowerCase()
  for (const role of roles) {
    if (lower.includes(role)) return role.charAt(0).toUpperCase() + role.slice(1)
  }
  
  return 'Other'
}

async function computePastingVelocity(
  newPostings: number,
  hoursInDay: number = 24
): Promise<number> {
  return parseFloat((newPostings / hoursInDay).toFixed(2))
}

async function computeDailyMetrics(
  boardId: number,
  boardName: string,
  targetDate: string
): Promise<DailyMetrics> {
  const client = getSupabase()
  
  if (!client) {
    throw new Error('Supabase client not initialized')
  }

  // Fetch job postings for this board on target date
  const { data: postings, error } = await client
    .from('job_postings')
    .select('id, title, company_name, description, posted_date, location_type')
    .eq('board_id', boardId)
    .gte('posted_date', `${targetDate}T00:00:00Z`)
    .lte('posted_date', `${targetDate}T23:59:59Z`)

  if (error) {
    console.error(`Error fetching postings for board ${boardName}:`, error)
    return getDefaultMetrics(boardId, boardName)
  }

  if (!postings || postings.length === 0) {
    console.warn(`No postings found for ${boardName} on ${targetDate}`)
    return getDefaultMetrics(boardId, boardName)
  }

  // Initialize breakdowns
  const seniorityBreakdown: SeniorityBreakdown = { entry: 0, mid: 0, senior: 0 }
  const geographyBreakdown: GeographyBreakdown = { remote: 0, onsite: 0, hybrid: 0 }
  const companies = new Map<string, number>()
  const roles: RoleMetrics = {}

  // Process each posting
  for (const posting of postings) {
    // Seniority
    const seniority = await inferSeniorityFromTitle(posting.title)
    seniorityBreakdown[seniority.toLowerCase() as keyof SeniorityBreakdown]++

    // Geography
    const geography = await inferGeographyFromDescription(posting.title, posting.description)
    geographyBreakdown[geography as keyof GeographyBreakdown]++

    // Companies
    if (posting.company_name) {
      companies.set(
        posting.company_name,
        (companies.get(posting.company_name) || 0) + 1
      )
    }

    // Roles
    const role = await extractRoleType(posting.title)
    if (!roles[role]) {
      roles[role] = { entry: 0, mid: 0, senior: 0 }
    }
    roles[role][seniority.toLowerCase() as keyof SeniorityBreakdown]++
  }

  // Convert to percentages
  const total = postings.length
  const seniorityPcts = {
    entry: parseFloat(((seniorityBreakdown.entry / total) * 100).toFixed(2)),
    mid: parseFloat(((seniorityBreakdown.mid / total) * 100).toFixed(2)),
    senior: parseFloat(((seniorityBreakdown.senior / total) * 100).toFixed(2)),
  }

  const geographyPcts = {
    remote: parseFloat(((geographyBreakdown.remote / total) * 100).toFixed(2)),
    onsite: parseFloat(((geographyBreakdown.onsite / total) * 100).toFixed(2)),
    hybrid: parseFloat(((geographyBreakdown.hybrid / total) * 100).toFixed(2)),
  }

  // Top 10 companies
  const topCompanies = Array.from(companies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topCompanyConcentration = parseFloat(
    (
      (topCompanies.reduce((sum, c) => sum + c.count, 0) / total) * 100
    ).toFixed(2)
  )

  return {
    boardId,
    boardName,
    newPostings: total,
    postingVelocity: await computePastingVelocity(total),
    totalActive: total, // In production, would query all active postings
    seniorityBreakdown: seniorityPcts,
    geographyBreakdown: geographyPcts,
    uniqueCompanies: companies.size,
    topCompanies,
    roleMetrics: roles,
  }
}

function getDefaultMetrics(boardId: number, boardName: string): DailyMetrics {
  // Return zero metrics if no data found
  return {
    boardId,
    boardName,
    newPostings: 0,
    postingVelocity: 0,
    totalActive: 0,
    seniorityBreakdown: { entry: 0, mid: 0, senior: 0 },
    geographyBreakdown: { remote: 0, onsite: 0, hybrid: 0 },
    uniqueCompanies: 0,
    topCompanies: [],
    roleMetrics: {},
  }
}

async function saveDailyMetrics(
  metrics: DailyMetrics,
  targetDate: string
): Promise<void> {
  const client = getSupabase()
  
  if (!client) {
    throw new Error('Supabase client not initialized')
  }

  // Save to daily_board_activity
  const { error: activityError } = await client
    .from('daily_board_activity')
    .upsert([
      {
        date: targetDate,
        board_id: metrics.boardId,
        board_name: metrics.boardName,
        new_postings: metrics.newPostings,
        posting_velocity: metrics.postingVelocity,
        total_active_postings: metrics.totalActive,
        entry_level_pct: metrics.seniorityBreakdown.entry,
        mid_level_pct: metrics.seniorityBreakdown.mid,
        senior_level_pct: metrics.seniorityBreakdown.senior,
        remote_pct: metrics.geographyBreakdown.remote,
        onsite_pct: metrics.geographyBreakdown.onsite,
        hybrid_pct: metrics.geographyBreakdown.hybrid,
        unique_companies: metrics.uniqueCompanies,
        top_company_concentration: metrics.topCompanies
          .reduce((sum, c) => sum + c.count, 0) > 0
          ? parseFloat(
              (
                (metrics.topCompanies.reduce((sum, c) => sum + c.count, 0) /
                  metrics.newPostings) *
                100
              ).toFixed(2)
            )
          : 0,
      },
    ])

  if (activityError) {
    throw new Error(`Failed to save activity metrics: ${activityError.message}`)
  }

  // Save top companies
  if (metrics.topCompanies.length > 0) {
    const companyMixData = metrics.topCompanies.map((company, index) => ({
      date: targetDate,
      board_id: metrics.boardId,
      company_name: company.name,
      postings_count: company.count,
      pct_of_board: parseFloat(
        ((company.count / metrics.newPostings) * 100).toFixed(2)
      ),
      rank_position: index + 1,
    }))

    const { error: companyError } = await client
      .from('daily_board_company_mix')
      .upsert(companyMixData)

    if (companyError) {
      console.warn(`Failed to save company mix for ${metrics.boardName}:`, companyError)
    }
  }

  // Save role/seniority breakdown
  const roleSeniorityData: Array<any> = []
  Object.entries(metrics.roleMetrics).forEach(([role, breakdown]) => {
    Object.entries(breakdown).forEach(([seniority, count]) => {
      if (count > 0) {
        roleSeniorityData.push({
          date: targetDate,
          board_id: metrics.boardId,
          role_type: role,
          seniority_level: seniority.charAt(0).toUpperCase() + seniority.slice(1),
          postings_count: count,
        })
      }
    })
  })

  if (roleSeniorityData.length > 0) {
    const { error: roleError } = await client
      .from('daily_role_seniority')
      .upsert(roleSeniorityData)

    if (roleError) {
      console.warn(`Failed to save role seniority for ${metrics.boardName}:`, roleError)
    }
  }
}

async function main() {
  const targetDate = process.argv[2] || new Date().toISOString().split('T')[0]
  
  console.log(`\n📊 Computing daily board activity metrics for ${targetDate}...`)
  
  try {
    const boards = FALLBACK_BOARDS
    let successCount = 0
    let errorCount = 0

    for (const board of boards) {
      try {
        console.log(`  Processing ${board.name}...`)
        const metrics = await computeDailyMetrics(board.id, board.name, targetDate)
        await saveDailyMetrics(metrics, targetDate)
        
        console.log(
          `    ✓ ${metrics.newPostings} postings | ${metrics.postingVelocity}/hr velocity`
        )
        successCount++
      } catch (error) {
        console.error(`  ✗ Error processing ${board.name}:`, error)
        errorCount++
      }
    }

    console.log(`\n✅ Completed: ${successCount} boards processed, ${errorCount} errors\n`)
    
    if (errorCount === 0) {
      console.log('🎉 All boards processed successfully!')
    }
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
