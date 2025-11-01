# Test MoreLogin Integration
# This script tests the connection to MoreLogin API and basic functionality

Write-Host "`n=== MoreLogin Integration Test ===" -ForegroundColor Cyan
Write-Host "Testing connection to MoreLogin API and MCP server`n" -ForegroundColor Gray

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and -not $_.StartsWith('#')) {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
    Write-Host "✓ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your MoreLogin credentials" -ForegroundColor Yellow
    exit 1
}

$MORELOGIN_API_ID = $env:MORELOGIN_API_ID
$MORELOGIN_SECRET_KEY = $env:MORELOGIN_SECRET_KEY
$MCP_URL = "http://localhost:3000"

# Check if credentials are set
if (-not $MORELOGIN_API_ID -or $MORELOGIN_API_ID -eq "your_api_id_here") {
    Write-Host "`n✗ MoreLogin API ID not configured!" -ForegroundColor Red
    Write-Host "Please update MORELOGIN_API_ID in your .env file" -ForegroundColor Yellow
    Write-Host "Get your API credentials from: MoreLogin Profile > API Settings" -ForegroundColor Gray
    exit 1
}

if (-not $MORELOGIN_SECRET_KEY -or $MORELOGIN_SECRET_KEY -eq "your_secret_key_here") {
    Write-Host "`n✗ MoreLogin Secret Key not configured!" -ForegroundColor Red
    Write-Host "Please update MORELOGIN_SECRET_KEY in your .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n1. Testing MCP Server Health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$MCP_URL/health" -Method Get
    if ($health.status -eq "ok" -and $health.platform -eq "MoreLogin") {
        Write-Host "   ✓ MCP Server is running (Platform: MoreLogin)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ MCP Server response unexpected" -ForegroundColor Red
        Write-Host "   Response: $($health | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ MCP Server not reachable at $MCP_URL" -ForegroundColor Red
    Write-Host "   Please start the server with: .\start-mcp-server.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Testing MoreLogin API Connection..." -ForegroundColor Cyan
try {
    $instances = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/instances?pageSize=10" -Method Get
    if ($instances.success) {
        Write-Host "   ✓ Successfully connected to MoreLogin API" -ForegroundColor Green
        Write-Host "   Found $($instances.count) cloud phone(s)" -ForegroundColor Gray
        
        if ($instances.count -gt 0) {
            Write-Host "`n   Cloud Phones:" -ForegroundColor Yellow
            foreach ($phone in $instances.instances) {
                $status = switch ($phone.envStatus) {
                    0 { "New" }
                    1 { "Creation Failed" }
                    2 { "Stopped" }
                    3 { "Starting" }
                    4 { "Running" }
                    5 { "Resetting" }
                    default { "Unknown" }
                }
                $adbStatus = if ($phone.enableAdb) { "Enabled" } else { "Disabled" }
                
                Write-Host "   - ID: $($phone.id)" -ForegroundColor Gray
                Write-Host "     Name: $($phone.envName)" -ForegroundColor Gray
                Write-Host "     Status: $status" -ForegroundColor Gray
                Write-Host "     ADB: $adbStatus" -ForegroundColor Gray
                
                if ($phone.enableAdb -and $phone.adbInfo -and $phone.adbInfo.success -eq 1) {
                    Write-Host "     ADB IP: $($phone.adbInfo.adbIp):$($phone.adbInfo.adbPort)" -ForegroundColor Gray
                }
                
                if ($phone.proxy) {
                    Write-Host "     Proxy: $($phone.proxy.proxyName)" -ForegroundColor Gray
                }
                Write-Host ""
            }
        } else {
            Write-Host "`n   No cloud phones found." -ForegroundColor Yellow
            Write-Host "   You can create one using: POST $MCP_URL/api/morelogin/create" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✗ MoreLogin API request failed" -ForegroundColor Red
        Write-Host "   Error: $($instances.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to connect to MoreLogin API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host "`n3. Testing OpenAI API..." -ForegroundColor Cyan
try {
    $scriptTest = Invoke-RestMethod -Uri "$MCP_URL/api/openai/generate-script" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            topic = "Bitcoin price surge"
            keywords = @("Bitcoin", "BTC", "crypto")
        } | ConvertTo-Json)
    
    if ($scriptTest.success) {
        Write-Host "   ✓ OpenAI API is working" -ForegroundColor Green
        Write-Host "   Generated hook: $($scriptTest.script.hook.Substring(0, [Math]::Min(60, $scriptTest.script.hook.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ✗ OpenAI API test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ OpenAI API connection failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Testing CoinMarketCap API..." -ForegroundColor Cyan
try {
    $cryptoTest = Invoke-RestMethod -Uri "$MCP_URL/api/crypto/trending?limit=3" -Method Get
    
    if ($cryptoTest.success) {
        Write-Host "   ✓ CoinMarketCap API is working" -ForegroundColor Green
        Write-Host "   Top 3 cryptocurrencies:" -ForegroundColor Gray
        foreach ($coin in $cryptoTest.trending) {
            $change = [math]::Round($coin.quote.USD.percent_change_24h, 2)
            $changeColor = if ($change -ge 0) { "Green" } else { "Red" }
            Write-Host "   - $($coin.name) ($($coin.symbol)): `$$([math]::Round($coin.quote.USD.price, 2)) " -NoNewline -ForegroundColor Gray
            Write-Host "($change%25)" -ForegroundColor $changeColor
        }
    } else {
        Write-Host "   ✗ CoinMarketCap API test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ CoinMarketCap API connection failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Optional: Test ADB connection if cloud phones are available
Write-Host "`n5. ADB Connection Test (Optional)" -ForegroundColor Cyan
$testADB = Read-Host "Do you want to test ADB connection to a cloud phone? (y/n)"

if ($testADB -eq 'y' -or $testADB -eq 'Y') {
    try {
        $instances = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/instances?pageSize=10" -Method Get
        
        if ($instances.count -gt 0) {
            $cloudPhone = $instances.instances | Where-Object { $_.enableAdb -and $_.adbInfo.success -eq 1 } | Select-Object -First 1
            
            if ($cloudPhone) {
                Write-Host "   Testing ADB connection to: $($cloudPhone.envName)" -ForegroundColor Gray
                Write-Host "   Device: $($cloudPhone.adbInfo.adbIp):$($cloudPhone.adbInfo.adbPort)" -ForegroundColor Gray
                
                # Test a simple action (scroll)
                $actionTest = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body (@{
                        cloudPhoneId = $cloudPhone.id
                        action = "scroll_feed"
                        params = @{
                            screenWidth = 1080
                            screenHeight = 1920
                        }
                    } | ConvertTo-Json)
                
                if ($actionTest.success) {
                    Write-Host "   ✓ ADB command executed successfully!" -ForegroundColor Green
                    Write-Host "   Executed: $($actionTest.result.action)" -ForegroundColor Gray
                } else {
                    Write-Host "   ✗ ADB command failed" -ForegroundColor Red
                    Write-Host "   Error: $($actionTest.error)" -ForegroundColor Red
                }
            } else {
                Write-Host "   ! No cloud phones with ADB enabled found" -ForegroundColor Yellow
                Write-Host "   Enable ADB on a cloud phone first using:" -ForegroundColor Gray
                Write-Host "   POST $MCP_URL/api/morelogin/adb/enable" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ! No cloud phones available for testing" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ✗ ADB test failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n6. Testing Random Crypto Topic Endpoint..." -ForegroundColor Cyan
try {
    $topic1 = Invoke-RestMethod -Uri "$MCP_URL/api/utils/random-crypto-topic" -Method Get
    $topic2 = Invoke-RestMethod -Uri "$MCP_URL/api/utils/random-crypto-topic" -Method Get
    
    if ($topic1.success -and $topic2.success) {
        Write-Host "   ✓ Random crypto topic endpoint working" -ForegroundColor Green
        Write-Host "   Sample topics: $($topic1.topic), $($topic2.topic)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Random crypto topic endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Failed to get random crypto topics" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Optional: Full Lifecycle and Warm-up Test
Write-Host "`n7. Full Lifecycle and Warm-up Test (Optional)" -ForegroundColor Cyan
$testLifecycle = Read-Host "Do you want to test the full lifecycle (power on/off) and warm-up sequence? This takes ~2-3 minutes (y/n)"

if ($testLifecycle -eq 'y' -or $testLifecycle -eq 'Y') {
    try {
        $instances = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/instances?pageSize=10" -Method Get
        
        if ($instances.count -gt 0) {
            $cloudPhone = $instances.instances[0]
            $phoneId = $cloudPhone.id
            Write-Host "`n   Testing with cloud phone: $($cloudPhone.envName) (ID: $phoneId)" -ForegroundColor Gray
            
            # Step 1: Power on
            Write-Host "`n   Step 1/10: Powering on device..." -ForegroundColor Yellow
            $powerOn = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/poweron" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId } | ConvertTo-Json)
            
            if ($powerOn.success) {
                Write-Host "   ✓ Device powered on" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to power on device" -ForegroundColor Red
                throw "Power on failed"
            }
            
            # Step 2: Wait for boot
            Write-Host "   Step 2/10: Waiting for device to boot (30s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            Write-Host "   ✓ Boot wait complete" -ForegroundColor Green
            
            # Step 3: Enable ADB
            Write-Host "   Step 3/10: Enabling ADB..." -ForegroundColor Yellow
            $enableAdb = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/adb/enable" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneIds = @($phoneId) } | ConvertTo-Json)
            
            if ($enableAdb.success) {
                Write-Host "   ✓ ADB enabled" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to enable ADB" -ForegroundColor Red
                throw "ADB enable failed"
            }
            
            # Step 4: Wait for ADB
            Write-Host "   Step 4/10: Waiting for ADB connection (10s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            Write-Host "   ✓ ADB connection ready" -ForegroundColor Green
            
            # Step 5: Start TikTok
            Write-Host "   Step 5/10: Launching TikTok..." -ForegroundColor Yellow
            $startTikTok = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/start" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId } | ConvertTo-Json)
            
            if ($startTikTok.success) {
                Write-Host "   ✓ TikTok launched" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to launch TikTok" -ForegroundColor Red
                throw "TikTok launch failed"
            }
            
            # Step 6: Wait for app load
            Write-Host "   Step 6/10: Waiting for TikTok to load (5s)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            Write-Host "   ✓ TikTok loaded" -ForegroundColor Green
            
            # Step 7: Test scroll
            Write-Host "   Step 7/10: Testing scroll action..." -ForegroundColor Yellow
            $scroll = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{
                    cloudPhoneId = $phoneId
                    action = "scroll_feed"
                } | ConvertTo-Json)
            
            if ($scroll.success) {
                Write-Host "   ✓ Scroll successful" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Scroll failed" -ForegroundColor Red
            }
            
            Start-Sleep -Seconds 3
            
            # Step 8: Test like
            Write-Host "   Step 8/10: Testing like action..." -ForegroundColor Yellow
            $like = Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{
                    cloudPhoneId = $phoneId
                    action = "like_video"
                } | ConvertTo-Json)
            
            if ($like.success) {
                Write-Host "   ✓ Like successful" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Like failed" -ForegroundColor Red
            }
            
            Start-Sleep -Seconds 3
            
            # Step 9: Test search flow
            Write-Host "   Step 9/10: Testing search flow..." -ForegroundColor Yellow
            $topic = Invoke-RestMethod -Uri "$MCP_URL/api/utils/random-crypto-topic" -Method Get
            Write-Host "   Topic: $($topic.topic)" -ForegroundColor Gray
            
            # Tap search
            Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId; action = "tap_search" } | ConvertTo-Json) | Out-Null
            Start-Sleep -Seconds 1
            
            # Type text
            Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId; action = "type_text"; params = @{ text = $topic.topic } } | ConvertTo-Json) | Out-Null
            Start-Sleep -Seconds 1
            
            # Search enter
            Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId; action = "tap_search_enter" } | ConvertTo-Json) | Out-Null
            Start-Sleep -Seconds 2
            
            # Go back
            Invoke-RestMethod -Uri "$MCP_URL/api/tiktok/action" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId; action = "tap_back" } | ConvertTo-Json) | Out-Null
            
            Write-Host "   ✓ Search flow complete" -ForegroundColor Green
            
            # Step 10: Power off
            Write-Host "   Step 10/10: Powering off device..." -ForegroundColor Yellow
            $powerOff = Invoke-RestMethod -Uri "$MCP_URL/api/morelogin/poweroff" `
                -Method Post `
                -ContentType "application/json" `
                -Body (@{ cloudPhoneId = $phoneId } | ConvertTo-Json)
            
            if ($powerOff.success) {
                Write-Host "   ✓ Device powered off" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to power off device" -ForegroundColor Red
            }
            
            Write-Host "`n   ✓ Full lifecycle and warm-up test PASSED!" -ForegroundColor Green -BackgroundColor Black
            Write-Host "   All actions executed successfully" -ForegroundColor Green
            
        } else {
            Write-Host "   ! No cloud phones available for testing" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "`n   ✗ Lifecycle test FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. If you don't have cloud phones, create one:" -ForegroundColor Gray
Write-Host "   POST $MCP_URL/api/morelogin/create" -ForegroundColor Gray
Write-Host "`n2. Enable ADB for automation:" -ForegroundColor Gray
Write-Host "   POST $MCP_URL/api/morelogin/adb/enable" -ForegroundColor Gray
Write-Host "`n3. Import workflows into n8n:" -ForegroundColor Gray
Write-Host "   - workflows/warmup-workflow.json" -ForegroundColor Gray
Write-Host "   - workflows/content-workflow.json" -ForegroundColor Gray
Write-Host "`n4. For more information:" -ForegroundColor Gray
Write-Host "   See docs/MORELOGIN-API-DOCS.md for complete API reference" -ForegroundColor Gray
Write-Host "   See docs/WARMUP-ACTIONS.md for all available TikTok actions" -ForegroundColor Gray
Write-Host "`nDocumentation: https://support.morelogin.com/en/collections/10925243-api`n" -ForegroundColor Gray

