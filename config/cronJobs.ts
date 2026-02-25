// Railway Cron Job Configuration
// This file defines cron jobs for the Railway deployment
// Reference: https://docs.railway.app/reference/cron-jobs

const cronJobs = [
  {
    name: 'scrape-job-boards-morning',
    schedule: '0 8 * * *', // 8 AM UTC daily
    command: 'curl -X POST https://your-app.railway.app/api/cron/scrape-job-boards -H "Authorization: Bearer $CRON_SECRET"',
  },
  {
    name: 'scrape-job-boards-evening',
    schedule: '0 18 * * *', // 6 PM UTC daily
    command: 'curl -X POST https://your-app.railway.app/api/cron/scrape-job-boards -H "Authorization: Bearer $CRON_SECRET"',
  },
]

export default cronJobs

/* 
  If using Railway directly, add to your railway.json:
  
  {
    "crons": [
      {
        "name": "scrape-job-boards-morning",
        "schedule": "0 8 * * *",
        "command": "curl -X POST $DEPLOY_URL/api/cron/scrape-job-boards -H 'Authorization: Bearer $CRON_SECRET'"
      },
      {
        "name": "scrape-job-boards-evening", 
        "schedule": "0 18 * * *",
        "command": "curl -X POST $DEPLOY_URL/api/cron/scrape-job-boards -H 'Authorization: Bearer $CRON_SECRET'"
      }
    ]
  }
*/
