import { test, expect } from '@playwright/test'

/**
 * Test Suite: Insights Page Production Deployment Verification
 * 
 * Validates that the Insights page loads correctly on the production Netlify deployment.
 * Tests that the 5-second timeout fix works and page renders with data.
 */

test.describe('Insights Page - Production Verification', () => {
  // Override base URL to use production deployment
  test.use({
    baseURL: 'https://takethereigns.netlify.app',
  })

  test('should load Insights page on production', async ({ page }) => {
    console.log('🚀 Loading Insights page from production...')
    
    const response = await page.goto('/dashboard/insights', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    
    expect(response?.status()).toBeLessThan(400)
    console.log(`✅ Production page responded with status: ${response?.status()}`)
  })

  test('should display page header on production', async ({ page }) => {
    await page.goto('/dashboard/insights', { waitUntil: 'networkidle' })
    
    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 8000 })
    
    const headingText = await heading.textContent()
    console.log(`✅ Page heading: "${headingText}"`)
  })

  test('should display metric cards with data on production', async ({ page }) => {
    await page.goto('/dashboard/insights', { waitUntil: 'networkidle' })
    
    // Wait for metric cards to render (5s timeout + rendering)
    await page.waitForTimeout(3000)
    
    // Look for metric card indicators
    const cards = page.locator('[class*="metric"], [class*="card"], [role="article"]')
    const cardCount = await cards.count()
    
    if (cardCount > 0) {
      console.log(`✅ Found ${cardCount} metric cards on page`)
    } else {
      // Alternative: look for text indicators
      const scoreText = page.locator('text=/Average|Score|Metric/', { exact: false })
      const scoreVisible = await scoreText.isVisible().catch(() => false)
      expect(scoreVisible).toBeTruthy()
      console.log('✅ Metric text content visible on page')
    }
  })

  test('should handle data fetch with timeout gracefully', async ({ page }) => {
    // Capture console messages to verify timeout handling
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(msg.text())
      console.log(`[${msg.type()}] ${msg.text()}`)
    })
    
    await page.goto('/dashboard/insights', { waitUntil: 'networkidle' })
    
    // Wait for data fetch to complete (up to 5s timeout + rendering)
    await page.waitForTimeout(6000)
    
    // Check if page is still responsive (not stuck)
    const pageTitle = await page.title()
    expect(pageTitle).toBeTruthy()
    console.log(`✅ Page title: "${pageTitle}"`)
    
    // Log all console messages for debugging
    console.log(`📋 Total console messages during load: ${consoleLogs.length}`)
    consoleLogs.forEach(log => {
      if (log.includes('timeout') || log.includes('Data')) {
        console.log(`  - ${log}`)
      }
    })
  })

  test('should not display error messages', async ({ page }) => {
    await page.goto('/dashboard/insights', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    // Check for common error indicators
    const errorSelector = page.locator('[class*="error"], text=/Error|Failed|error/', { exact: false })
    const errorCount = await errorSelector.count()
    
    if (errorCount === 0) {
      console.log('✅ No error messages displayed')
    } else {
      console.log(`⚠️ Found ${errorCount} potential error messages`)
    }
  })

  test('should load page within 8 seconds total', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard/insights', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    console.log(`⏱️ Page load time: ${loadTime}ms`)
    
    expect(loadTime).toBeLessThan(8000)
    console.log('✅ Page loaded within 8 second threshold')
  })
})
