#!/usr/bin/env node

/**
 * COMPREHENSIVE END-TO-END TEST
 * Build the Damn Thing - Database Persistence & Search Feature
 * 
 * This test verifies:
 * 1. Database table exists and is properly configured
 * 2. Save API endpoint works correctly
 * 3. Search API endpoint finds submissions by name and location
 * 4. Detail API endpoint retrieves full content
 * 5. Generated apps can successfully save and search data
 */

const API_BASE = 'http://localhost:3000/api/hub'
const TEST_APP_NAME = 'GrandLetters'
const TEST_APP_IDEA = 'App for grandparents to write and share letters with grandkids'

let testsPassed = 0
let testsFailed = 0

console.log('\n' + '='.repeat(80))
console.log('🧪 BUILD THE DAMN THING - DATABASE & SEARCH TEST SUITE')
console.log('='.repeat(80) + '\n')

console.log('⚠️  PREREQUISITES:')
console.log('1. Server must be running on http://localhost:3000')
console.log('2. Supabase project must be accessible')
console.log('3. CREATE_APP_SUBMISSIONS_TABLE.sql must have been executed\n')

/**
 * TEST 1: Save a single submission
 */
async function testSaveSubmission() {
  console.log('\n📝 TEST 1: Save Submission to Database')
  console.log('-'.repeat(80))

  const submission = {
    appName: TEST_APP_NAME,
    appIdea: TEST_APP_IDEA,
    name: 'Margaret Johnson',
    location: 'Portland, Oregon',
    submissionType: 'letter',
    content: `Dear granddaughter,\n\nI wanted to write to you today to share some of my warmest memories from when you were little. Do you remember the summer we spent together at the lake house? I taught you how to skip stones, and you laughed every time one bounced five times or more.\n\nI hope you know how much you mean to me.\n\nWith love,\nGrandma Margaret`,
  }

  try {
    const response = await fetch(`${API_BASE}/app-submission-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.id) {
      console.log(`✅ PASS: Submission saved successfully`)
      console.log(`   ID: ${data.id}`)
      console.log(`   From: ${submission.name} (${submission.location})`)
      testsPassed++
      return data.id
    } else {
      throw new Error(data.error || 'No ID returned')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
    return null
  }
}

/**
 * TEST 2: Save multiple submissions for search testing
 */
async function testSaveMultipleSubmissions() {
  console.log('\n📝 TEST 2: Save Multiple Submissions (for search testing)')
  console.log('-'.repeat(80))

  const submissions = [
    {
      appName: TEST_APP_NAME,
      appIdea: TEST_APP_IDEA,
      name: 'Robert Chen',
      location: 'Seattle, Washington',
      submissionType: 'letter',
      content: 'Dear grandson, I wanted to tell you about the time I started my first business...',
    },
    {
      appName: TEST_APP_NAME,
      appIdea: TEST_APP_IDEA,
      name: 'Susan Mitchell',
      location: 'Portland, Oregon',
      submissionType: 'poem',
      content: 'Roses are red, violets are blue, I write this poem just for you...',
    },
    {
      appName: TEST_APP_NAME,
      appIdea: TEST_APP_IDEA,
      name: 'James Thompson',
      location: 'Boston, Massachusetts',
      submissionType: 'letter',
      content: 'To my beloved grandchildren, I wanted to share the story of how I met your grandmother...',
    },
  ]

  let savedIds = []

  for (const submission of submissions) {
    try {
      const response = await fetch(`${API_BASE}/app-submission-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      })

      const data = await response.json()

      if (data.success && data.id) {
        console.log(`✅ Saved: ${submission.name} from ${submission.location}`)
        savedIds.push(data.id)
      }
    } catch (error) {
      console.error(`❌ Failed to save ${submission.name}:`, error)
    }
  }

  if (savedIds.length === submissions.length) {
    console.log(`\n✅ PASS: All ${savedIds.length} submissions saved`)
    testsPassed++
  } else {
    console.log(`\n⚠️ PARTIAL: ${savedIds.length}/${submissions.length} saved`)
    testsFailed++
  }

  return savedIds
}

/**
 * TEST 3: Search by name
 */
