/**
 * Test Case 1: Login Form - Manual Button Click Required
 * 
 * Verifies that:
 * 1. Filling login form does NOT auto-submit
 * 2. User must explicitly click the Login button
 * 3. No automatic validation/submission occurs
 * 4. Form remains stable after field completion
 * 
 * Tags: @auth @login @no-auto-submit @critical
 */

import { test, expect } from '@playwright/test'
import {
  goToLoginPage,
  fillLoginForm,
  clickLoginButton,
  verifyLoginFormElements,
  waitForFormStability,
  isOnLoginPage,
  isRedirectedAfterLogin,
} from '../fixtures/auth-utils'
import { TEST_CONFIG } from '../config'

test.describe('Test Case 1: Login Requires Manual Button Click', () => {
  test('should NOT auto-submit when login form is filled', async ({
    page,
  }) => {
    // STEP 1: Navigate to login page
    await goToLoginPage(page)

    // STEP 2: Verify login form is present and visible
    await verifyLoginFormElements(page)

    // STEP 3: Fill in login form (but don't click button)
    await fillLoginForm(page, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password)

    // STEP 4: CRITICAL - Wait and verify NO auto-submission occurs
    // If form auto-submits, this will throw an error
    await test.step('wait for form stability (no auto-submit)', async () => {
      await waitForFormStability(page)
    })

    // STEP 5: Verify we're still on login page (form didn't submit)
    const stillOnLoginPage = await isOnLoginPage(page)
    await expect(stillOnLoginPage).toBe(true)

    // STEP 6: Verify login button is still visible and clickable
    const loginButton = page.locator(TEST_CONFIG.selectors.loginButton)
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toBeEnabled()

    // STEP 7: Verify form fields still contain our values (not cleared)
    const emailInput = page.locator(TEST_CONFIG.selectors.emailInput).first()
    const passwordInput = page.locator(TEST_CONFIG.selectors.passwordInput).first()
    
    await expect(emailInput).toHaveValue(TEST_CONFIG.testUser.email)
    await expect(passwordInput).toHaveValue(TEST_CONFIG.testUser.password)
  })

  test('should submit form only when Login button is clicked', async ({
    page,
  }) => {
    // STEP 1: Navigate to login page
    await goToLoginPage(page)

    // STEP 2: Fill login form
    await fillLoginForm(page, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password)

    // STEP 3: Verify form is stable (no auto-submit)
    await waitForFormStability(page)

    // STEP 4: NOW - Click the Login button
    await test.step('click Login button', async () => {
      await clickLoginButton(page)
    })

    // STEP 5: Wait for navigation after clicking button
    await page.waitForLoadState('networkidle', {
      timeout: TEST_CONFIG.timeouts.navigationTimeout,
    })

    // STEP 6: Verify form submission occurred and page changed
    // (either error message appears or redirect happens)
    await test.step('verify form submission result', async () => {
      // Either we get an error message (invalid credentials) OR we're redirected
      const isRedirected = await isRedirectedAfterLogin(page)
      const errorMessageExists = await page
        .locator('[class*="error"], [class*="red"]')
        .count()
        .then((count) => count > 0)

      const formSuccessfullySubmitted = isRedirected || errorMessageExists
      await expect(formSuccessfullySubmitted).toBe(true)
    })
  })

  test('should prevent browser autocomplete from submitting form', async ({
    page,
  }) => {
    // STEP 1: Navigate to login page
    await goToLoginPage(page)

    // STEP 2: Verify login form elements have autocomplete disabled
    const emailInput = page.locator(TEST_CONFIG.selectors.emailInput).first()
    const passwordInput = page.locator(TEST_CONFIG.selectors.passwordInput).first()

    // Check for autocomplete="off" attribute
    const emailAutoComplete = await emailInput.getAttribute('autocomplete')
    const passwordAutoComplete = await passwordInput.getAttribute('autocomplete')
    const emailDataLpIgnore = await emailInput.getAttribute('data-lpignore')
    const passwordDataLpIgnore = await passwordInput.getAttribute('data-lpignore')

    await test.step('verify autocomplete prevention attributes', async () => {
      // Should have autocomplete="off"
      await expect(emailAutoComplete).toBe('off')
      await expect(passwordAutoComplete).toBe('off')

      // Should have data-lpignore to prevent password managers
      await expect(emailDataLpIgnore).toBe('true')
      await expect(passwordDataLpIgnore).toBe('true')
    })

    // STEP 3: Fill in credentials
    await fillLoginForm(page, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password)

    // STEP 4: Verify no auto-submit happens
    await waitForFormStability(page)

    // STEP 5: Confirm still on login page
    await expect(await isOnLoginPage(page)).toBe(true)
  })

  test('should keep login form visible until button is explicitly clicked', async ({
    page,
  }) => {
    // STEP 1: Navigate to login page
    await goToLoginPage(page)

    // STEP 2: Get reference to login form
    const loginForm = page.locator('form').first()
    await expect(loginForm).toBeVisible()

    // STEP 3: Fill form
    await fillLoginForm(page, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password)

    // STEP 4: Multiple checks - form should remain visible
    for (let i = 0; i < 5; i++) {
      await test.step(`check form visibility #${i + 1}`, async () => {
        await expect(loginForm).toBeVisible()
        await page.waitForTimeout(500)
      })
    }

    // STEP 5: Verify not redirected
    const isStillOnLoginPage = await isOnLoginPage(page)
    await expect(isStillOnLoginPage).toBe(true)
  })
})
