$ErrorActionPreference = "Stop"
Write-Host "=== Deploy to take-the-reins.ai ===" -ForegroundColor Cyan

# 1. Build
Write-Host "`n[1/3] Building..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build 2>&1 | Select-Object -Last 3
if (-not (Test-Path .next)) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

# 2. Git push
Write-Host "`n[2/3] Pushing to GitHub..." -ForegroundColor Yellow
git add -A
$msg = git diff --cached --stat
if ($msg) { git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"; git push } else { Write-Host "No changes to push" }

# 3. Deploy
Write-Host "`n[3/3] Deploying to Netlify..." -ForegroundColor Yellow
$env:NETLIFY_AUTH_TOKEN = "nfp_hkyRDq52JF4r6BJ3fpEuG6oxgrC2rEeNa375"
npx netlify-cli deploy --prod --site=4ed2dba4-221d-4d33-b65c-69b3e48eabe9 --dir=.next 2>&1 | Select-Object -Last 5

Write-Host "`nDone! Site live at https://take-the-reins.ai" -ForegroundColor Green
