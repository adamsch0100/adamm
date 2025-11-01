# Full Warmup Workflow Test
param([string]$PhoneId = "1665216846020012")

$MCP_URL = "http://localhost:3000"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  FULL WARMUP WORKFLOW TEST" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: With human-like delays, this will take 5-10 minutes" -ForegroundColor Yellow
Write-Host ""

# Step 1: Power On
Write-Host "[1/10] Powering on device..." -ForegroundColor Yellow
$body = @{ cloudPhoneId = $PhoneId } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/poweron" -Method POST -Body $body -ContentType "application/json"
if ($response.success) {
    Write-Host "   Device powered on" -ForegroundColor Green
} else {
    Write-Host "   Failed: $($response.error)" -ForegroundColor Red
    exit 1
}

# Step 2: Wait for boot
Write-Host ""
Write-Host "[2/10] Waiting 120s for device to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 120
Write-Host "   Boot complete" -ForegroundColor Green

# Step 3: Enable ADB
Write-Host ""
Write-Host "[3/10] Enabling ADB..." -ForegroundColor Yellow
$body = @{ cloudPhoneIds = @($PhoneId) } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/adb/enable" -Method POST -Body $body -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ADB enabled" -ForegroundColor Green
        Write-Host "   Waiting 60s for ADB daemon to fully start..." -ForegroundColor Gray
        Start-Sleep -Seconds 60
    } else {
        Write-Host "   Failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Wait and verify ADB connection
Write-Host ""
Write-Host "[4/10] Verifying ADB connection..." -ForegroundColor Yellow
$body = @{ cloudPhoneId = $PhoneId } | ConvertTo-Json
$maxAttempts = 6
$attempt = 0
$adbReady = $false

while (-not $adbReady -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        $adbCheck = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/adb/check" -Method POST -Body $body -ContentType "application/json"
        if ($adbCheck.connected) {
            Write-Host "   ADB connection verified: $($adbCheck.device)" -ForegroundColor Green
            $adbReady = $true
        } else {
            Write-Host "   ADB not ready: $($adbCheck.message)" -ForegroundColor Yellow
            if ($attempt -lt $maxAttempts) {
                Write-Host "   Waiting 10s before retry..." -ForegroundColor Gray
                Start-Sleep -Seconds 10
            }
        }
    } catch {
        Write-Host "   Check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 10
        }
    }
}

if (-not $adbReady) {
    Write-Host "   ADB connection failed after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

# Step 5: Launch TikTok
Write-Host ""
Write-Host "[5/10] Launching TikTok..." -ForegroundColor Yellow
$body = @{ cloudPhoneId = $PhoneId } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/start" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    if ($response.success) {
        Write-Host "   TikTok launched" -ForegroundColor Green
    } else {
        Write-Host "   Failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might be a timeout or ADB connection issue" -ForegroundColor Yellow
    exit 1
}

# Step 6: Wait for TikTok to load
Write-Host ""
Write-Host "[6/10] Waiting 5s for TikTok to load..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "   TikTok loaded" -ForegroundColor Green

# Step 7: Main Feed Engagement
Write-Host ""
Write-Host "[7/10] Main feed engagement - 8-12 scrolls with human timing..." -ForegroundColor Yellow
Write-Host "   Note: Each action has 3-15s random delay for human-like behavior" -ForegroundColor Gray

# Random number of scrolls (8-12) - more natural
$scrollCount = Get-Random -Minimum 8 -Maximum 13

