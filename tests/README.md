# Test Harness - Production Automated Tests

Comprehensive automated test suite for the Job Board Analytics platform using Playwright.

## Overview

The Test Harness is an automated test suite designed to verify critical user workflows and ensure production quality. It uses Playwright for end-to-end (E2E) testing with support for multiple browsers (Chrome, Firefox, Safari).

## Test Structure

```
tests/
├── e2e/                           # End-to-end test files
│   ├── login-no-auto-submit.spec.ts    # Test Case 1: Login form behavior
│   └── ...                              # Additional test cases
├── fixtures/                       # Shared test utilities
│   ├── auth-utils.ts              # Authentication helper functions
│   └── ...                         # Additional utilities
├── config.ts                       # Centralized test configuration
└── .env.example                    # Environment variable template

```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Running dev server OR Playwright will start it automatically

### Installation

1. Environment variables are already configured in `playwright.config.ts`
2. (Optional) Create `.env.local` in the `tests/` directory:
   ```bash
   cp tests/.env.example tests/.env.local
   ```

3. Update credentials in `.env.local` if needed:
   ```env
   TEST_USER_EMAIL=your-test-account@example.com
   TEST_USER_PASSWORD=your-password
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Run only login tests
npm run test:auth
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:ui
```
Opens an interactive browser window where you can run, debug, and watch tests in real-time.

### Run Tests in Debug Mode
```bash
npm run test:debug
```
Launches Playwright Inspector for step-by-step debugging.

### View Test Report
```bash
npm run test:report
```
Opens the HTML report of the last test run.

## Test Cases

### Test Case 1: Login Requires Manual Button Click

**File**: `tests/e2e/login-no-auto-submit.spec.ts`

**Purpose**: Verify that the login form requires explicit user action (clicking the Login button) and does NOT auto-submit or auto-validate.

**Test Scenarios**:

1. **Should NOT auto-submit when login form is filled**
   - Fills email and password
   - Waits 3 seconds to ensure no auto-submission
   - Verifies form remains visible and stable
   - Confirms button is still clickable

2. **Should submit form only when Login button is clicked**
   - Fills login form
   - Verifies form stability
   - Clicks Login button
   - Verifies form submission (error message or redirect)

3. **Should prevent browser autocomplete from submitting form**
   - Verifies `autocomplete="off"` attribute
   - Verifies `data-lpignore="true"` (prevents password managers)
   - Confirms no auto-submit after field fill
   - Ensures form remains on current page

4. **Should keep login form visible until button is explicitly clicked**
   - Fills form
   - Repeatedly checks form visibility (no redirects)
   - Confirms user stays on login page
   - Verifies button is still available

**What This Tests**:
- ✅ No auto-signin without explicit button click
- ✅ Browser password managers won't trigger submission
- ✅ Form fields don't trigger validation on blur
- ✅ Required user interaction before authentication

## Configuration

### Test Configuration (`tests/config.ts`)

Centralized configuration includes:

- **Test User Credentials**: Email and password for test accounts
- **Timeouts**: 
  - `autoSubmitWaitTime`: 3000ms - Wait time to detect auto-submit
  - `elementWaitTime`: 5000ms - Default element wait
  - `navigationTimeout`: 30000ms - Navigation timeout
- **Page URLs**: Login, signup, hub, dashboard paths
- **Selectors**: CSS selectors for form elements and messages
- **Tags**: Test categorization (@auth, @login, @no-auto-submit, @critical)

### Playwright Config (`playwright.config.ts`)

- **Test Directory**: `tests/e2e`
- **Browsers**: Chrome, Firefox, Safari (desktop)
- **Reporter**: HTML report
- **Dev Server**: Automatically starts Next.js on port 3000
- **Base URL**: Configurable via `PLAYWRIGHT_TEST_BASE_URL`

## Test Output

### HTML Report
After running tests, an HTML report is generated in `playwright-report/`:
```bash
npm run test:report
```

### Console Output
Tests print detailed progress to console with:
- Test name and file
- Pass/Fail status
- Execution time
- Error details (if failed)

### Screenshots & Traces
On test failure, Playwright captures:
- Screenshots of the page at failure point
- Video recording of the entire test
- Trace file for debugging

## Debugging Tests

### Using the UI Mode
```bash
npm run test:ui
```
- Step through tests one by one
- Inspect DOM elements
- View network requests
- Time travel through test execution

### Using Inspector
```bash
npm run test:debug
```
- Pause test execution
- Inspect page state
- Execute JavaScript in console

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Wait Strategies**: Use `waitForNavigation`, `waitForLoadState`, not arbitrary `setTimeout`
3. **Selectors**: Use stable, semantic selectors (not based on styling)
4. **Error Messages**: Include helpful context in assertions
5. **Cleanup**: Tests should leave no side effects

## Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Import utilities from `tests/fixtures/`
3. Use shared configuration from `tests/config.ts`
4. Add descriptive test names in `test.describe` blocks
5. Use `test.step()` for complex workflows

Example:
```typescript
import { test, expect } from '@playwright/test'
import { TEST_CONFIG } from '../config'

test.describe('Feature: My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.login)
    // Test steps...
  })
})
```

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Run Playwright Tests
  run: npm test
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Troubleshooting

### Tests timeout
- Increase `navigationTimeout` in `tests/config.ts`
- Verify dev server is running: `npm run dev`

### Cannot find selectors
- Run tests in UI mode: `npm run test:ui`
- Inspect elements in the browser
- Update selectors in `tests/config.ts`

### Port 3000 already in use
- Kill the process using port 3000
- Or configure different port in `playwright.config.ts`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Configuration](https://playwright.dev/docs/test-configuration)

## Next Steps

- [ ] Test Case 2: Form validation and error handling
- [ ] Test Case 3: Signup flow
- [ ] Test Case 4: Dashboard access and permissions
- [ ] Test Case 5: Manifesto creation and editing
- [ ] Performance benchmarking
- [ ] Visual regression testing
