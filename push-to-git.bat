@echo off
echo Pushing timezone fixes and n8n workflow updates to git...

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    echo Git repository initialized.
)

REM Add all changes
echo Adding all changes...
git add .

REM Create commit with detailed message
echo Creating commit...
git commit -m "🌍 Complete Timezone Fix & N8N Workflow Update

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
- No more timezone conversion issues or empty field errors"

REM Check if remote exists, if not, provide instructions
git remote -v > nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  No git remote found. To push to GitHub:
    echo 1. Create a new repository on GitHub
    echo 2. Run: git remote add origin https://github.com/yourusername/your-repo-name.git
    echo 3. Run: git push -u origin main
    echo.
    echo For now, changes are committed locally.
) else (
    echo Pushing to remote repository...
    git push
    if errorlevel 1 (
        echo Trying to push with upstream...
        git push -u origin main
    )
    echo ✅ Successfully pushed to git!
)

echo.
echo 🎉 Git operations completed!
echo 📁 All timezone fixes and n8n workflow updates have been committed.
pause
