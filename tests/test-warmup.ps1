# TikTok Warm-Up Test Script
# Tests VMOS connection and TikTok automation actions

param(
    [Parameter(Mandatory=$false)]
    [string]$DeviceId = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TikTok Warm-Up Test Script            " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MCP server is running
Write-Host "Checking MCP server..." -ForegroundColor Yellow
try {
    $serverCheck = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -ErrorAction Stop
    Write-Host "✓ MCP server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ MCP server is not running!" -ForegroundColor Red
    Write-Host "Please start it with: .\start-mcp-server.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Get VMOS devices
Write-Host "Step 1: Fetching VMOS devices..." -ForegroundColor Yellow
try {
    $devicesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/instances" -Method GET
    
    if ($devicesResponse.success -and $devicesResponse.instances.Count -gt 0) {
        Write-Host "✓ Found $($devicesResponse.instances.Count) VMOS device(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available devices:" -ForegroundColor Cyan
        
        for ($i = 0; $i -lt $devicesResponse.instances.Count; $i++) {
            $device = $devicesResponse.instances[$i]
            Write-Host "  [$i] ID: $($device.id)" -ForegroundColor White
            Write-Host "      Name: $($device.name)" -ForegroundColor Gray
            Write-Host "      Status: $($device.status)" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Auto-select first device if not specified
        if ([string]::IsNullOrEmpty($DeviceId)) {
            $DeviceId = $devicesResponse.instances[0].id
            Write-Host "Auto-selected device: $DeviceId" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ No VMOS devices found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to:" -ForegroundColor Yellow
        Write-Host "1. Log into VMOS Cloud: https://cloud.vmoscloud.com" -ForegroundColor White
        Write-Host "2. Create at least 1 virtual device" -ForegroundColor White
        Write-Host "3. Make sure it's running" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "✗ Failed to fetch VMOS devices!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Device Setup Check                    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: Before testing automation, make sure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✓ TikTok is installed on device $DeviceId" -ForegroundColor White
Write-Host "2. ✓ You're logged into TikTok with:" -ForegroundColor White
Write-Host "      Email: schwartz.adam@me.com" -ForegroundColor Gray
Write-Host "3. ✓ TikTok is closed (we'll open it)" -ForegroundColor White
Write-Host ""

$ready = Read-Host "Are you ready to test? (yes/no)"

if ($ready -ne "yes") {
    Write-Host ""
    Write-Host "Setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to VMOS Cloud web interface" -ForegroundColor White
    Write-Host "2. Open your device" -ForegroundColor White
    Write-Host "3. Install TikTok from Play Store" -ForegroundColor White
    Write-Host "4. Log into TikTok with schwartz.adam@me.com" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting TikTok Warm-Up Tests         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Start TikTok app
Write-Host "Step 2: Starting TikTok app..." -ForegroundColor Yellow
try {
    $startTikTokBody = @{
        instanceId = $DeviceId
    } | ConvertTo-Json

    $startResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/start-tiktok" `
        -Method POST `
        -Body $startTikTokBody `
        -ContentType "application/json"
    
    if ($startResponse.success) {
        Write-Host "✓ TikTok started successfully" -ForegroundColor Green
        Write-Host "Waiting 5 seconds for app to load..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    } else {
        Write-Host "✗ Failed to start TikTok" -ForegroundColor Red
        Write-Host "Response: $($startResponse | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error starting TikTok!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Test scroll action
Write-Host "Step 3: Testing scroll (swipe up on feed)..." -ForegroundColor Yellow
try {
    $scrollBody = @{
        instanceId = $DeviceId
        action = "scroll_feed"
        params = @{}
    } | ConvertTo-Json

    $scrollResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
        -Method POST `
        -Body $scrollBody `
        -ContentType "application/json"
    
    if ($scrollResponse.success) {
        Write-Host "✓ Scroll action executed" -ForegroundColor Green
        Write-Host "Waiting 2 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    } else {
        Write-Host "⚠ Scroll action may have failed" -ForegroundColor Yellow
        Write-Host "Response: $($scrollResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error executing scroll!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test like action
Write-Host "Step 4: Testing like (double tap)..." -ForegroundColor Yellow
try {
    $likeBody = @{
        instanceId = $DeviceId
        action = "like_video"
        params = @{}
    } | ConvertTo-Json

    $likeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
        -Method POST `
        -Body $likeBody `
        -ContentType "application/json"
    
    if ($likeResponse.success) {
        Write-Host "✓ Like action executed (double tap)" -ForegroundColor Green
        Write-Host "Waiting 2 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    } else {
        Write-Host "⚠ Like action may have failed" -ForegroundColor Yellow
        Write-Host "Response: $($likeResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error executing like!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 5: Scroll a few more times
Write-Host "Step 5: Scrolling feed (3 more times)..." -ForegroundColor Yellow
for ($i = 1; $i -le 3; $i++) {
    try {
        Write-Host "  Scroll $i/3..." -ForegroundColor Gray
        
        $scrollBody = @{
            instanceId = $DeviceId
            action = "scroll_feed"
            params = @{}
        } | ConvertTo-Json

        $scrollResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
            -Method POST `
            -Body $scrollBody `
            -ContentType "application/json"
        
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "  ⚠ Scroll $i failed" -ForegroundColor Yellow
    }
}

Write-Host "✓ Feed scrolling complete" -ForegroundColor Green
Write-Host ""

# Step 6: Test search action
Write-Host "Step 6: Testing search (tap search icon)..." -ForegroundColor Yellow
try {
    $searchBody = @{
        instanceId = $DeviceId
        action = "tap_search"
        params = @{}
    } | ConvertTo-Json

    $searchResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
        -Method POST `
        -Body $searchBody `
        -ContentType "application/json"
    
    if ($searchResponse.success) {
        Write-Host "✓ Search tap executed" -ForegroundColor Green
        Write-Host "Waiting 3 seconds for search page to load..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    } else {
        Write-Host "⚠ Search tap may have failed" -ForegroundColor Yellow
        Write-Host "Response: $($searchResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error executing search tap!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Warm-Up Test Complete!                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Actions tested:" -ForegroundColor Green
Write-Host "  ✓ Start TikTok app" -ForegroundColor White
Write-Host "  ✓ Scroll feed (swipe up)" -ForegroundColor White
Write-Host "  ✓ Like video (double tap)" -ForegroundColor White
Write-Host "  ✓ Navigate to search" -ForegroundColor White
Write-Host ""

Write-Host "What to check on your device:" -ForegroundColor Yellow
Write-Host "1. Did TikTok open?" -ForegroundColor White
Write-Host "2. Did the feed scroll (swipe up motion)?" -ForegroundColor White
Write-Host "3. Did you see a heart animation (like)?" -ForegroundColor White
Write-Host "4. Did it navigate to the search page?" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If actions worked: Great! The automation is ready" -ForegroundColor White
Write-Host "2. If coordinates are off: We may need to adjust touch positions" -ForegroundColor White
Write-Host "3. Import warmup-workflow.json to n8n to automate this daily" -ForegroundColor White
Write-Host ""

Write-Host "To run full warm-up workflow:" -ForegroundColor Yellow
Write-Host "1. Open n8n: http://localhost:5678" -ForegroundColor White
Write-Host "2. Import warmup-workflow.json" -ForegroundColor White
Write-Host "3. Execute workflow to test" -ForegroundColor White
Write-Host ""

