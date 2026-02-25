const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateIndustryMetrics() {
  try {
    console.log('🔄 Updating industry insight metrics...\n');

    // Fetch all boards
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select('*');

    if (boardError) {
      console.error('❌ Error fetching boards:', boardError);
      return;
    }

    if (!boards || boards.length === 0) {
      console.log('⚠️  No boards found');
      return;
    }

    console.log(`📊 Processing ${boards.length} boards across all industries...\n`);

    // Group by industry
    const industryMap = {};
    boards.forEach(board => {
      if (!industryMap[board.industry]) {
        industryMap[board.industry] = [];
      }
      industryMap[board.industry].push(board);
    });

    // Calculate and upsert metrics for each industry
    for (const [industry, boardsList] of Object.entries(industryMap)) {
      const scores = boardsList.map(b => b.score || 0);
      const lifespans = boardsList.map(b => b.lifespan || 0);
      const repostRates = boardsList.map(b => b.repost_rate || 0);
      const totalPostings = boardsList.reduce((sum, b) => sum + (b.total_postings || 0), 0);

      // Calculate metrics
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      const sortedLifespans = lifespans.sort((a, b) => a - b);
      const medianLifespan = sortedLifespans[Math.floor(sortedLifespans.length / 2)] || 0;

      const avgRepostRate = repostRates.length > 0 
        ? Math.round(repostRates.reduce((a, b) => a + b, 0) / repostRates.length)
        : 0;

      const topBoard = boardsList.length > 0
        ? boardsList.sort((a, b) => (b.score || 0) - (a.score || 0))[0].name
        : 'N/A';

      const trend = avgScore >= 75 ? 'up' : avgScore < 50 ? 'down' : 'stable';

      // Upsert the metric
      const { error } = await supabase
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
        }, {
          onConflict: 'industry'
        });

      if (error) {
        console.error(`❌ Error upserting ${industry}:`, error);
      } else {
        console.log(`✅ ${industry.padEnd(25)} | Boards: ${boardsList.length.toString().padStart(2)} | Avg Score: ${avgScore.toString().padStart(3)} | Median Lifespan: ${medianLifespan.toString().padStart(2)}d | Trend: ${trend}`);
      }
    }

    console.log('\n✨ Industry metrics updated successfully!');

    // Show summary
    const { data: summary } = await supabase
      .from('industry_metrics')
      .select('*')
      .order('avg_score', { ascending: false });

    console.log('\n📊 Industry Metrics Summary:');
    console.log('─'.repeat(90));
    console.log('Industry'.padEnd(30) + 'Boards'.padStart(10) + 'Avg Score'.padStart(15) + 'Lifespan'.padStart(15) + 'Trend'.padStart(15));
    console.log('─'.repeat(90));
    summary?.forEach(m => {
      console.log(m.industry.padEnd(30) + m.total_boards.toString().padStart(10) + m.avg_score.toString().padStart(15) + (m.median_lifespan + 'd').padStart(15) + m.trend.padStart(15));
    });
    console.log('─'.repeat(90));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateIndustryMetrics();
