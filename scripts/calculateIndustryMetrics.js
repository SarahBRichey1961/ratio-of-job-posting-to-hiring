const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateIndustryMetrics() {
  try {
    console.log('📊 CALCULATING INDUSTRY INSIGHT METRICS\n');
    console.log(''.padEnd(100, '=') + '\n');

    // Step 1: Get all boards grouped by industry
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name, industry');

    if (boardError || !boards) {
      console.error('Error fetching boards:', boardError);
      return;
    }

    // Group boards by industry
    const industryMap = {};
    boards.forEach(board => {
      if (!industryMap[board.industry]) {
        industryMap[board.industry] = [];
      }
      industryMap[board.industry].push(board);
    });

    console.log(`📍 Found ${boards.length} boards across ${Object.keys(industryMap).length} industries\n`);

    // Step 2: For each industry, calculate metrics from job_postings table
    const metricsArray = [];

    for (const [industry, industryBoards] of Object.entries(industryMap)) {
      const boardIds = industryBoards.map(b => b.id);
      
      // Get posting lifespan metrics for these boards
      const { data: postings, error: posError } = await supabase
        .from('job_postings')
        .select('job_board_id, lifespan_days, repost_count')
        .in('job_board_id', boardIds);

      if (posError) {
        console.error(`Error fetching postings for ${industry}:`, posError);
        continue;
      }

      // Calculate metrics
      let totalLifespans = [];
      let totalReposts = [];
      let totalPostings = postings?.length || 0;

      postings?.forEach(p => {
        if (p.lifespan_days !== null) {
          totalLifespans.push(p.lifespan_days);
        }
        if (p.repost_count !== null) {
          totalReposts.push(p.repost_count);
        }
      });

      // Average metrics
      const avgLifespan = totalLifespans.length > 0
        ? Math.round(totalLifespans.reduce((a, b) => a + b, 0) / totalLifespans.length * 10) / 10
        : 0;

      const medianLifespan = totalLifespans.length > 0
        ? totalLifespans.sort((a, b) => a - b)[Math.floor(totalLifespans.length / 2)]
        : 0;

      const avgRepostRate = totalReposts.length > 0
        ? Math.round(totalReposts.reduce((a, b) => a + b, 0) / totalReposts.length * 100) / 100
        : 0;

      // Determine score (scale 0-100 based on lifespan and reposts)
      // Shorter lifespan = higher score, lower reposts = higher score
      const lifespanScore = Math.max(0, Math.min(100, 100 - (avgLifespan * 1.5)));
      const repostScore = Math.max(0, Math.min(100, 100 - (avgRepostRate * 10)));
      const avgScore = Math.round((lifespanScore + repostScore) / 2);

      const trend = avgScore >= 75 ? 'up' : avgScore < 50 ? 'down' : 'stable';

      const topBoard = industryBoards.length > 0 
        ? industryBoards[0].name 
        : 'N/A';

      metricsArray.push({
        industry,
        total_boards: industryBoards.length,
        avg_score: avgScore,
        median_lifespan: Math.round(medianLifespan),
        avg_repost_rate: Math.round(avgRepostRate * 100) / 100,
        total_job_postings: totalPostings,
        top_board: topBoard,
        top_role: 'Technology',
        trend,
      });

      console.log(`✅ ${industry.padEnd(30)}`);
      console.log(`   📊 Boards: ${industryBoards.length} | Postings: ${totalPostings} | Avg Score: ${avgScore}`);
      console.log(`   ⏱️  Lifespan: ${avgLifespan}d avg | ${medianLifespan}d median`);
      console.log(`   🔄 Repost Rate: ${avgRepostRate} | Trend: ${trend}\n`);
    }

    // Step 3: Create industry_metrics table if it doesn't exist
    console.log('\n' + ''.padEnd(100, '='));
    console.log('📋 Creating/updating industry_metrics table...\n');

    // We'll provide SQL to create the table
    console.log('Please execute this SQL in Supabase SQL Editor:\n');
    console.log(`
    
    -- Create industry_metrics table
    CREATE TABLE IF NOT EXISTS industry_metrics (
      id BIGSERIAL PRIMARY KEY,
      industry TEXT UNIQUE NOT NULL,
      total_boards INTEGER DEFAULT 0,
      avg_score INTEGER DEFAULT 0,
      median_lifespan INTEGER DEFAULT 0,
      avg_repost_rate DECIMAL(5,2) DEFAULT 0,
      total_job_postings INTEGER DEFAULT 0,
      top_board TEXT,
      top_role TEXT,
      trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_industry_metrics_industry ON industry_metrics(industry);

    `);

    // Step 4: Display summary
    console.log('\n' + ''.padEnd(100, '='));
    console.log('\n📊 INDUSTRY METRICS SUMMARY\n');
    console.log('Industry'.padEnd(30) + 'Boards'.padStart(10) + 'Score'.padStart(10) + 'Lifespan'.padStart(12) + 'Reposts'.padStart(12) + 'Postings'.padStart(12) + 'Trend'.padStart(10));
    console.log(''.padEnd(100, '─'));

    metricsArray.sort((a, b) => b.avg_score - a.avg_score).forEach(m => {
      console.log(
        m.industry.padEnd(30) +
        m.total_boards.toString().padStart(10) +
        m.avg_score.toString().padStart(10) +
        (m.median_lifespan + 'd').padStart(12) +
        m.avg_repost_rate.toString().padStart(12) +
        m.total_job_postings.toString().padStart(12) +
        m.trend.padStart(10)
      );
    });

    console.log('\n' + ''.padEnd(100, '='));
    console.log('\n✨ Metrics calculated! Now insert this data:\n');

    // Display INSERT statements
    metricsArray.forEach(m => {
      console.log(`
    INSERT INTO industry_metrics (industry, total_boards, avg_score, median_lifespan, avg_repost_rate, total_job_postings, top_board, top_role, trend, updated_at)
    VALUES (
      '${m.industry.replace(/'/g, "''")}',
      ${m.total_boards},
      ${m.avg_score},
      ${m.median_lifespan},
      ${m.avg_repost_rate},
      ${m.total_job_postings},
      '${m.top_board.replace(/'/g, "''")}',
      '${m.top_role.replace(/'/g, "''")}',
      '${m.trend}',
      NOW()
    )
    ON CONFLICT (industry) DO UPDATE SET
      total_boards = EXCLUDED.total_boards,
      avg_score = EXCLUDED.avg_score,
      median_lifespan = EXCLUDED.median_lifespan,
      avg_repost_rate = EXCLUDED.avg_repost_rate,
      total_job_postings = EXCLUDED.total_job_postings,
      top_board = EXCLUDED.top_board,
      top_role = EXCLUDED.top_role,
      trend = EXCLUDED.trend,
      updated_at = NOW();
      `);
    });

    console.log('\n'.padEnd(100, '='));
    console.log('\n💾 Copy the SQL statements above and execute them in Supabase SQL Editor');
    console.log('📝 Or run: node scripts/populateIndustryMetricsSQL.js > industry_metrics.sql\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

calculateIndustryMetrics();
