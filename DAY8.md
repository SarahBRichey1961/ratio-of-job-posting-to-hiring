# Day 8: Build Data Pipeline

## Overview
Today we build the **orchestration and infrastructure** for the daily data pipeline. This is the foundation that coordinates all data collection, processing, and metric calculation—enabling the board's efficiency score to update daily.

**Architecture:** Modular pipeline with 5 phases
1. **Scraping Phase** - Run all configured scrapers
2. **Snapshots Phase** - Store raw data snapshots
3. **Lifespan Phase** - Calculate posting lifespans
4. **Repost Phase** - Detect reposts
5. **Metrics Phase** - Compute efficiency scores (Day 11)

## Key Components

### 1. `src/lib/pipeline.ts`
Low-level pipeline job and data management.

**Key Functions:**
```typescript
// Job management
createPipelineJob(jobType, boardId?, boardName?): Promise<PipelineJob>
updatePipelineJobStatus(jobId, status, result?, error?): Promise<boolean>
getPendingJobs(): Promise<PipelineJob[]>

// Raw data snapshots
createRawDataSnapshot(snapshot): Promise<RawDataSnapshot>
getLatestSnapshot(jobBoardId): Promise<RawDataSnapshot>

// Pipeline runs
createPipelineRunLog(runId): Promise<PipelineRunLog>
updatePipelineRunStatus(runId, status, total, completed, failed, errors?)
getPipelineRunHistory(limit = 10): Promise<PipelineRunLog[]>

// Analytics
getPipelineStats(): Promise<{
  period, totalRuns, successfulRuns, totalJobs, jobSuccessRate, avgDurationSeconds
}>
```

**Data Structures:**

`PipelineJob`:
- `id`: UUID
- `jobType`: 'scrape' | 'normalize' | 'lifespan' | 'repost' | 'score'
- `boardId?`: number
- `boardName?`: string
- `status`: 'pending' | 'running' | 'completed' | 'failed'
- `startedAt?`: Date
- `completedAt?`: Date
- `error?`: string
- `result?`: any

`RawDataSnapshot`:
- `id`: UUID
- `jobBoardId`: number
- `boardName`: string
- `snapshotDate`: Date (when snapshot was taken)
- `postingCount`: number
- `newPostings`: number
- `activePostings`: number
- `disappearedPostings`: number
- `repostCount`: number
- `data`: {postings: any[], stats: any}

`PipelineRunLog`:
- `id`: UUID
- `runId`: string (unique identifier for this run)
- `startTime`: Date
- `endTime?`: Date
- `status`: 'running' | 'completed' | 'partial' | 'failed'
- `totalJobs`: number
- `completedJobs`: number
- `failedJobs`: number
- `jobs`: PipelineJob[]
- `errors`: string[]

### 2. `src/lib/pipelineOrchestrator.ts`
High-level pipeline orchestration and execution.

**Main Class:**
```typescript
class DataPipelineOrchestrator {
  constructor(runId?: string)
  async runPipeline(): Promise<{
    runId, status, totalJobs, completedJobs, failedJobs, duration, errors
  }>
}

// Export function for cron jobs
async function schedulePipelineRun(): Promise<any>
```

**Five-Phase Architecture:**

**Phase 1: Scraping** 
- For each enabled job board, create a 'scrape' job
- Run scraper for that board
- Record results: jobs_scraped, new_jobs
- Status: completed/failed

**Phase 2: Raw Snapshots**
- For each board, create a 'normalize' job
- Query all postings: count active, disappeared, reposts
- Store JSON snapshot with full posting details
- Status: completed/failed

**Phase 3: Lifespan Tracking**
- Create single 'lifespan' job
- Call `bulkUpdateAllLifespans()` from Day 6
- Recalculate `lifespan_days` for all postings
- Status: completed/failed

**Phase 4: Repost Detection**
- Create single 'repost' job
- Call `bulkDetectAllReposts()` from Day 7
- Find and cluster reposts across all boards
- Status: completed/failed

**Phase 5: Metrics**
- Create single 'score' job
- Placeholder for efficiency scoring (Day 11)
- Status: completed/failed

**Error Handling:**
- Each job runs independently
- If a job fails, continue to next job
- Track errors in `pipeline_runs.errors` array
- Final status: 'completed' (all pass), 'partial' (some fail), 'failed' (all fail)

### 3. `src/pages/api/pipeline.ts`
REST API for pipeline control and monitoring.

**Endpoints:**

`GET /api/pipeline?action=pending`
- Get all jobs waiting to run
- Response: `{success, data: PipelineJob[]}`

