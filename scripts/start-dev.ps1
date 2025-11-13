# Start Development Environment
# Run this script to start both frontend and backend

Write-Host "🚀 Starting Multi-Platform Social Automation SaaS Development Environment" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists in frontend
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check environment variables
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  Warning: .env.local not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.local.example" "frontend\.env.local"
    Write-Host "✅ Created .env.local - Please configure it before using the app!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Starting services:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   - Backend MCP Server: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start backend in background
Write-Host "🔧 Starting MCP Server (backend)..." -ForegroundColor Cyan
$mcpJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node mcp-server.js
}

# Give backend time to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "⚛️  Starting Next.js Frontend..." -ForegroundColor Cyan
Set-Location frontend
try {
    npm run dev
} finally {
    # Cleanup: Stop backend when frontend stops
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    Stop-Job $mcpJob
    Remove-Job $mcpJob
    Write-Host "✅ All services stopped" -ForegroundColor Green
}


