for ($i = 1; $i -le $scrollCount; $i++) {
    Write-Host "   Scroll $i/$scrollCount..." -ForegroundColor Gray
    $body = @{ cloudPhoneId = $PhoneId; action = "scroll_feed" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    
    # Random like chance (30-50%) - varies per session
    $likeChance = Get-Random -Minimum 30 -Maximum 51
    if ((Get-Random -Minimum 1 -Maximum 100) -le $likeChance) {
        Write-Host "   Liking video..." -ForegroundColor Gray
        $body = @{ cloudPhoneId = $PhoneId; action = "like_video" } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    }
}
Write-Host "   Main feed engagement complete ($scrollCount scrolls)" -ForegroundColor Green

# Step 8: Search and Explore
Write-Host ""
Write-Host "[8/10] Search and explore - 2 crypto topics..." -ForegroundColor Yellow
for ($searchNum = 1; $searchNum -le 2; $searchNum++) {
    Write-Host "   Search $searchNum/2..." -ForegroundColor Gray
    
    # Get random crypto topic
    $topic = (Invoke-RestMethod -Uri "$MCP_URL/api/utils/random-crypto-topic").topic
    Write-Host "   Topic: $topic" -ForegroundColor Gray
    
    # Tap search icon
    $body = @{ cloudPhoneId = $PhoneId; action = "tap_search" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    
    # Type search term
    Write-Host "   Typing search term with human-like delays..." -ForegroundColor Gray
    $body = @{ cloudPhoneId = $PhoneId; action = "type_text"; params = @{ text = $topic } } | ConvertTo-Json -Depth 3
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    
    # Tap search enter
    $body = @{ cloudPhoneId = $PhoneId; action = "tap_search_enter" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    
    # Alternate between Users and Videos tabs
    if ($searchNum % 2 -eq 1) {
        # Users tab
        Write-Host "   Exploring users..." -ForegroundColor Gray
        $body = @{ cloudPhoneId = $PhoneId; action = "tap_search_tab"; params = @{ tab = "Users" } } | ConvertTo-Json -Depth 3
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
        
        # Follow 2-3 random users
        $followCount = Get-Random -Minimum 2 -Maximum 4
        for ($f = 1; $f -le $followCount; $f++) {
            Write-Host "   Following user $f/$followCount..." -ForegroundColor Gray
            $body = @{ cloudPhoneId = $PhoneId; action = "tap_follow_button"; params = @{ position = $f } } | ConvertTo-Json -Depth 3
            $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
            
            # Scroll to see more users after following
            if ($f -lt $followCount) {
                $body = @{ cloudPhoneId = $PhoneId; action = "scroll_users" } | ConvertTo-Json
                $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
            }
        }
        
        # Final scroll
        $body = @{ cloudPhoneId = $PhoneId; action = "scroll_users" } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    } else {
        # Videos tab
        Write-Host "   Exploring videos..." -ForegroundColor Gray
        $body = @{ cloudPhoneId = $PhoneId; action = "tap_search_tab"; params = @{ tab = "Videos" } } | ConvertTo-Json -Depth 3
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
        
        # Tap first video
        $body = @{ cloudPhoneId = $PhoneId; action = "tap_video_result"; params = @{ position = 1 } } | ConvertTo-Json -Depth 3
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    }
    
    # Go back to main feed
    $body = @{ cloudPhoneId = $PhoneId; action = "tap_back" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
}
Write-Host "   Search and explore complete" -ForegroundColor Green

# Step 9: Return to home and final engagement
Write-Host ""
Write-Host "[9/11] Returning to home feed..." -ForegroundColor Yellow
# Go back to home (tap back twice from search)
$body = @{ cloudPhoneId = $PhoneId; action = "tap_back" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
$null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
Write-Host "   Back on home feed" -ForegroundColor Green

Write-Host ""
Write-Host "[10/11] Final home feed engagement - 3-5 scrolls with likes..." -ForegroundColor Yellow
$finalScrolls = Get-Random -Minimum 3 -Maximum 6
for ($i = 1; $i -le $finalScrolls; $i++) {
    Write-Host "   Final scroll $i/$finalScrolls..." -ForegroundColor Gray
    $body = @{ cloudPhoneId = $PhoneId; action = "scroll_feed" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    
    # 50% chance to like on final scrolls
    if ((Get-Random -Minimum 1 -Maximum 100) -le 50) {
        Write-Host "   Liking video..." -ForegroundColor Gray
        $body = @{ cloudPhoneId = $PhoneId; action = "like_video" } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
    }
}
Write-Host "   Final engagement complete" -ForegroundColor Green

# Step 10.5: Exit TikTok
Write-Host ""
Write-Host "[11/11] Exiting TikTok and powering off..." -ForegroundColor Yellow
$body = @{ cloudPhoneId = $PhoneId; action = "exit_tiktok" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" -Method POST -Body $body -ContentType "application/json"
Write-Host "   TikTok exited" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 11: Power Off
Write-Host ""
Write-Host "[10/10] Powering off device..." -ForegroundColor Yellow
$body = @{ cloudPhoneId = $PhoneId } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/poweroff" -Method POST -Body $body -ContentType "application/json"
if ($response.success) {
    Write-Host "   Device powered off" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  WARMUP WORKFLOW COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Main feed: 10 scrolls with 40% like rate"
Write-Host "- Search: 2 crypto topics explored"
Write-Host "- Human-like timing: 3-15s delays between actions"
Write-Host "- Character-by-character typing: 100-300ms per char"
Write-Host ""

