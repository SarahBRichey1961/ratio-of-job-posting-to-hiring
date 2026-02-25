import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blhrazwlfzrclwaluqak.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying industry_metrics migration...\n')

    // Create table
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS industry_metrics (
          id BIGSERIAL PRIMARY KEY,
          industry TEXT UNIQUE NOT NULL,
          total_boards INTEGER DEFAULT 0,
          avg_score INTEGER DEFAULT 0,
          median_lifespan INTEGER DEFAULT 0,
          avg_repost_rate INTEGER DEFAULT 0,
          total_job_postings INTEGER DEFAULT 0,
          top_board TEXT,
          top_role TEXT,
          trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
          updated_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_industry_metrics_industry ON industry_metrics(industry);
      `
    })

    if (createError) {
      console.log('⚠️  Table creation message:', createError)
    } else {
      console.log('✅ Table created or already exists')
    }

    // Get all industries and calculate metrics
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select('*')

    if (boardError) {
      console.error('❌ Error fetching boards:', boardError)
      return
    }

    console.log(`\n📊 Processing ${boards?.length || 0} boards...\n`)

    // Group and calculate
    const industryMap: { [key: string]: any[] } = {}
    boards?.forEach((board: any) => {
      if (!industryMap[board.industry]) {
        industryMap[board.industry] = []
      }
      industryMap[board.industry].push(board)
    })

    // Upsert each industry's metrics
    for (const [industry, boardsList] of Object.entries(industryMap)) {
      const scores = boardsList.map((b: any) => b.score || 0)
      const lifespans = boardsList.map((b: any) => b.lifespan || 0)
      const repostRates = boardsList.map((b: any) => b.repost_rate || 0)
      const totalPostings = boardsList.reduce((sum: number, b: any) => sum + (b.total_postings || 0), 0)

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const sortedLifespans = lifespans.sort((a, b) => a - b)
      const medianLifespan = sortedLifespans[Math.floor(sortedLifespans.length / 2)] || 0
      const avgRepostRate = repostRates.length > 0 ? Math.round(repostRates.reduce((a, b) => a + b, 0) / repostRates.length) : 0
      const topBoard = boardsList.sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.name || 'N/A'
      const trend = avgScore >= 75 ? 'up' : avgScore < 50 ? 'down' : 'stable'

      const { data, error } = await supabase
        .from('industry_metrics')
        .upsert({
          industry,
          total_boards: boardsList.length,
          avg_score: avgScore,
          median_lifespan: medianLifespan,
          avg_repost_rate: avgRepostRate,
          total_job_postings: totalPostings,
          top_board: topBoard,
          top_role: 'Technology',
          trend,
          updated_at: new Date(),
        })

      if (error) {
        console.error(`❌ Error upserting ${industry}:`, error)
      } else {
        console.log(`✅ ${industry}`)
        console.log(`   📊 Boards: ${boardsList.length} | Score: ${avgScore} | Lifespan: ${medianLifespan}d | Trend: ${trend}\n`)
      }
    }

    console.log('✨ Industry metrics updated successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyMigration()
