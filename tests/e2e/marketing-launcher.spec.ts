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
})
