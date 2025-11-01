# Test VMOS API Integration
# This script tests your VMOS credentials and API connectivity

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VMOS API Test Script                  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MCP server is running
Write-Host "1. Checking if MCP server is running..." -ForegroundColor Yellow
$mcpResponse = $null
try {
    $mcpResponse = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "   ✓ MCP Server is running!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ MCP Server is NOT running!" -ForegroundColor Red
    Write-Host "   Please run: .\start-mcp-server.ps1" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Test VMOS connection - Get instances
Write-Host "2. Testing VMOS API - Fetching instances..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/instances" -Method GET
    
    if ($response.success) {
        Write-Host "   ✓ VMOS API Connection Successful!" -ForegroundColor Green
        Write-Host "   Found $($response.count) virtual phone instance(s)" -ForegroundColor Cyan
        
        if ($response.count -gt 0) {
            Write-Host ""
            Write-Host "   Your devices:" -ForegroundColor White
            foreach ($instance in $response.instances) {
                $padCode = if ($instance.padCode) { $instance.padCode } else { $instance.instance_id }
                $status = if ($instance.status -eq 1) { "Online" } else { "Offline" }
                $statusColor = if ($instance.status -eq 1) { "Green" } else { "Yellow" }
                Write-Host "   - $padCode : $status" -ForegroundColor $statusColor
            }
        }
    } else {
        Write-Host "   ✗ VMOS API Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to connect to VMOS API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   1. VMOS_ACCESS_KEY is correct in .env" -ForegroundColor White
    Write-Host "   2. VMOS_SECRET_KEY is correct in .env" -ForegroundColor White
    Write-Host "   3. You have active VMOS cloud phone instances" -ForegroundColor White
}

Write-Host ""

# Test CoinMarketCap API
Write-Host "3. Testing CoinMarketCap API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto/trending?limit=3" -Method GET
    
    if ($response.success) {
        Write-Host "   ✓ CoinMarketCap API Working!" -ForegroundColor Green
        Write-Host "   Top 3 Cryptocurrencies:" -ForegroundColor Cyan
        foreach ($crypto in $response.trending) {
            $price = [math]::Round($crypto.quote.USD.price, 2)
            $change = [math]::Round($crypto.quote.USD.percent_change_24h, 2)
            $changeColor = if ($change -gt 0) { "Green" } else { "Red" }
            Write-Host "   - $($crypto.name) ($($crypto.symbol)): `$$price (${change}%)" -ForegroundColor $changeColor
        }
    } else {
        Write-Host "   ✗ CoinMarketCap API Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to fetch crypto data" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test OpenAI API
Write-Host "4. Testing OpenAI API (Script Generation)..." -ForegroundColor Yellow
try {
    $body = @{
        topic = "Bitcoin reaches new all-time high"
        keywords = @("Bitcoin", "crypto", "investment")
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/openai/generate-script" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✓ OpenAI API Working!" -ForegroundColor Green
        Write-Host "   Generated Script Preview:" -ForegroundColor Cyan
        Write-Host "   Hook: $($response.script.hook)" -ForegroundColor White
        Write-Host "   Hashtags: $($response.script.hashtags -join ', ')" -ForegroundColor White
    } else {
        Write-Host "   ✗ OpenAI API Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to generate script" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Test Complete!                        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Test touch simulation (if we have instances)
if ($response.count -gt 0 -and $response.instances[0]) {
    $firstDevice = if ($response.instances[0].padCode) { $response.instances[0].padCode } else { $response.instances[0].instance_id }
    
    Write-Host "5. Want to test TikTok automation on device $firstDevice ?" -ForegroundColor Yellow
    $testTouch = Read-Host "   Type 'yes' to test scroll gesture (this will interact with the device)"
    
    if ($testTouch -eq 'yes') {
        Write-Host "   Sending scroll gesture..." -ForegroundColor Yellow
        try {
            $touchBody = @{
                instanceId = $firstDevice
                action = "scroll_feed"
                params = @{}
            } | ConvertTo-Json

            $touchResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/vmos/tk/action" `
                -Method POST `
                -Body $touchBody `
                -ContentType "application/json"
            
            if ($touchResponse.success) {
                Write-Host "   ✓ Touch simulation sent successfully!" -ForegroundColor Green
                Write-Host "   Task ID: $($touchResponse.taskId)" -ForegroundColor Cyan
                Write-Host "   Check your VMOS dashboard to see the device respond!" -ForegroundColor White
            } else {
                Write-Host "   ✗ Touch simulation failed: $($touchResponse.error)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. All APIs working? Run: .\start-all.ps1" -ForegroundColor White
Write-Host "2. Open http://localhost:5678 to configure n8n" -ForegroundColor White
Write-Host "3. Import the workflows and start automating!" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"

