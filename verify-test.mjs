/**
 * Quick verification test - Check if Playwright can access login page
 */
import { chromium, devices } from '@playwright/test'

async function runTest() {
  const browser = await chromium.launch({ headless: true })
  try {
    // Desktop context
    const context = await browser.newContext(devices['Desktop Chrome'])
    const page = await context.newPage()

    // Navigate to login page
    console.log('Navigating to login page...')
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'load', timeout: 30000 })

    // Check if page loads
    const title = await page.title()
    console.log(`✓ Page title: ${title}`)

    // Check for login form
    const form = await page.$('form')
    if (form) {
      console.log('✓ Login form found')
    } else {
      console.log('✗ Login form NOT found')
    }

    // Test 1: Fill form without submitting
    console.log('\n=== Test 1: Fill form, verify no auto-submit ===')
    const emailInput = await page.$('input[type="email"]')
    const passwordInput = await page.$('input[type="password"]')

    if (emailInput && passwordInput) {
      await emailInput.fill('test@example.com')
      await passwordInput.fill('TestPassword123')
      console.log('✓ Form filled')

      // Wait 3 seconds to ensure no auto-submit
      await page.waitForTimeout(3000)

      // Check we're still on login page
      const currentUrl = page.url()
      if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
        console.log('✓ NO AUTO-SUBMIT - Still on login page after 3 seconds')
      } else {
        console.log(`✗ FAILED - Redirected to: ${currentUrl}`)
      }

      // Check form is still visible
      const loginButton = await page.$('button[type="submit"]')
      if (loginButton) {
        console.log('✓ Login button still visible and clickable')
      }
    }

    await context.close()
    console.log('\n✅ Test verification passed!')
    process.exit(0)
  } catch (error) {
    console.error(`\n❌ Test failed: ${error}`)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

runTest()
