# Production Webhook Test Script
# Tests the n8n production workflow with real user credentials

Write-Host "🚀 Testing Production Social Media Scheduler Webhook" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Production webhook URL
$webhookUrl = "https://k94.app.n8n.cloud/webhook/schedule-post"

# Multi-user support - you can test with different user IDs
$availableUsers = @(
    @{
        id = "d33d28ea-cc43-4dd0-b971-e896acf853e3"
        name = "User 1 (Your Account)"
    },
    @{
        id = "12345678-1234-1234-1234-123456789abc"
        name = "Test User 2"
    }
)

Write-Host "👥 Available Users:" -ForegroundColor Yellow
for ($i = 0; $i -lt $availableUsers.Count; $i++) {
    Write-Host "  $($i + 1). $($availableUsers[$i].name) - $($availableUsers[$i].id)" -ForegroundColor Cyan
}

Write-Host ""
$userChoice = Read-Host "Select user (1-$($availableUsers.Count))"
$selectedUser = $availableUsers[$userChoice - 1]

if (-not $selectedUser) {
    Write-Host "❌ Invalid user selection!" -ForegroundColor Red
    exit 1
}

$realUserId = $selectedUser.id
Write-Host "✅ Selected user: $($selectedUser.name)" -ForegroundColor Green

# Test modes
$testModes = @(
    @{
        name = "Direct Platform Post"
        description = "Test direct posting to a single platform"
    },
    @{
        name = "Web App Integration"
        description = "Test the format used by your web application"
    }
)

Write-Host ""
Write-Host "🔧 Test Modes:" -ForegroundColor Yellow
for ($i = 0; $i -lt $testModes.Count; $i++) {
    Write-Host "  $($i + 1). $($testModes[$i].name) - $($testModes[$i].description)" -ForegroundColor Cyan
}

Write-Host ""
$modeChoice = Read-Host "Select test mode (1-$($testModes.Count))"
$selectedMode = $testModes[$modeChoice - 1]

if (-not $selectedMode) {
    Write-Host "❌ Invalid mode selection!" -ForegroundColor Red
    exit 1
}

# Test data for different platforms
$testCases = @(
    @{
        platform = "twitter"
        content = "🚀 Production test from my social media scheduler! This is working with real OAuth credentials. #automation #n8n"
        postId = "prod-twitter-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    },
    @{
        platform = "linkedin"
        content = "Excited to share that my social media automation is now live! 🎉 Built with n8n and Supabase. #productivity #automation"
        postId = "prod-linkedin-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    },
    @{
        platform = "facebook"
        content = "My social media scheduler is now production-ready! 📱 Automating posts across multiple platforms. #socialmedia #automation"
        postId = "prod-facebook-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    },
    @{
        platform = "reddit"
        content = "Just launched my social media automation workflow! Built with n8n, Supabase, and real OAuth integration. What do you think?"
        postId = "prod-reddit-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }
)

Write-Host "📋 Available test cases:" -ForegroundColor Yellow
for ($i = 0; $i -lt $testCases.Count; $i++) {
    Write-Host "  $($i + 1). $($testCases[$i].platform.ToUpper())" -ForegroundColor Cyan
}

# Ask user which platform to test
Write-Host ""
$choice = Read-Host "Enter the number of the platform to test (1-$($testCases.Count))"

try {
    $selectedTest = $testCases[$choice - 1]
    
    Write-Host ""
    Write-Host "🎯 Testing $($selectedTest.platform.ToUpper()) platform..." -ForegroundColor Yellow
    Write-Host "User ID: $realUserId" -ForegroundColor Gray
    Write-Host "Content: $($selectedTest.content)" -ForegroundColor Gray
    Write-Host ""

    # Prepare the request body based on selected mode
    if ($modeChoice -eq 1) {
        # Direct Platform Post mode
        $body = @{
            user_id = $realUserId
            platform = $selectedTest.platform
            content = $selectedTest.content
            postId = $selectedTest.postId
        } | ConvertTo-Json

        $headers = @{
            'Content-Type' = 'application/json'
            'X-User-ID' = $realUserId
        }
    } else {
        # Web App Integration mode
        $body = @{
            post_id = $selectedTest.postId
            user_id = $realUserId
            content = $selectedTest.content
            platforms = @($selectedTest.platform)
            scheduled_for = (Get-Date).AddMinutes(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            media_urls = @()
            action = "schedule_post"
        } | ConvertTo-Json

        $headers = @{
            'Content-Type' = 'application/json'
            'X-User-ID' = $realUserId
        }
    }

    Write-Host "📤 Sending request to webhook..." -ForegroundColor Blue
    
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
        Write-Host "🎉 SUCCESS! Post was published to $($selectedTest.platform.ToUpper())!" -ForegroundColor Green
        if ($responseData.platformResponse) {
            Write-Host "Platform Response ID: $($responseData.platformResponse.id -or $responseData.platformResponse.data.id)" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "❌ FAILED: $($responseData.error -or $responseData.message)" -ForegroundColor Red
    }

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔄 Test completed!" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Green
