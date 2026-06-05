# TrainHub — direct deploy to Cloudflare Workers (bypasses GitHub Actions)
# Use this for urgent hotfixes or when CI is slow
# Usage: .\deploy-direct.ps1

# Load .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

Write-Host "🔨 Building with OpenNext for Cloudflare..." -ForegroundColor Cyan
npx @opennextjs/cloudflare build
if (-not $?) { Write-Host "❌ Build failed" -ForegroundColor Red; exit 1 }

Write-Host "🚀 Deploying to Cloudflare Workers..." -ForegroundColor Cyan
npx wrangler deploy
if (-not $?) { Write-Host "❌ Deploy failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "✅ Deployed!" -ForegroundColor Green
Write-Host "   Live site: https://trainhub.gpbookkeeper.workers.dev" -ForegroundColor DarkGray