`GET /api/pipeline?action=history`
- Get last 10 pipeline runs
- Response: `{success, data: PipelineRunLog[]}`

`GET /api/pipeline?action=stats`
- Get statistics for last 7 days
- Response: `{success, data: {totalRuns, successRate, totalJobs, avgDurationSeconds, ...}}`

`POST /api/pipeline`
- `{action: "run"}` - Trigger immediate pipeline run
- Response: `{success, data: PipelineRunLog}`

### 4. `src/components/PipelineMonitor.tsx`
React components for real-time pipeline monitoring.

**Components:**

`<PipelineStats stats={stats} />`
- Overview card: total runs, success rate, job counts
- Last 7 days statistics

`<PipelineRunDisplay run={run} />`
- Individual run details
- Status badge, job counts, duration
- Error list if failed

`<PipelineHistory runs={runs} isLoading onRefresh onRunNow />`
- Chronological list of recent runs
- Refresh and "Run Now" buttons
- Loading state

`<PipelineMonitor refreshInterval={30000} />`
- Complete monitoring dashboard
- Auto-refreshes at interval (default 30s)
- Combines all above components

### 5. `scripts/runPipeline.ts`
Command-line tool for testing and manual runs.

**Usage:**
```bash
npx ts-node scripts/runPipeline.ts

# Output:
# ════════════════════════════════════════════════════════════════════════════════
# DATA PIPELINE EXECUTION
# ════════════════════════════════════════════════════════════════════════════════
# 
# ────────────────────────────────────────────────────────────────────────────────
# PIPELINE RESULT
# ────────────────────────────────────────────────────────────────────────────────
#
# Run ID: run-1708316640000
# Status: COMPLETED
#
# 📊 JOB SUMMARY
#   Total Jobs: 34
#   Completed: 34
#   Failed: 0
#
# ✅ Success Rate: 100%
#
# ⏱️  Duration: 12.34s
#
# ════════════════════════════════════════════════════════════════════════════════
# ✅ Pipeline completed successfully!
# ════════════════════════════════════════════════════════════════════════════════
```

### 6. `supabase/migrations/004_pipeline_infrastructure.sql`
Database schema for pipeline management.

**Tables:**

`pipeline_jobs`
- `id` UUID primary key
- `job_type` VARCHAR(50) - Type of job
- `job_board_id` INTEGER FK - Target board (nullable)
- `board_name` VARCHAR(255)
- `status` VARCHAR(20) - Current status
- `started_at` TIMESTAMP
- `completed_at` TIMESTAMP
- `result` JSONB - Job result data
- `error` TEXT - Error message if failed
- Indexes: status, board_id, created_at

`raw_data_snapshots`
- `id` UUID primary key
- `job_board_id` INTEGER FK
- `board_name` VARCHAR(255)
- `snapshot_date` TIMESTAMP - When snapshot was taken (usually daily 2 AM)
- `posting_count` INTEGER
- `new_postings` INTEGER
- `active_postings` INTEGER
- `disappeared_postings` INTEGER
- `repost_count` INTEGER
- `data` JSONB - Full snapshot JSON
- Unique constraint: (job_board_id, snapshot_date)
- Indexes: board_id, snapshot_date, board_date

`pipeline_runs`
- `id` UUID primary key
- `run_id` VARCHAR(255) UNIQUE - User-friendly run identifier
- `status` VARCHAR(20) - 'running'/'completed'/'partial'/'failed'
- `start_time` TIMESTAMP
- `end_time` TIMESTAMP
- `total_jobs` INTEGER
- `completed_jobs` INTEGER
- `failed_jobs` INTEGER
- `jobs` JSONB[] - Array of job results
- `errors` TEXT[] - Array of error messages
- Indexes: status, start_time, run_id

**Views:**
- `pipeline_stats` - Overall statistics (success rate, job counts, duration)
- `pipeline_schedule` - Daily schedule (runs per day, success rates)
- `pipeline_job_stats` - Job-type statistics (by job type success rate)

## Workflow: How the Pipeline Works

