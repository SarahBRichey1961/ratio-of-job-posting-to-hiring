/**
 * Seed script for job boards - Run this to populate the database
 * usage: npx ts-node scripts/seedJobBoards.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JOB_BOARDS = [
  // General Job Boards
  { name: 'Indeed', url: 'https://www.indeed.com', category: 'general', description: 'Largest job board with 250M+ monthly visitors' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', category: 'general', description: 'Professional network job listings' },
  { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com', category: 'general', description: 'AI-powered job matching platform' },
  { name: 'Glassdoor', url: 'https://www.glassdoor.com', category: 'general', description: 'Job board with company reviews and salaries' },
  { name: 'CareerBuilder', url: 'https://www.careerbuilder.com', category: 'general', description: 'Established job board with resume database' },
  { name: 'Monster', url: 'https://www.monster.com', category: 'general', description: 'Legacy job board with global reach' },
  { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'general', description: 'Job board focused on flexible and remote work' },

  // Tech-Focused Job Boards
  { name: 'Stack Overflow', url: 'https://stackoverflow.com/jobs', category: 'tech', description: 'Developer-focused job board' },
  { name: 'GitHub Jobs', url: 'https://jobs.github.com', category: 'tech', description: 'Tech jobs from GitHub community' },
  { name: 'AngelList', url: 'https://angel.co/jobs', category: 'tech', description: 'Startup job board' },
  { name: 'We Work Remotely', url: 'https://weworkremotely.com', category: 'tech', description: 'Remote tech jobs' },
  { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', category: 'tech', description: 'Designer and creative tech jobs' },
  { name: 'Crunchboard', url: 'https://crunchboard.com', category: 'tech', description: 'Tech and startup jobs' },
  { name: 'The Muse', url: 'https://www.themuse.com', category: 'tech', description: 'Tech and creative jobs with company culture focus' },
  { name: 'Hired', url: 'https://hired.com', category: 'tech', description: 'Invite-only tech job board' },
  { name: 'Blind', url: 'https://www.teamblind.com', category: 'tech', description: 'Tech company job board with anonymous reviews' },
  { name: 'Dice', url: 'https://www.dice.com', category: 'tech', description: 'Tech and engineering jobs' },

  // Remote-Focused Job Boards
  { name: 'RemoteOK', url: 'https://remoteok.io', category: 'remote', description: 'Remote job board with 75,000+ jobs' },
  { name: 'Working Nomads', url: 'https://www.workingnomads.co', category: 'remote', description: 'Remote jobs for digital nomads' },
  { name: 'Remotive', url: 'https://remotive.io', category: 'remote', description: 'Curated remote job board' },
  { name: 'Remote.co', url: 'https://remote.co', category: 'remote', description: 'Remote job board with quality curation' },
  { name: 'Virtual Vocations', url: 'https://www.virtualvocations.com', category: 'remote', description: 'Vetted remote jobs database' },

  // Niche Job Boards
  { name: 'Idealist.org', url: 'https://www.idealist.org', category: 'niche', description: 'Non-profit and social impact jobs' },
  { name: 'EnvironmentalCareer.com', url: 'https://www.environmentalcareer.com', category: 'niche', description: 'Environmental and sustainability jobs' },
  { name: 'Proofreads', url: 'https://www.proofreads.com', category: 'niche', description: 'Writing and editorial jobs' },
  { name: 'ProBlogger', url: 'https://problogger.com', category: 'niche', description: 'Blogging and content writing jobs' },
  { name: 'Mediabistro', url: 'https://www.mediabistro.com', category: 'niche', description: 'Media, publishing, and creative jobs' },
  { name: 'Design Observer', url: 'https://designobserver.com/opportunities', category: 'niche', description: 'Design and creative jobs' },
  { name: 'EduJobs', url: 'https://www.edujobs.org', category: 'niche', description: 'Education and academic jobs' },
  { name: 'Healthcare Jobsite', url: 'https://www.healthcarejobsite.com', category: 'niche', description: 'Healthcare and nursing jobs' },
  { name: 'Culinary Agents', url: 'https://www.theculinaryagents.com', category: 'niche', description: 'Culinary and hospitality jobs' },
  { name: 'Aviation Job Search', url: 'https://www.aviationjobsearch.com', category: 'niche', description: 'Aviation and aerospace jobs' },
  { name: 'Legal Boards', url: 'https://legalboards.com', category: 'niche', description: 'Legal and law firm jobs' },
  { name: 'Behance Jobs', url: 'https://www.behance.net', category: 'niche', description: 'Creative and design portfolio jobs' },
]

async function seedJobBoards() {
  console.log(`🌱 Seeding ${JOB_BOARDS.length} job boards...`)

  try {
    const { data, error } = await supabase
      .from('job_boards')
      .insert(JOB_BOARDS)
      .select()

    if (error) {
      console.error('❌ Error inserting job boards:', error)
      process.exit(1)
    }

    const count = data?.length || 0
    console.log(`✅ Successfully seeded ${count} job boards!`)

    // Get summary by category
    const summary = JOB_BOARDS.reduce((acc, board) => {
      acc[board.category] = (acc[board.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Summary by category:')
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} boards`)
    })
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  }
}

seedJobBoards()
