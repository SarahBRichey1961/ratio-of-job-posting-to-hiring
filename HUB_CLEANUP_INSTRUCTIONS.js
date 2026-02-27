// Simple SQL cleanup script - run in Supabase SQL Editor
// This will delete all test data from the Hub tables

const sql = `
-- Delete all discussion comments first
DELETE FROM hub_discussion_comments
WHERE true;

-- Delete all discussions
DELETE FROM hub_discussions
WHERE true;

-- Delete all projects
DELETE FROM hub_projects
WHERE true;

-- Delete all opportunities
DELETE FROM hub_opportunities
WHERE true;

-- Verify cleanup
SELECT 
  (SELECT COUNT(*) FROM hub_discussions) as discussions_remaining,
  (SELECT COUNT(*) FROM hub_projects) as projects_remaining,
  (SELECT COUNT(*) FROM hub_opportunities) as opportunities_remaining,
  (SELECT COUNT(*) FROM hub_discussion_comments) as comments_remaining;
`

console.log('📋 SQL Cleanup Script')
console.log('=' .repeat(50))
console.log('\nTo clean up all test data:')
console.log('1. Go to https://app.supabase.com')
console.log('2. Select your project')
console.log('3. Go to SQL Editor')
console.log('4. Create new query and paste the SQL below:')
console.log('\n' + sql)
console.log('\nAfter running this query, all test data will be deleted and left with empty tables.')
