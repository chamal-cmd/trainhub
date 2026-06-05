# TrainHub — one-command deploy to Cloudflare Workers
# Usage: .\deploy.ps1 [-Message "your commit message"]
param(
    [string]$Message = "chore: deploy update"
)

# Load .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

Write-Host "🔍 Checking for changes..." -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "📦 Staging and committing changes..." -ForegroundColor Cyan
    git add -A
    git commit -m $Message
    if (-not $?) { Write-Host "❌ Commit failed" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "✅ No local changes — pushing existing commits" -ForegroundColor Green
}

Write-Host "🚀 Pushing to GitLab (triggers GitHub mirror → Cloudflare deploy)..." -ForegroundColor Cyan
git push gitlab master
if (-not $?) { Write-Host "❌ Push failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "✅ Pushed! GitHub Actions will now build and deploy." -ForegroundColor Green
Write-Host "   Watch progress: https://github.com/chamal-cmd/trainhub/actions" -ForegroundColor DarkGray
Write-Host "   Live site:      https://trainhub.gpbookkeeper.workers.dev" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⚡ Want to deploy directly (skip CI)? Run: .\deploy-direct.ps1" -ForegroundColor Yellow
