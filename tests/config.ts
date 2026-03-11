/**
 * Test Configuration and Test Data
 * Centralized configuration for all Test Harness tests
 */

export const TEST_CONFIG = {
  // Test User Credentials
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'Test123456!',
  },
  
  // Test Timeouts
  timeouts: {
    // Time to wait after form fill to ensure no auto-submit happens (ms)
    autoSubmitWaitTime: 3000,
    // Default wait for element to appear (ms)
    elementWaitTime: 5000,
    // Navigation timeout (ms)
    navigationTimeout: 30000,
  },

  // Page URLs
  pages: {
    login: '/auth/login',
    loginAlt: '/login',
    hub: '/hub',
    dashboard: '/dashboard',
    signup: '/auth/signup',
  },

  // Selectors
  selectors: {
    // Login form
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"]',
    
    // Error/Success messages
    errorMessage: '[class*="error"], [class*="red"]',
    successMessage: '[class*="success"], [class*="green"]',
    
    // Navigation
    backButton: 'a[href*="back"], button:has-text("← Back")',
  },

  // Test Tags
  tags: {
    auth: '@auth',
    login: '@login',
    noAutoSubmit: '@no-auto-submit',
    critical: '@critical',
  },
}

export type TestConfig = typeof TEST_CONFIG
