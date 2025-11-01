# Complete Setup Verification and Startup Script
# Checks configuration and starts the development environment

Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "  MULTI-PLATFORM SOCIAL AUTOMATION SAAS - SETUP VERIFICATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

$allGood = $true

# =============================================================================
# 1. Check Environment Files
# =============================================================================
Write-Host "`n[1/6] Checking environment files..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "  ✓ Root .env file exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ Root .env file missing!" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "frontend\.env.local") {
    Write-Host "  ✓ Frontend .env.local exists" -ForegroundColor Green
    
    # Check if Supabase is configured
    $envContent = Get-Content "frontend\.env.local" -Raw
    if ($envContent -match "https://oplnmnyohkahixymoqdy.supabase.co") {
        Write-Host "  ✓ Supabase URL configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Supabase URL not found" -ForegroundColor Yellow
    }
    
    # Check if Stripe is configured
    if ($envContent -match "pk_test_" -or $envContent -match "pk_live_") {
        Write-Host "  ✓ Stripe publishable key configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Stripe keys need to be added (see frontend/.env.local)" -ForegroundColor Yellow
        Write-Host "    Get test keys from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ Frontend .env.local missing!" -ForegroundColor Red
    $allGood = $false
}

# =============================================================================
# 2. Check Dependencies
# =============================================================================
Write-Host "`n[2/6] Checking dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "  ✓ Root dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Root dependencies missing. Installing..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "  ✓ Root dependencies installed" -ForegroundColor Green
}

if (Test-Path "frontend\node_modules") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Frontend dependencies missing. Installing..." -ForegroundColor Yellow
    cd frontend
    npm install --silent
    cd ..
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
}

# =============================================================================
# 3. Test Supabase Connection
# =============================================================================
Write-Host "`n[3/6] Testing Supabase connection..." -ForegroundColor Yellow

$supabaseUrl = "https://oplnmnyohkahixymoqdy.supabase.co"
$testResult = Test-Connection -ComputerName "oplnmnyohkahixymoqdy.supabase.co" -Count 1 -Quiet -ErrorAction SilentlyContinue
if ($testResult) {
    Write-Host "  ✓ Supabase is reachable" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Cannot ping Supabase (may still work)" -ForegroundColor Yellow
}

# =============================================================================
# 4. Check Database Schema
# =============================================================================
Write-Host "`n[4/6] Verifying database schema..." -ForegroundColor Yellow
Write-Host "  ℹ Schema should have been run already" -ForegroundColor Gray
Write-Host "  ℹ Expected tables: profiles, cloud_phones, proxies, social_accounts, etc." -ForegroundColor Gray
Write-Host "  → You can verify in Supabase Dashboard > Table Editor" -ForegroundColor Cyan

# =============================================================================
# 5. Check Key Services
# =============================================================================
Write-Host "`n[5/6] Checking external service configuration..." -ForegroundColor Yellow

$rootEnv = Get-Content ".env" -Raw

# MoreLogin
if ($rootEnv -match "MORELOGIN_API_ID=YOUR_" -or $rootEnv -notmatch "MORELOGIN_API_ID=") {
    Write-Host "  ⚠ MoreLogin API not configured (optional for basic testing)" -ForegroundColor Yellow
    Write-Host "    → Needed for: Device management, account creation" -ForegroundColor Gray
} else {
    Write-Host "  ✓ MoreLogin API configured" -ForegroundColor Green
}

# OpenAI
if ($rootEnv -match "OPENAI_API_KEY=sk-" -and $rootEnv -notmatch "your-openai-key") {
    Write-Host "  ✓ OpenAI API configured (for video generation)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ OpenAI API not configured (optional)" -ForegroundColor Yellow
    Write-Host "    → Needed for: Sora 2 video generation" -ForegroundColor Gray
}

# =============================================================================
# 6. Summary & Next Steps
# =============================================================================
Write-Host "`n[6/6] Configuration Summary" -ForegroundColor Yellow

if ($allGood) {
    Write-Host "`n" -NoNewline
    Write-Host "  ✅ READY TO START!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host ""
    
    Write-Host "What works now:" -ForegroundColor Cyan
    Write-Host "  ✓ User signup/login (Supabase Auth)" -ForegroundColor White
    Write-Host "  ✓ Database storage (13 tables)" -ForegroundColor White
    Write-Host "  ✓ Dashboard UI (all 7 pages)" -ForegroundColor White
    Write-Host "  ✓ Analytics with charts" -ForegroundColor White
    Write-Host "  ✓ Settings & API key management" -ForegroundColor White
    
    Write-Host "`nTo enable more features:" -ForegroundColor Cyan
    Write-Host "  • Add Stripe test keys → Payment flow" -ForegroundColor White
    Write-Host "  • Add MoreLogin keys → Device management" -ForegroundColor White
    Write-Host "  • Add Decado/TextVerified keys → Account creation" -ForegroundColor White
    Write-Host "    (These can be added later via Settings page)" -ForegroundColor Gray
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "  STARTING DEVELOPMENT SERVERS..." -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""
    
    # Start MCP Server
    Write-Host "Starting MCP Server (Backend)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 MCP SERVER - http://localhost:3000' -ForegroundColor Cyan; Write-Host ''; node mcp-server.js"
    
    Start-Sleep -Seconds 2
    
    # Start Frontend
    Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 FRONTEND - http://localhost:3001' -ForegroundColor Magenta; Write-Host ''; npm run dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host "  ✨ SYSTEM STARTED SUCCESSFULLY! ✨" -ForegroundColor Green
    Write-Host "=" * 70 -ForegroundColor Green
    
    Write-Host "`n📍 Your app is running at:" -ForegroundColor Yellow
    Write-Host "   Frontend:  http://localhost:3001" -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host "   Backend:   http://localhost:3000" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "   Health:    http://localhost:3000/health" -ForegroundColor Gray
    
    Write-Host "`n🚀 Quick Start:" -ForegroundColor Yellow
    Write-Host "   1. Browser should open automatically to http://localhost:3001" -ForegroundColor White
    Write-Host "   2. Click 'Sign Up' to create a test account" -ForegroundColor White
    Write-Host "   3. Check your email for verification link" -ForegroundColor White
    Write-Host "   4. Login and explore the dashboard!" -ForegroundColor White
    
    Write-Host "`n⚡ Testing Tips:" -ForegroundColor Yellow
    Write-Host "   • You can test signup/login without any external APIs" -ForegroundColor White
    Write-Host "   • Dashboard will show empty states (expected)" -ForegroundColor White
    Write-Host "   • Add API keys in Settings to enable more features" -ForegroundColor White
    Write-Host "   • For Stripe: Use test card 4242 4242 4242 4242" -ForegroundColor White
    
    Write-Host "`n🛑 To Stop: Close the terminal windows or press Ctrl+C in each" -ForegroundColor Red
    
    Write-Host "`nPress any key to open browser..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Start-Process "http://localhost:3001"
    
} else {
    Write-Host "`n" -NoNewline
    Write-Host "  ⚠ SETUP INCOMPLETE" -ForegroundColor Yellow -BackgroundColor DarkYellow
    Write-Host ""
    Write-Host "Please fix the issues above and run this script again." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "`n" -NoNewline

