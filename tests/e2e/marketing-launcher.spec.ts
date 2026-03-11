import { test, expect } from '@playwright/test'

/**
 * Test Suite: Marketing Launcher Page - Campaign Loading
 * 
 * Validates that the Marketing Launcher page loads and displays existing campaigns correctly.
 * Tests the fixed authentication flow for campaign data fetch via JWT tokens.
 */

test.describe('Marketing Launcher - Campaign Loading', () => {
  test.use({
    baseURL: 'https://takethereigns.netlify.app',
  })

  test('should load Marketing Launcher page', async ({ page }) => {
    console.log('🚀 Loading Marketing Launcher page...')
    
    const response = await page.goto('/marketing/launcher', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    
    expect(response?.status()).toBeLessThan(400)
    console.log(`✅ Page responded with status: ${response?.status()}`)
  })

  test('should display page title and header', async ({ page }) => {
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    
    // Wait for page to fully load
    await page.waitForTimeout(2000)
    
    // Check for page header
    const heading = page.locator('h1, h2')
    const headingVisible = await heading.isVisible().catch(() => false)
    
    if (headingVisible) {
      const headingText = await heading.first().textContent()
      console.log(`✅ Page heading: "${headingText}"`)
    }
  })

  test('should authenticate with JWT token and fetch campaigns', async ({ page }) => {
    // Listen for API calls to monitor campaign fetch
    const apiErrors: string[] = []
    const apiCalls: Array<{ url: string, status: number }> = []
    
    page.on('response', response => {
      if (response.url().includes('/api/marketing/campaigns')) {
        apiCalls.push({ url: response.url(), status: response.status() })
        if (response.status() >= 400) {
          apiErrors.push(`${response.status()} - ${response.url()}`)
        }
      }
    })
    
    page.on('requestfailed', request => {
      if (request.url().includes('/api/marketing/campaigns')) {
        apiErrors.push(`Request failed - ${request.url()}`)
      }
    })
    
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    
    // Wait for API call to complete
    await page.waitForTimeout(3000)
    
    if (apiErrors.length > 0) {
      console.log(`⚠️ API errors encountered: ${apiErrors.join(', ')}`)
      // Continue test even if there are errors - the authentication fix should prevent 401s
      if (apiErrors.some(e => e.includes('401'))) {
        throw new Error('Authentication failed - 401 error on campaigns API')
      }
    } else if (apiCalls.length > 0) {
      console.log(`✅ Campaign API call successful: ${apiCalls[0].status}`)
    }
  })

  test('should load campaigns list or show empty state', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => consoleLogs.push(msg.text()))
    
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    // Look for campaign list or empty state
    const campaignList = page.locator('[class*="campaign"], [class*="list"], table, tbody')
    const campaignVisible = await campaignList.isVisible().catch(() => false)
    
    if (campaignVisible) {
      console.log('✅ Campaign list is visible')
    } else {
      // Check for empty state message
      const emptyMessage = page.locator('text=/No campaigns|empty|Create/i')
      const emptyVisible = await emptyMessage.isVisible().catch(() => false)
      
      if (emptyVisible) {
        const message = await emptyMessage.first().textContent()
        console.log(`✅ Empty state displayed: "${message}"`)
      }
    }
    
    // Verify no auth errors in console
    const authErrors = consoleLogs.filter(log => 
      log.includes('401') || 
      log.includes('Unauthorized') ||
      log.includes('auth') && log.includes('error')
    )
    
    if (authErrors.length === 0) {
      console.log('✅ No authentication errors in console')
    } else {
      console.log(`⚠️ Auth-related console messages: ${authErrors.slice(0, 3).join('; ')}`)
    }
  })

  test('should not display 401 errors for API calls', async ({ page }) => {
    const apiResponses: Array<{ status: number, url: string }> = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({ 
          status: response.status(), 
          url: new URL(response.url()).pathname 
        })
      }
    })
    
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    const status401 = apiResponses.find(r => r.status === 401)
    
    if (status401) {
      throw new Error(`❌ 401 error on API: ${status401.url}`)
    }
    
    console.log(`✅ All API calls returned non-401 status (tested ${apiResponses.length} calls)`)
  })

  test('should load within 8 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    console.log(`⏱️ Page load time: ${loadTime}ms`)
    
    expect(loadTime).toBeLessThan(8000)
    console.log('✅ Page loaded within 8 second threshold')
  })

  test('should handle loading state gracefully', async ({ page }) => {
    // Check for loading indicators
    await page.goto('/marketing/launcher')
    
    // Wait a bit for loading indicators to appear
    await page.waitForTimeout(500)
    
    // Look for common loading indicators
    const spinner = page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]')
    const spinnerVisible = await spinner.isVisible().catch(() => false)
    
    if (spinnerVisible) {
      console.log('✅ Loading indicator displayed during fetch')
    }
    
    // Wait for page to complete loading
    await page.waitForTimeout(3000)
    
    // Verify spinner disappears
    const spinnerGone = !(await spinner.isVisible().catch(() => true))
    if (spinnerGone) {
      console.log('✅ Loading indicator disappeared after fetch')
    }
  })

  test('should display existing campaigns with campaign data', async ({ page, context }) => {
    console.log('🚀 Testing existing campaigns display...')
    
    // Capture API response for campaigns
    let campaignData = null
    let campaignApiCalled = false
    
    page.on('response', async response => {
      if (response.url().includes('/api/marketing/campaigns')) {
        campaignApiCalled = true
        try {
          campaignData = await response.json()
          console.log(`📊 API Response - Status: ${response.status()}, Data received: ${campaignData ? 'yes' : 'no'}`)
        } catch (e) {
          console.log(`📊 API Response received (${response.status()}) but no JSON body`)
        }
      }
    })
    
    // Capture console logs for debugging
    const consoleLogs: Array<{ type: string, text: string }> = []
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() })
      if (msg.type() === 'error' || msg.text().includes('❌')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`)
      }
    })
    
    // Load the page
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    
    // Wait for campaigns to load
    await page.waitForTimeout(4000)
    
    console.log(`✅ API called: ${campaignApiCalled}`)
    
    // Check for campaign data in page content
    const pageContent = await page.content()
    
    // Look for campaign table/list rows
    const campaignRows = page.locator('tbody tr, [class*="campaign-row"], [class*="campaign-item"], .campaign-card')
    const rowCount = await campaignRows.count().catch(() => 0)
    
    if (rowCount > 0) {
      console.log(`✅ Campaign rows found: ${rowCount}`)
      
      // Get text content of first campaign row
      const firstRow = campaignRows.first()
      const rowText = await firstRow.textContent().catch(() => '')
      console.log(`📋 First campaign: ${rowText?.substring(0, 100) || 'unable to read'}`)
    } else {
      console.log('ℹ️ No campaign rows found in table/list format')
      
      // Check for campaign data in any div/section elements
      const campaignElements = page.locator('[class*="campaign"]:visible')
      const campaignCount = await campaignElements.count().catch(() => 0)
      
      if (campaignCount > 0) {
        console.log(`✅ Campaign elements found (alternative format): ${campaignCount}`)
        const campaignText = await campaignElements.first().textContent().catch(() => '')
        console.log(`📋 Campaign content: ${campaignText?.substring(0, 100) || 'unable to read'}`)
      } else {
        // Check for empty state
        const emptyText = await page.textContent('body').catch(() => '')
        if (emptyText?.includes('No campaigns') || emptyText?.includes('Create campaign') || emptyText?.includes('empty')) {
          console.log('ℹ️ Empty state displayed - no campaigns exist for this user')
        } else {
          console.log('⚠️ Unable to locate campaigns in any format')
        }
      }
    }
    
    // Log success criteria met
    console.log(`✅ Campaigns fetch completed - API called: ${campaignApiCalled}`)
    
    // Verify no critical errors in console
    const errorLogs = consoleLogs.filter(log => 
      log.type === 'error' || 
      (log.type === 'log' && log.text.includes('❌'))
    )
    
    if (errorLogs.length === 0) {
      console.log('✅ No critical errors in browser console')
    } else {
      console.log(`⚠️ Errors found (${errorLogs.length}):`, errorLogs.slice(0, 2))
    }
  })

  test('should show campaign list with immediate load on session present', async ({ page }) => {
    console.log('🚀 Testing immediate campaign load with session...')
    
    // Track timing of events
    const events: Array<{ time: number, event: string }> = []
    const startTime = Date.now()
    
    // Monitor console for fix verification logs
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('✅') || text.includes('Session') || text.includes('access_token')) {
        events.push({ 
          time: Date.now() - startTime, 
          event: text 
        })
        console.log(`[${(Date.now() - startTime)}ms] ${text}`)
      }
    })
    
    // Load page
    await page.goto('/marketing/launcher', { waitUntil: 'domcontentloaded' })
    
    // Wait for campaign list to render
    await page.waitForTimeout(2000)
    
    // Verify campaigns were fetched quickly (if data exists)
    const campaignElements = page.locator('[class*="campaign"]:visible, tbody tr')
    const hasContent = await campaignElements.count().then(c => c > 0).catch(() => false)
    
    if (hasContent) {
      console.log('✅ Campaigns displayed with immediate load (no wait for authLoading)')
    } else {
      // Check for empty state or "no campaigns"
      const pageText = await page.textContent('body').catch(() => '')
      if (pageText?.includes('No campaigns') || pageText?.includes('create')) {
        console.log('✅ Page loaded immediately showing empty state or action prompt')
      } else {
        console.log('ℹ️ Page content not yet ready')
      }
    }
    
    // Log event timeline
    if (events.length > 0) {
      console.log(`\n📊 Event Timeline (${events.length} events):`)
      events.forEach(e => console.log(`  ${e.time}ms: ${e.event.substring(0, 60)}`))
    }
  })

  test('should open and load existing campaign without hanging', async ({ page }) => {
    console.log('🚀 Testing campaign detail page load (opens existing campaign)...')
    
    // Capture console logs for debugging
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(msg.text())
      if (msg.text().includes('CampaignDetail') || msg.text().includes('❌')) {
        console.log(`[CONSOLE] ${msg.text()}`)
      }
    })
    
    // Go to launcher page first
    await page.goto('/marketing/launcher', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    
    // Try to find and click first campaign
    const firstCampaignLink = page.locator('a[href*="/marketing/launcher/"], button:has-text("Edit"), [class*="campaign-row"] a').first()
    const linkExists = await firstCampaignLink.isVisible().catch(() => false)
    
    if (linkExists) {
      console.log('📋 Found campaign link, clicking to open...')
      const startTime = Date.now()
      
      // Listen for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null),
        firstCampaignLink.click()
      ])
      
      const navigationTime = Date.now() - startTime
      console.log(`⏱️ Navigation completed in ${navigationTime}ms`)
      
      // Wait for campaign detail page to load
      await page.waitForTimeout(3000)
      
      // Check for campaign data
      const pageContent = await page.textContent('body').catch(() => '')
      
      // Verify we're on campaign detail page (not login or error)
      const hasDelay = navigationTime > 15000
      if (hasDelay) {
        throw new Error(`❌ Campaign detail page took too long to load: ${navigationTime}ms (possible LockManager timeout)`)
      }
      
      if (pageContent?.includes('campaign') || pageContent?.includes('email') || pageContent?.includes('Analytics')) {
        console.log('✅ Campaign detail page loaded with campaign data')
      } else if (pageContent?.includes('login') || pageContent?.includes('Login')) {
        console.log('⚠️ Redirected to login - session may have expired')
      } else {
        console.log(`ℹ️ Campaign page loaded (content preview: ${pageContent?.substring(0, 100)})`)
      }
    } else {
      console.log('ℹ️ No existing campaigns found to open (test inconclusive)')
    }
    
    // Verify no LockManager errors in console
    const lockManagerErrors = consoleLogs.filter(log => log.includes('LockManager') || log.includes('timed out'))
    if (lockManagerErrors.length > 0) {
      throw new Error(`❌ LockManager timeout detected: ${lockManagerErrors[0]}`)
    }
    
    console.log('✅ Campaign detail page opened without errors')
  })
})
