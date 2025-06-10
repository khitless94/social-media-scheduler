# PowerShell script to deploy Supabase functions
# Run this after starting Docker Desktop

Write-Host "🚀 Deploying Supabase Functions..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to fully load, then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Deploy functions
Write-Host "Deploying functions to Supabase..." -ForegroundColor Yellow
try {
    supabase functions deploy --project-ref eqiuukwwpdiyncahrdny
    Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy functions" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Read-Host "Press Enter to exit"