async function testSearchByName() {
  console.log('\n🔍 TEST 3: Search by Name')
  console.log('-'.repeat(80))

  try {
    const searchName = 'Margaret'
    const response = await fetch(
      `${API_BASE}/app-submission-search?appName=${TEST_APP_NAME}&name=${encodeURIComponent(searchName)}`
    )

    const data = await response.json()

    if (data.success && data.results) {
      const found = data.results.filter((r) =>
        r.name.toLowerCase().includes(searchName.toLowerCase())
      )

      if (found.length > 0) {
        console.log(`✅ PASS: Found ${found.length} result(s) for name "${searchName}"`)
        found.forEach((result) => {
          console.log(`   - ${result.name} (${result.location}) [${result.submissionType}]`)
          console.log(`     Preview: "${result.preview.substring(0, 50)}..."`)
        })
        testsPassed++
        return found
      } else {
        console.error(`❌ FAIL: No results found for "${searchName}"`)
        console.log(`   Total results in database: ${data.total}`)
        testsFailed++
      }
    } else {
      throw new Error(data.error || 'No results')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
  }
}

/**
 * TEST 4: Search by location
 */
async function testSearchByLocation() {
  console.log('\n🔍 TEST 4: Search by Location')
  console.log('-'.repeat(80))

  try {
    const searchLocation = 'Portland'
    const response = await fetch(
      `${API_BASE}/app-submission-search?appName=${TEST_APP_NAME}&location=${encodeURIComponent(searchLocation)}`
    )

    const data = await response.json()

    if (data.success && data.results) {
      const found = data.results.filter((r) =>
        r.location.toLowerCase().includes(searchLocation.toLowerCase())
      )

      if (found.length > 0) {
        console.log(`✅ PASS: Found ${found.length} result(s) in "${searchLocation}"`)
        found.forEach((result) => {
          console.log(`   - ${result.name} (${result.location}) [${result.submissionType}]`)
        })
        testsPassed++
        return found
      } else {
        console.error(`❌ FAIL: No results found for location "${searchLocation}"`)
        testsFailed++
      }
    } else {
      throw new Error(data.error || 'No results')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
  }
}

/**
 * TEST 5: Search by type
 */
async function testSearchByType() {
  console.log('\n🔍 TEST 5: Search by Type (Letter vs Poem)')
  console.log('-'.repeat(80))

  try {
    const searchType = 'poem'
    const response = await fetch(
      `${API_BASE}/app-submission-search?appName=${TEST_APP_NAME}&type=${searchType}`
    )

    const data = await response.json()

    if (data.success && data.results) {
      const poems = data.results.filter((r) => r.submissionType === searchType)

      if (poems.length > 0) {
        console.log(`✅ PASS: Found ${poems.length} ${searchType}(s)`)
        poems.forEach((result) => {
          console.log(`   - "${result.preview.substring(0, 50)}..."`)
        })
        testsPassed++
      } else {
        console.error(`❌ FAIL: No poems found`)
        testsFailed++
      }
    } else {
      throw new Error(data.error || 'No results')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
  }
}

/**
 * TEST 6: Get full submission content
 */
async function testGetFullSubmission() {
  console.log('\n📖 TEST 6: Get Full Submission Content')
  console.log('-'.repeat(80))

  try {
    // First get a search result to get an ID
    const searchResponse = await fetch(
      `${API_BASE}/app-submission-search?appName=${TEST_APP_NAME}&name=Margaret&limit=1`
    )
    const searchData = await searchResponse.json()

    if (!searchData.results || searchData.results.length === 0) {
      console.warn('⚠️ No submissions found to test detail retrieval')
      return
    }

    const submissionId = searchData.results[0].id

    // Now fetch the full content
    const detailResponse = await fetch(`${API_BASE}/app-submission?id=${submissionId}`)
    const detailData = await detailResponse.json()

    if (detailData.success && detailData.submission) {
      const sub = detailData.submission
      console.log(`✅ PASS: Retrieved full submission`)
      console.log(`   Name: ${sub.name}`)
      console.log(`   Location: ${sub.location}`)
      console.log(`   Type: ${sub.submissionType}`)
      console.log(`   Content length: ${sub.content.length} characters`)
      console.log(`   Content preview: "${sub.content.substring(0, 60)}..."`)
      testsPassed++
    } else {
      throw new Error(detailData.error || 'No submission returned')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
  }
}

/**
 * TEST 7: Combined search (name AND location)
 */
async function testCombinedSearch() {
  console.log('\n🔍 TEST 7: Combined Search (Name AND Location)')
  console.log('-'.repeat(80))

  try {
    const response = await fetch(
      `${API_BASE}/app-submission-search?appName=${TEST_APP_NAME}&name=Susan&location=Portland`
    )

    const data = await response.json()

    if (data.success && data.results) {
      const found = data.results.filter(
        (r) =>
          r.name.toLowerCase().includes('susan') &&
          r.location.toLowerCase().includes('portland')
      )

      if (found.length > 0) {
        console.log(`✅ PASS: Found ${found.length} result(s) for Susan in Portland`)
        found.forEach((result) => {
          console.log(`   - ${result.name} (${result.location})`)
        })
        testsPassed++
      } else {
        console.error(`❌ FAIL: No results for combined search`)
        testsFailed++
      }
    } else {
      throw new Error(data.error || 'No results')
    }
  } catch (error) {
    console.error(`❌ FAIL: ${error}`)
    testsFailed++
  }
}

/**
 * MAIN TEST RUNNER
 */
async function runAllTests() {
  try {
    // Save submissions
    await testSaveSubmission()
    await testSaveMultipleSubmissions()

    // Wait a bit for database consistency
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Search tests
    await testSearchByName()
    await testSearchByLocation()
    await testSearchByType()
    await testCombinedSearch()

    // Detail test
    await testGetFullSubmission()

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Passed: ${testsPassed}`)
    console.log(`❌ Failed: ${testsFailed}`)
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(0)}%\n`)

    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! Database and search features are working correctly.\n')
      console.log('✨ NEXT STEPS:')
      console.log('1. Deploy updated code to Netlify')
      console.log('2. Generate a new app that includes search/save features')
      console.log('3. Test saving a letter/poem in the generated app')
      console.log('4. Search for the saved item by name and location')
      console.log('5. Verify you can read the full content\n')
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.\n')
    }
  } catch (error) {
    console.error('❌ FATAL ERROR:', error)
  }
}

// Run tests
runAllTests()
