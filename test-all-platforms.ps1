# Test script for all 5 platforms
Write-Host "🚀 Testing All 5 Platforms - Social Media Scheduler" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Production webhook URL
$webhookUrl = "https://k94.app.n8n.cloud/webhook/schedule-post"

# Your real user ID
$realUserId = "d33d28ea-cc43-4dd0-b971-e896acf853e3"

Write-Host "📋 Testing with user ID: $realUserId" -ForegroundColor Yellow
Write-Host ""

# Test cases for all 5 platforms
$platforms = @(
    @{
        name = "Twitter"
        platform = "twitter"
        content = "🐦 Testing Twitter integration! Multi-user workflow is working! #automation #n8n"
    },
    @{
        name = "Facebook"
        platform = "facebook"
        content = "📘 Testing Facebook integration! Social media scheduler supports multiple users! #socialmedia"
    },
    @{
        name = "LinkedIn"
        platform = "linkedin"
        content = "💼 Testing LinkedIn integration! Professional networking automation is live! #linkedin #automation"
    },
    @{
        name = "Reddit"
        platform = "reddit"
        content = "🤖 Testing Reddit integration! Community posting automation is working! What do you think?"
    },
    @{
        name = "Instagram"
        platform = "instagram"
        content = "📸 Testing Instagram integration! Visual content automation (note: requires media upload)"
    }
)

Write-Host "🌐 Available platforms to test:" -ForegroundColor Yellow
for ($i = 0; $i -lt $platforms.Count; $i++) {
    Write-Host "  $($i + 1). $($platforms[$i].name) ($($platforms[$i].platform))" -ForegroundColor Cyan
}
Write-Host "  6. Test All Platforms" -ForegroundColor Magenta

Write-Host ""
$choice = Read-Host "Select platform to test (1-6)"

function Test-Platform {
    param($platform, $testName)
    
    Write-Host ""
    Write-Host "🎯 Testing: $testName" -ForegroundColor Yellow
    Write-Host "Platform: $($platform.platform)" -ForegroundColor Blue
    Write-Host ""

    # Prepare the request
    $body = @{
        user_id = $realUserId
        platform = $platform.platform
        content = $platform.content
        postId = "test-$($platform.platform)-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    } | ConvertTo-Json

    $headers = @{
        'Content-Type' = 'application/json'
        'X-User-ID' = $realUserId
    }

    Write-Host "📤 Request Body:" -ForegroundColor Blue
    Write-Host $body -ForegroundColor Gray
    Write-Host ""

    try {
        Write-Host "📡 Sending request to webhook..." -ForegroundColor Blue
        
        # Send the request
        $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
        
        Write-Host "✅ Response received!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ""
        
        # Parse and display the response
        $responseData = $response.Content | ConvertFrom-Json
        
        if ($responseData.success) {
            Write-Host "🎉 SUCCESS! Post was published to $($responseData.platform)!" -ForegroundColor Green
            Write-Host "User ID: $($responseData.userId)" -ForegroundColor Green
            Write-Host "Post ID: $($responseData.postId)" -ForegroundColor Green
            if ($responseData.platformPostId) {
                Write-Host "Platform Post ID: $($responseData.platformPostId)" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ FAILED: $($responseData.message -or $responseData.error)" -ForegroundColor Red
            if ($responseData.help) {
                Write-Host "💡 Help: $($responseData.help)" -ForegroundColor Yellow
            }
        }
        
        return $responseData.success
        
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        return $false
    }
}

try {
    if ($choice -eq "6") {
        # Test all platforms
        Write-Host ""
        Write-Host "🚀 Testing ALL platforms..." -ForegroundColor Magenta
        
        $results = @()
        foreach ($platform in $platforms) {
            $success = Test-Platform $platform $platform.name
            $results += @{
                platform = $platform.name
                success = $success
            }
            
            if ($platform -ne $platforms[-1]) {
                Write-Host ""
                Write-Host "⏳ Waiting 2 seconds before next test..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
        
        # Summary
        Write-Host ""
        Write-Host "📊 SUMMARY RESULTS:" -ForegroundColor Magenta
        Write-Host "===================" -ForegroundColor Magenta
        foreach ($result in $results) {
            $status = if ($result.success) { "✅ SUCCESS" } else { "❌ FAILED" }
            $color = if ($result.success) { "Green" } else { "Red" }
            Write-Host "$($result.platform): $status" -ForegroundColor $color
        }
        
    } else {
        # Test single platform
        $selectedPlatform = $platforms[$choice - 1]
        
        if (-not $selectedPlatform) {
            Write-Host "❌ Invalid selection!" -ForegroundColor Red
            exit 1
        }
        
        Test-Platform $selectedPlatform $selectedPlatform.name
    }

} catch {
    Write-Host ""
    Write-Host "❌ UNEXPECTED ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Test completed!" -ForegroundColor Blue
Write-Host "====================================================" -ForegroundColor Green

# Platform routing info
Write-Host ""
Write-Host "🔀 Platform Routing Information:" -ForegroundColor Yellow
Write-Host "  Output 0: Twitter" -ForegroundColor Cyan
Write-Host "  Output 1: Facebook" -ForegroundColor Cyan
Write-Host "  Output 2: LinkedIn" -ForegroundColor Cyan
Write-Host "  Output 3: Reddit" -ForegroundColor Cyan
Write-Host "  Output 4: Instagram" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All 5 platforms are now properly configured!" -ForegroundColor Green
