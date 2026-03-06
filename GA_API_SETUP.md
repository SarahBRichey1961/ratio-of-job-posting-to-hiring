# Google Analytics API Integration Setup

The Insights page now displays **real Google Analytics data** instead of mock data. To complete the setup:

## 1. Install Dependencies

```bash
npm install @google-analytics/data
```

## 2. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the **Google Analytics Data API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google Analytics Data API"
   - Click **Enable**
4. Create a service account:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **Service Account**
   - Fill in the details and create
   - Click the service account email to open it
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Select **JSON** and download the file

## 3. Add Service Account to Google Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon)
3. Under **Account**, click **Account Access Management**
4. Click the **+** button to add a user
5. Paste the service account email (from the downloaded JSON file)
6. Give it **Editor** access
7. Click **Invite**

## 4. Set Environment Variable

Add the service account credentials to your `.env.local`:

```bash
# Copy the entire JSON key file content and paste it as a single-line string:
GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account","project_id":"your-project",...}'
```

**Or** base64 encode it for safety:
```bash
# Encode the JSON file
cat path/to/service-account-key.json | base64 -w 0

# Add to .env.local
GOOGLE_APPLICATION_CREDENTIALS='base64_encoded_string_here'
```

Then decode it in the API route (update `src/pages/api/analytics/metrics.ts` if using base64):

```typescript
const credentialsJson = Buffer.from(credentials, 'base64').toString('utf-8')
const credentialsObj = JSON.parse(credentialsJson)
```

## 5. Property ID

The API endpoint is configured to use Property ID `527402328`. Verify this matches your Google Analytics 4 property:

1. Go to Google Analytics → **Admin** → **Property Settings**
2. Look for "Property ID" (not Measurement ID)
3. Update `/api/analytics/metrics.ts` line 38 if needed

## How It Works

### Frontend Flow:
1. `TrafficMetrics.tsx` component mounts on the Insights page
2. Calls `/api/analytics/metrics` endpoint
3. Displays real GA data in charts and tables
4. Auto-refreshes on component mount (reload page for fresh data)

### API Endpoint (`/api/analytics/metrics`):
- Authenticates with Google Analytics using service account credentials
- Queries last 30 days of data
- Calculates traffic trends comparing to previous 30-day period
- Returns:
  - Total visitors & page views
  - Average session duration
  - Bounce rate
  - Top 10 pages
  - Page-specific breakdown (Comparison, Insights, Hub, etc.)

## Troubleshooting

### "No credentials found"
- Verify `GOOGLE_APPLICATION_CREDENTIALS` is set in `.env.local`
- Restart dev server after adding environment variable: `npm run dev`
- Check that the service account has access to the GA property

### "Property not found"
- Verify Property ID in `src/pages/api/analytics/metrics.ts` line 38
- Ensure service account has Editor access to the GA property
- Check that data is actually being sent to GA (check GA Real-time view)

### No data showing
- Google Analytics may take 24-48 hours to populate historical data
- Check [Analytics Real-time Overview](https://analytics.google.com/analytics/web/#/p/527402328/realtime/overview) to verify data is being tracked
- If Real-time shows data but API returns empty: the query parameters might need adjustment

### Import Error: "@google-analytics/data"
- Run: `npm install @google-analytics/data`
- Restart dev server

## Optional: Frontend Caching

To avoid hitting the GA API on every page load, add caching to the frontend:

```typescript
// In TrafficMetrics.tsx, add cache check:
const cacheKey = 'ga_metrics_cache'
const cached = sessionStorage.getItem(cacheKey)

if (cached && Date.now() - JSON.parse(cached).timestamp < 300000) {
  // Use cached data (5 minute cache)
  setTrafficData(JSON.parse(cached).data)
  setLoading(false)
  return
}
```

## What's Displayed

The Insights page now shows:
- ✅ **Real total visitors** (from GA)
- ✅ **Real page views** (from GA)
- ✅ **Real session duration** (from GA)
- ✅ **Real bounce rate** (from GA)
- ✅ **Top pages** table (from GA)
- ✅ **Traffic by page** breakdown (from GA)
- ✅ **Traffic trends** (30-day comparison, from GA)
- ✅ **Actionable insights** (auto-generated from data)

## Files Modified

- `src/pages/api/analytics/metrics.ts` - NEW: API endpoint for GA data
- `src/components/TrafficMetrics.tsx` - UPDATED: Fetch real data instead of mock
- `package.json` - UPDATED: Added `@google-analytics/data` dependency
