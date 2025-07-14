# Clear Pending Scheduled Posts from Database
Write-Host "🗑️ Clear Pending Scheduled Posts" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red

# Your Supabase connection details (you'll need to fill these in)
$supabaseUrl = "YOUR_SUPABASE_URL"
$supabaseKey = "YOUR_SUPABASE_SERVICE_KEY"

Write-Host ""
Write-Host "⚠️ WARNING: This will delete pending scheduled posts!" -ForegroundColor Yellow
Write-Host ""

# Option 1: Using Supabase REST API
Write-Host "🔍 First, let's see what pending posts exist..." -ForegroundColor Blue

$headers = @{
    'apikey' = $supabaseKey
    'Authorization' = "Bearer $supabaseKey"
    'Content-Type' = 'application/json'
}

try {
    # Check existing pending posts
    $checkUrl = "$supabaseUrl/rest/v1/scheduled_posts?status=in.(pending,scheduled)&select=*"
    $pendingPosts = Invoke-RestMethod -Uri $checkUrl -Method GET -Headers $headers
    
    Write-Host "📊 Found $($pendingPosts.Count) pending/scheduled posts:" -ForegroundColor Yellow
    
    if ($pendingPosts.Count -gt 0) {
        foreach ($post in $pendingPosts) {
            Write-Host "  - ID: $($post.id)" -ForegroundColor Gray
            Write-Host "    Content: $($post.content.Substring(0, [Math]::Min(50, $post.content.Length)))..." -ForegroundColor Gray
            Write-Host "    Platform: $($post.platform)" -ForegroundColor Gray
            Write-Host "    Scheduled: $($post.scheduled_for)" -ForegroundColor Gray
            Write-Host "    Status: $($post.status)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host ""
        $confirm = Read-Host "❓ Do you want to delete ALL these pending posts? (yes/no)"
        
        if ($confirm.ToLower() -eq "yes" -or $confirm.ToLower() -eq "y") {
            Write-Host ""
            Write-Host "🗑️ Deleting pending posts..." -ForegroundColor Red
            
            # Delete all pending/scheduled posts
            $deleteUrl = "$supabaseUrl/rest/v1/scheduled_posts?status=in.(pending,scheduled)"
            $result = Invoke-RestMethod -Uri $deleteUrl -Method DELETE -Headers $headers
            
            Write-Host "✅ Successfully deleted all pending scheduled posts!" -ForegroundColor Green
            
            # Verify deletion
            $verifyPosts = Invoke-RestMethod -Uri $checkUrl -Method GET -Headers $headers
            Write-Host "📊 Remaining pending posts: $($verifyPosts.Count)" -ForegroundColor Blue
            
        } else {
            Write-Host "❌ Operation cancelled." -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "✅ No pending posts found. Database is already clean!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error connecting to database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative options:" -ForegroundColor Yellow
    Write-Host "1. Use Supabase Dashboard SQL Editor" -ForegroundColor Cyan
    Write-Host "2. Use psql command line" -ForegroundColor Cyan
    Write-Host "3. Update the connection details in this script" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔄 Manual SQL Option:" -ForegroundColor Blue
Write-Host "If the API method doesn't work, you can run this SQL in Supabase Dashboard:" -ForegroundColor Blue
Write-Host ""
Write-Host "-- View pending posts" -ForegroundColor Gray
Write-Host "SELECT * FROM scheduled_posts WHERE status IN ('pending', 'scheduled');" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Delete all pending posts" -ForegroundColor Gray
Write-Host "DELETE FROM scheduled_posts WHERE status IN ('pending', 'scheduled');" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 After clearing, you can create fresh scheduled posts!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Red
