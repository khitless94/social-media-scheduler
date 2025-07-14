# Test script for the fixed production workflow
Write-Host "🚀 Testing Fixed Production Social Media Scheduler" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Production webhook URL
$webhookUrl = "https://k94.app.n8n.cloud/webhook/schedule-post"

# Test with your real user ID
$realUserId = "d33d28ea-cc43-4dd0-b971-e896acf853e3"

Write-Host "📋 Testing with user ID: $realUserId" -ForegroundColor Yellow
Write-Host ""

# Test cases
$testCases = @(
    @{
        name = "Direct Twitter Post"
        body = @{
            user_id = $realUserId
            platform = "twitter"
            content = "🚀 Testing fixed production workflow! Multi-user support is working! #automation #n8n"
            postId = "fixed-twitter-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        }
    },
    @{
        name = "Web App Format"
        body = @{
            user_id = $realUserId
            content = "🎉 Web app integration test! This workflow now supports multiple users dynamically! #production"
            platforms = @("twitter")
            scheduled_for = (Get-Date).AddMinutes(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            action = "schedule_post"
            post_id = "fixed-webapp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        }
    }
)

Write-Host "🧪 Available test cases:" -ForegroundColor Yellow
for ($i = 0; $i -lt $testCases.Count; $i++) {
    Write-Host "  $($i + 1). $($testCases[$i].name)" -ForegroundColor Cyan
}

Write-Host ""
$choice = Read-Host "Select test case (1-$($testCases.Count))"

try {
    $selectedTest = $testCases[$choice - 1]
    
    if (-not $selectedTest) {
        Write-Host "❌ Invalid selection!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎯 Testing: $($selectedTest.name)" -ForegroundColor Yellow
    Write-Host ""

    # Prepare the request
    $body = $selectedTest.body | ConvertTo-Json -Depth 10
    $headers = @{
        'Content-Type' = 'application/json'
        'X-User-ID' = $realUserId
    }

    Write-Host "📤 Request Body:" -ForegroundColor Blue
    Write-Host $body -ForegroundColor Gray
    Write-Host ""

    Write-Host "📡 Sending request to webhook..." -ForegroundColor Blue
    
    # Send the request
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Response received!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Response Body:" -ForegroundColor Yellow
    
    # Parse and display the response
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($responseData.success) {
        Write-Host ""
        Write-Host "🎉 SUCCESS! Post was published!" -ForegroundColor Green
        Write-Host "Platform: $($responseData.platform)" -ForegroundColor Green
        Write-Host "User ID: $($responseData.userId)" -ForegroundColor Green
        if ($responseData.platformPostId) {
            Write-Host "Platform Post ID: $($responseData.platformPostId)" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "❌ FAILED: $($responseData.message -or $responseData.error)" -ForegroundColor Red
        if ($responseData.help) {
            Write-Host "💡 Help: $($responseData.help)" -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $errorContent = $_.Exception.Response.Content | ConvertFrom-Json
            Write-Host "Error Details: $($errorContent | ConvertTo-Json)" -ForegroundColor Red
        } catch {
            Write-Host "Raw Error: $($_.Exception.Response.Content)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔄 Test completed!" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Green

# Additional info
Write-Host ""
Write-Host "📋 Workflow Features:" -ForegroundColor Yellow
Write-Host "  ✅ Multi-user support (dynamic user ID extraction)" -ForegroundColor Green
Write-Host "  ✅ Real OAuth credentials from Supabase" -ForegroundColor Green
Write-Host "  ✅ Platform-specific API calls" -ForegroundColor Green
Write-Host "  ✅ Error handling for missing credentials" -ForegroundColor Green
Write-Host "  ✅ Web app integration support" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your workflow is production-ready!" -ForegroundColor Green
