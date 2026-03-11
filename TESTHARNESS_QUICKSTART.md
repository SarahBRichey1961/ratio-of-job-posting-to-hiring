# Test Harness Quick Start

## One-Time Setup (First Time Only)

```bash
# 1. Install Playwright browsers (one time)
npx playwright install

# 2. (Optional) Create local env file for test credentials
cp tests/.env.example tests/.env.local

# 3. Edit with your test credentials
# vi tests/.env.local
```

## Running Tests

### Development Environment

**Option 1: Run dev server separately**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests (in another terminal)
npm test
```

**Option 2: Let Playwright start the server**
```bash
# Playwright will automatically start npm run dev
npm test
```

### Running Specific Test Suites

```bash
# Run only login tests
npm run test:auth

# Run all tests
npm test

# Run tests with UI (interactive browser)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# View test report
npm run test:report
```

## First Run

On your first test run:

1. System will download Playwright browsers (~200MB)
2. Dev server will start automatically
3. Tests will execute in Chrome, Firefox, Safari (takes ~5-10 min)
4. HTML report will be generated at `playwright-report/index.html`

## What Gets Tested - Test Case 1

**Login Form - No Auto-Submit**

We verify:
✅ Filling email + password does NOT auto-submit
✅ Form stays on login page for 3 seconds after fill
✅ Login button must be clicked to submit
✅ Browser autocomplete doesn't trigger submit
✅ Form fields remain visible until button click

### Example Test Output

```
Login Requires Manual Button Click
  ✓ should NOT auto-submit when login form is filled (4.2s)
  ✓ should submit form only when Login button is clicked (5.1s)
  ✓ should prevent browser autocomplete from submitting form (3.8s)
  ✓ should keep login form visible until button is explicitly clicked (6.3s)

4 passed (19.4s)
```

## Viewing Results

### HTML Report
```bash
npm run test:report
```
Opens browser with:
- Test execution timeline
- Screenshots/videos on failure
- Detailed error messages
- Browser compatibility info

### Console Output
```bash
npm test
```
Shows real-time test progress and any failures.

## Test Configuration

Edit `tests/config.ts` to:
- Change test user credentials
- Adjust timeouts
- Change page URLs
- Update selectors

## Adding Test Credentials

For the first test run, you'll need a test account. Either:

1. **Use existing account** (if you have one):
   ```bash
   # Edit tests/.env.local
   TEST_USER_EMAIL=your-account@example.com
   TEST_USER_PASSWORD=your-password
   ```

2. **Create new test account** via signup
   - Visit http://localhost:3000/auth/signup
   - Create account with test credentials
   - Use those credentials in .env.local

## Troubleshooting

### Port 3000 is already in use
```bash
# Kill process on port 3000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Tests timeout
- Increase `autoSubmitWaitTime` in `tests/config.ts`
- Ensure dev server is responsive
- Check internet connection

### Cannot find test user
- Verify credentials in `tests/.env.local`
- Create new test account if needed
- Run signup test to confirm account works

## Next Steps

After verifying Test Case 1 passes:

1. **Add more test cases** (signup, dashboard, etc.)
2. **Set up CI/CD** (GitHub Actions already configured)
3. **Add test data fixtures** for repeatable testing
4. **Visual regression testing** (detect layout changes)
5. **Performance benchmarking** (measure page load times)

## Documentation

- [Full Test Harness Documentation](./tests/README.md)
- [Playwright Official Docs](https://playwright.dev)
- [Test Configuration Reference](./playwright.config.ts)

## Questions?

See `tests/README.md` for comprehensive documentation.