### Daily Execution (e.g., 2 AM UTC)
```
1. TRIGGER (via cron, AWS Lambda, Vercel Cron, Node.js schedule)
   → Call POST /api/pipeline {action: "run"}

2. INITIALIZATION (0.1s)
   → Create run_id: "run-1708316640000"
   → Create pipeline_runs record
   → Create phase jobs: scrape (×33), normalize (×33), lifespan, repost, score

3. PHASE 1: SCRAPING (2-5 minutes)
   → For each of 33 boards:
     • Create 'scrape' job
     • Fetch postings from board site
     • Parse and normalize titles
     • Save to job_postings table
     • Record result: {jobsScraped: 150, newJobs: 12}
   → Mark job completed/failed

4. PHASE 2: RAW SNAPSHOTS (0.5-1 minute)
   → For each of 33 boards:
     • Create 'normalize' job
     • Query: COUNT(*), active, disappeared from job_postings
     • Store JSON snapshot with full details
     • Record: {snapshotDate: "2026-02-18", postingCount: 487, ...}

5. PHASE 3: LIFESPAN (1-2 minutes)
   → Create single 'lifespan' job
   → For all postings: calculate last_seen - first_seen
   → Update lifespan_days column
   → Result: {updated: 2500, failed: 3}

6. PHASE 4: REPOSTS (1-3 minutes)
   → Create single 'repost' job
   → For each board: find matching postings by URL/title/similarity
   → Cluster reposts together
   → Update repost_count in job_postings
   → Result: {detected: 156, updated: 156, failed: 0}

7. PHASE 5: METRICS (0.5-1 minute)
   → Create single 'score' job
   → Placeholder for scoring (Day 11)
   → Result: {metricsComputed: 1}

8. FINALIZATION (0.1s)
   → Calculate final status: 
     • completed (all 38 jobs succeeded)
     • partial (some jobs failed)
     • failed (all jobs failed)
   → Update pipeline_runs: status, end_time, completed_jobs, failed_jobs
   → Log duration: "Pipeline completed in 8.5 minutes"

9. NEXT RUN
   → Scheduled for next day 2 AM UTC
```

### Key Features
✅ **Job-Based Architecture** - Each task is independent (parallelizable in future)  
✅ **Error Isolation** - One board's scraper failure doesn't block others  
✅ **Raw Data Snapshots** - Full JSON of each day's postings for trend analysis  
✅ **Comprehensive Logging** - Every job tracked with status and results  
✅ **Statistics** - Success rates, duration, and trend lines  
✅ **Manual Trigger** - Can run via button or API anytime  

## Scheduling Options

### Option 1: Vercel Cron (Recommended for Next.js)
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/pipeline",
    "schedule": "0 2 * * *"  // Daily at 2 AM UTC
  }]
}
```

### Option 2: Node.js node-cron (Self-hosted)
```typescript
import cron from 'node-cron'
import { schedulePipelineRun } from '@/lib/pipelineOrchestrator'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await schedulePipelineRun()
})
```

### Option 3: Supabase Edge Functions
```typescript
// supabase/functions/pipeline-scheduler/index.ts
import { schedulePipelineRun } from '@/lib/pipelineOrchestrator'

Deno.serve(async (req) => {
  const result = await schedulePipelineRun()
  return new Response(JSON.stringify(result))
})
```

### Option 4: AWS Lambda
```typescript
// handler.ts
import { schedulePipelineRun } from '@/lib/pipelineOrchestrator'

export const handler = async () => {
  return await schedulePipelineRun()
}

// Trigger via CloudWatch Events at 2 AM UTC daily
```

## Monitoring Dashboard

The pipeline monitor is accessible at the dashboard (Day 15+):
- Real-time status of current run
- Last 10 runs history
- Statistics: success rate, avg duration
- Error logs for failed jobs
- "Run Now" button for manual triggers
- Auto-refresh every 30 seconds

## Next Steps (Days 9-10)

With the pipeline infrastructure in place:

**Day 9: Compute Posting Lifespan**
- Implement actual lifespan metrics
- Create views for duration analysis
- Build historical trend tracking

**Day 10: Compute Repost Frequency**
- Count total reposts per board
- Calculate repost rate percentage
- Identify boards with high repost issues

**Day 11: Build Scoring Algorithm**
- Implement efficiency score formula
- Weight components: 40% lifespan, 30% reposts, 20% surveys, 10% candidate
- Calculate per-board, per-role-family, per-industry

## Files Modified/Created
- ✨ `src/lib/pipeline.ts` - Pipeline management (312 lines)
- ✨ `src/lib/pipelineOrchestrator.ts` - Orchestration engine (318 lines)
- ✨ `src/pages/api/pipeline.ts` - REST API endpoint (65 lines)
- ✨ `src/components/PipelineMonitor.tsx` - React monitoring (320 lines)
- ✨ `scripts/runPipeline.ts` - CLI tool (97 lines)
- ✨ `supabase/migrations/004_pipeline_infrastructure.sql` - DB schema (120 lines)

**Total: 6 new files, 1,232 lines of code**

**To Schedule Pipeline:**
1. Deploy to Vercel: Add vercel.json crons config
2. Or run locally: `node_modules/.bin/ts-node scripts/runPipeline.ts`
3. Or use dashboard: Click "Run Now" button
