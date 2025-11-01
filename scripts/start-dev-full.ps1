# Full Development Startup Script
# Starts MCP server, Frontend, and shows useful info

Write-Host "`n🚀 Starting Multi-Platform Social Automation SaaS..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if .env files exist
Write-Host "`n📋 Checking environment files..." -ForegroundColor Yellow

$rootEnvExists = Test-Path ".env"
$frontendEnvExists = Test-Path "frontend\.env.local"

if (-not $rootEnvExists) {
    Write-Host "❌ Root .env file not found!" -ForegroundColor Red
    Write-Host "   Create .env file with your API keys" -ForegroundColor Yellow
    Write-Host "   See README.md for required variables" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not $frontendEnvExists) {
    Write-Host "❌ frontend\.env.local not found!" -ForegroundColor Red
    Write-Host "   Create frontend\.env.local with Supabase & Stripe keys" -ForegroundColor Yellow
    Write-Host "   Copy from frontend\.env.local.example" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Environment files found" -ForegroundColor Green

# Check if node_modules exist
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Root dependencies not installed. Installing..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "⚠️  Frontend dependencies not installed. Installing..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Start MCP Server
Write-Host "`n🔧 Starting MCP Server (Backend)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 MCP SERVER' -ForegroundColor Cyan; node mcp-server.js"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend (Next.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 FRONTEND' -ForegroundColor Magenta; npm run dev"

# Display info
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ SYSTEM STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n📍 ENDPOINTS:" -ForegroundColor Yellow
Write-Host "   Frontend:    http://localhost:3001" -ForegroundColor White
Write-Host "   MCP Server:  http://localhost:3000" -ForegroundColor White
Write-Host "   Health Check: http://localhost:3000/health" -ForegroundColor White

Write-Host "`n🔑 QUICK ACTIONS:" -ForegroundColor Yellow
Write-Host "   1. Open browser to http://localhost:3001" -ForegroundColor White
Write-Host "   2. Sign up for an account" -ForegroundColor White
Write-Host "   3. Configure API keys in Settings" -ForegroundColor White
Write-Host "   4. Create your first device" -ForegroundColor White
Write-Host "   5. Create a social account" -ForegroundColor White

Write-Host "`n📚 DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "   README.md - Overview & quick start" -ForegroundColor White
Write-Host "   SETUP-GUIDE.md - Detailed setup instructions" -ForegroundColor White
Write-Host "   DEPLOYMENT.md - Production deployment" -ForegroundColor White
Write-Host "   workflows/ - n8n automation workflows" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   - Make sure Supabase is set up (run supabase-schema.sql)" -ForegroundColor White
Write-Host "   - Configure API keys: MoreLogin, Decado, TextVerified, OpenAI" -ForegroundColor White
Write-Host "   - For n8n workflows: Import from workflows/ folder" -ForegroundColor White

Write-Host "`n🛑 TO STOP:" -ForegroundColor Red
Write-Host "   Close all PowerShell windows or press Ctrl+C in each" -ForegroundColor White

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "💡 Tip: Check the separate terminal windows for logs" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`nPress any key to open browser..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:3001"

Write-Host "`n✨ Happy automating! ✨`n" -ForegroundColor Magenta













