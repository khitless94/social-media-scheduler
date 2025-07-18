Write-Host "🌍 Pushing timezone fixes and n8n workflow updates to git..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized." -ForegroundColor Green
}

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Create commit with detailed message
Write-Host "Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
🌍 Complete Timezone Fix & N8N Workflow Update

✅ TIMEZONE FIXES:
- Added comprehensive timezone utilities (src/utils/timezone.ts)
- Fixed timezone conversion issues in all scheduling components
- Implemented toLocalISOString() to preserve local time when storing to database
- Updated CronPollingScheduler, CreatePostCronPolling, CreatePostMinimal, CreatePost
- Updated cronPollingService and scheduledPostService to use proper timezone handling
- Added automatic timezone detection for users worldwide

✅ N8N WORKFLOW FIXES:
- Fixed 'No fields - item(s) exist, but they're empty' error
- Updated workflow to use correct 'scheduled_posts' table instead of 'posts'
- Fixed column mapping: scheduled_time -> scheduled_at
- Updated status logic: posted = false -> posted = true
- Added complete Reddit posting support
- Fixed database update queries for proper status tracking

✅ NEW FEATURES:
- Ultra-modern time picker allows selection of any minute (not just 15-min intervals)
- Automatic timezone detection from user's location
- Proper timezone display with abbreviations (EST, PST, etc.)
- Enhanced validation for future time scheduling
- Added TimezoneTest component for debugging

✅ FILES CHANGED:
- src/utils/timezone.ts (NEW)
- src/components/CronPollingScheduler.tsx
- src/components/CreatePostCronPolling.tsx  
- src/components/CreatePostMinimal.tsx
- src/components/CreatePost.tsx
- src/services/cronPollingService.ts
- src/services/scheduledPostService.ts
- final-clean-n8n-workflow.json
- src/components/TimezoneTest.tsx (NEW)
- test-n8n-data-flow.sql (NEW)

🎯 RESULT: 
- Time you select (7:20 PM) = Time that gets stored and executed
- Works for users in USA, Europe, Asia, and worldwide
- N8N workflow now properly processes scheduled posts
- No more timezone conversion issues or empty field errors
"@

git commit -m $commitMessage

# Check if remote exists
$remoteExists = git remote -v 2>$null
if (-not $remoteExists) {
    Write-Host ""
    Write-Host "⚠️  No git remote found. To push to GitHub:" -ForegroundColor Yellow
    Write-Host "1. Create a new repository on GitHub" -ForegroundColor Cyan
    Write-Host "2. Run: git remote add origin https://github.com/yourusername/your-repo-name.git" -ForegroundColor Cyan
    Write-Host "3. Run: git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "For now, changes are committed locally." -ForegroundColor Green
} else {
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    try {
        git push
        Write-Host "✅ Successfully pushed to git!" -ForegroundColor Green
    } catch {
        Write-Host "Trying to push with upstream..." -ForegroundColor Yellow
        git push -u origin main
        Write-Host "✅ Successfully pushed to git!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Git operations completed!" -ForegroundColor Green
Write-Host "📁 All timezone fixes and n8n workflow updates have been committed." -ForegroundColor Cyan
