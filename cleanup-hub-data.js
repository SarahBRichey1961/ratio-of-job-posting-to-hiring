const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  console.error(`URL: ${supabaseUrl ? '✓' : '✗'}`)
  console.error(`Key: ${supabaseServiceKey ? '✓' : '✗'}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupHubData() {
  try {
    console.log('🧹 Starting Hub data cleanup...\n')

    // Delete comments first (references discussions)
    console.log('Deleting discussion comments...')
    const { count: commentsCount, error: commentsError } = await supabase
      .from('hub_discussion_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (commentsError) {
      console.error('❌ Error deleting comments:', commentsError.message)
    } else {
      console.log(`✅ Deleted discussion comments (attempt made)`)
    }

    // Delete discussions
    console.log('Deleting discussions...')
    const { error: discussionsError } = await supabase
      .from('hub_discussions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (discussionsError) {
      console.error('❌ Error deleting discussions:', discussionsError.message)
    } else {
      console.log('✅ Deleted all discussions')
    }

    // Delete projects
    console.log('Deleting projects...')
    const { error: projectsError } = await supabase
      .from('hub_projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (projectsError) {
      console.error('❌ Error deleting projects:', projectsError.message)
    } else {
      console.log('✅ Deleted all projects')
    }

    // Delete opportunities
    console.log('Deleting opportunities...')
    const { error: opportunitiesError } = await supabase
      .from('hub_opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (opportunitiesError) {
      console.error('❌ Error deleting opportunities:', opportunitiesError.message)
    } else {
      console.log('✅ Deleted all opportunities')
    }

    console.log('\n✨ Hub cleanup complete!')
    console.log('All test data has been removed.')
  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error.message)
    process.exit(1)
  }
}

cleanupHubData()
