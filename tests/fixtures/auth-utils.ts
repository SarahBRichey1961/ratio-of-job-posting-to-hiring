/**
 * Authentication Test Utilities
 * Common functions for authentication-related tests
 */

import { Page, expect } from '@playwright/test'
import { TEST_CONFIG } from '../config'

/**
 * Navigate to the login page
 */
export async function goToLoginPage(page: Page): Promise<void> {
  await page.goto(TEST_CONFIG.pages.login, {
    waitUntil: 'networkidle',
    timeout: TEST_CONFIG.timeouts.navigationTimeout,
  })
  
  // Verify login page is loaded
  await expect(page).toHaveTitle(/login/i)
}

/**
 * Fill in login form without submitting
 */
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  const emailInput = page.locator(TEST_CONFIG.selectors.emailInput).first()
  const passwordInput = page.locator(TEST_CONFIG.selectors.passwordInput).first()
  
  await emailInput.fill(email)
  await passwordInput.fill(password)
  
  // Verify form is filled
  await expect(emailInput).toHaveValue(email)
  await expect(passwordInput).toHaveValue(password)
}

/**
 * Click the login button
 */
export async function clickLoginButton(page: Page): Promise<void> {
  const loginButton = page.locator(TEST_CONFIG.selectors.loginButton)
  await expect(loginButton).toBeVisible()
  await loginButton.click()
}

/**
 * Get current page URL
 */
export async function getCurrentUrl(page: Page): Promise<string> {
  return page.url()
}

/**
 * Check if still on login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  const url = page.url()
  return (
    url.includes(TEST_CONFIG.pages.login) ||
    url.includes(TEST_CONFIG.pages.loginAlt)
  )
}

/**
 * Check if redirect happened to dashboard/hub
 */
export async function isRedirectedAfterLogin(page: Page): Promise<boolean> {
  const url = page.url()
  return (
    url.includes(TEST_CONFIG.pages.hub) ||
    url.includes(TEST_CONFIG.pages.dashboard)
  )
}

/**
 * Wait for login form to be stable (no auto-refresh)
 */
export async function waitForFormStability(page: Page): Promise<void> {
  // Wait for specified time to ensure no auto-submission occurs
  await page.waitForTimeout(TEST_CONFIG.timeouts.autoSubmitWaitTime)
  
  // Verify we're still on the login page
  const stillOnLoginPage = await isOnLoginPage(page)
  if (!stillOnLoginPage) {
    throw new Error(
      `Form auto-submitted! Expected to stay on login page but was redirected to ${page.url()}`
    )
  }
}

/**
 * Verify login form elements are present and visible
 */
export async function verifyLoginFormElements(page: Page): Promise<void> {
  const emailInput = page.locator(TEST_CONFIG.selectors.emailInput).first()
  const passwordInput = page.locator(TEST_CONFIG.selectors.passwordInput).first()
  const loginButton = page.locator(TEST_CONFIG.selectors.loginButton)
  
  await expect(emailInput).toBeVisible()
  await expect(passwordInput).toBeVisible()
  await expect(loginButton).toBeVisible()
}
