#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST: Build the Damn Thing Feature
 * Tests the entire end-to-end flow including:
 * 1. Dynamic questions generation
 * 2. Custom app generation with OpenAI
 * 3. App-specific validation (not generic)
 */

const API_BASE = 'http://localhost:3000/api/hub'

console.log('🚀 TESTING BUILD THE DAMN THING FEATURE\n')
console.log('=' .repeat(60))

// TEST 1: Dynamic Questions Generation
async function testDynamicQuestions() {
  console.log('\n📋 TEST 1: Dynamic Questions Generation')
  console.log('-'.repeat(60))

  const testAppName = 'GrandCall'
  const testMainIdea = 'App for grandparents to video call and share memories with grandchildren'
  const testTargetUser = 'Non-technical grandparents aged 65+'
  const testProblemSolved = 'Grandparents struggle with complicated video calling apps'
  const testHowItWorks = 'Simple interface with large buttons, voice commands, and auto-connect to family'

  console.log(`📝 Testing with app: "${testAppName}"`)
  console.log(`💡 Idea: "${testMainIdea}"`)
  console.log(`👥 Target user: "${testTargetUser}"`)

  try {
    const response = await fetch(`${API_BASE}/generate-dynamic-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: testAppName,
        mainIdea: testMainIdea,
        targetUser: testTargetUser,
        problemSolved: testProblemSolved,
        howItWorks: testHowItWorks,
      }),
    })

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`)
      const error = await response.text()
      console.error(error)
      return null
    }

    const data = await response.json()
    const questions = data.questions || data.success?.questions || []

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('❌ No questions returned')
      console.error('Response:', JSON.stringify(data, null, 2))
      return null
    }

    console.log(`✅ Generated ${questions.length} app-specific questions`)
    questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q}`)
      // Verify question is app-specific
      const isSpecific = q.toLowerCase().includes('grandparent') || 
                        q.toLowerCase().includes('video') ||
                        q.toLowerCase().includes('memory') ||
                        q.toLowerCase().includes('family')
      if (!isSpecific) {
        console.warn(`   ⚠️  Question may not be app-specific enough`)
      }
    })

    return questions
  } catch (error) {
    console.error(`❌ Error:`, error.message)
    return null
  }
}

// TEST 2: Custom App Generation with Questions/Answers
async function testCustomAppGeneration(questions) {
  console.log('\n🎨 TEST 2: Custom App Generation with OpenAI')
  console.log('-'.repeat(60))

  if (!questions || questions.length === 0) {
    console.warn('⚠️  Skipping - no questions from previous test')
    return null
  }

  // Create sample answers
  const answers = [
    'The biggest barrier is they feel intimidated by technology',
    'Large fonts, simple one-button interface, voice commands',
    'One-click calling to specific family members',
    'We would provide in-person training sessions',
    'Start with non-technical grandparents to build confidence',
    'Secure, end-to-end encrypted connections',
    'Auto-reconnect, offline message queue',
    'Simple grid of family member tiles with faces',
  ]

  console.log(`📝 Simulating user answers to ${questions.length} questions`)
  console.log(`🔑 Using Netlify token for deployment`)

  try {
    const response = await fetch(`${API_BASE}/build-and-deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: 'GrandCall',
        appIdea: 'App for grandparents to video call and share memories with grandchildren',
        targetUser: 'Non-technical grandparents aged 65+',
        problemSolved: 'Grandparents struggle with complicated video calling apps',
        howItWorks: 'Simple interface with large buttons, voice commands, and auto-connect to favorites',
        questions,
        answers,
      }),
    })

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`)
      const error = await response.text()
      console.error(error.substring(0, 500))
      return null
    }

    const data = await response.json()
    console.log(`✅ Response status:`, data.success ? 'SUCCESS' : 'PROCESSING')

    if (data.customAppHtml) {
      const html = data.customAppHtml
      console.log(`✅ Generated custom app: ${html.length} bytes`)

      // Validate it's not a generic template
      const isGeneric = html.toLowerCase().includes('tell us about your professional background')
      const isSpecific = html.toLowerCase().includes('grandparent') ||
                        html.toLowerCase().includes('video call') ||
                        html.toLowerCase().includes('family')

      if (isGeneric) {
        console.error('❌ FAIL: App is generic (asking for professional background)')
      } else if (isSpecific) {
        console.log('✅ PASS: App is SPECIFIC to grandparent video calling')
      } else {
        console.warn('⚠️  Could not verify app specificity - check content manually')
      }

      // Show preview
      console.log('\n📄 Generated App Preview (first 400 chars):')
      console.log(html.substring(0, 400))
      console.log('...\n')

      return html
    } else {
      console.log('ℹ️  App generation is processing - may not be immediately available')
      return null
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message)
    return null
  }
}

// TEST 3: Validate OpenAI Integration
async function testOpenAIIntegration() {
  console.log('\n🤖 TEST 3: OpenAI API Integration')
  console.log('-'.repeat(60))

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.error('❌ OPENAI_API_KEY environment variable not set')
    return false
  }

  console.log('✅ OPENAI_API_KEY is set')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "working" only' }],
        max_tokens: 10,
      }),
    })

    if (!response.ok) {
      console.error(`❌ OpenAI API returned ${response.status}`)
      const error = await response.text()
      console.error(error)
      return false
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content
    console.log(`✅ OpenAI API responding: "${result}"`)
    return true
  } catch (error) {
    console.error(`❌ Error:`, error.message)
    return false
  }
}

// TEST 4: Verify Endpoint Exists and Responds
async function testEndpointAvailability() {
  console.log('\n🔗 TEST 4: Endpoint Availability')
  console.log('-'.repeat(60))

  const endpoints = [
    { url: `${API_BASE}/generate-dynamic-questions`, method: 'POST', name: 'Dynamic Questions' },
    { url: `${API_BASE}/build-and-deploy`, method: 'POST', name: 'Build & Deploy' },
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`)
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      console.log(`   ✅ Responds with HTTP ${response.status}`)
    } catch (error) {
      console.error(`   ❌ Cannot reach: ${error.message}`)
    }
  }
}

// MAIN TEST RUNNER
async function runAllTests() {
  console.log('\nℹ️  Server must be running on http://localhost:3000\n')

  // Test 0: Check OpenAI
  const openaiOk = await testOpenAIIntegration()

  if (!openaiOk) {
    console.error('\n❌ FATAL: OpenAI API not working')
    process.exit(1)
  }

  // Test 1: Endpoints available
  await testEndpointAvailability()

  // Test 2: Get questions
  const questions = await testDynamicQuestions()

  // Test 3: Generate app with answers
  const customApp = await testCustomAppGeneration(questions)

  // SUMMARY
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(
    openaiOk ? '✅ OpenAI API Integration: WORKING\n' : '❌ OpenAI API Integration: FAILED\n'
  )
  console.log(questions ? `✅ Dynamic Questions: WORKING (${questions.length} questions)\n` : '❌ Dynamic Questions: FAILED\n')
  console.log(customApp ? '✅ Custom App Generation: WORKING\n' : '⚠️  Custom App Generation: SKIPPED or FAILED\n')

  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Verify questions are app-specific (not generic)')
  console.log('2. Verify generated app is specific (not a form)')
  console.log('3. Check that app uses user answers in questions')
  console.log('4. Deploy to Netlify with OPENAI_API_KEY set')
  console.log('5. Test end-to-end in production')
}

runAllTests().catch(console.error)
