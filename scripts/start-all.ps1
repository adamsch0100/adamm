# Start All Services for TikTok Automation
# This script starts both the MCP server and n8n in separate windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TikTok Automation - Start All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your API keys." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command:" -ForegroundColor Green
    Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start MCP Server in a new window
Write-Host "1. Starting MCP Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "start-mcp-server.ps1"
Start-Sleep -Seconds 3

# Start n8n in a new window
Write-Host "2. Starting n8n..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "start-n8n.ps1"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Services Started Successfully!    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Yellow
Write-Host "  MCP Server: http://localhost:3000" -ForegroundColor White
Write-Host "  n8n:        http://localhost:5678" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open n8n at http://localhost:5678" -ForegroundColor White
Write-Host "  2. Import warmup-workflow.json" -ForegroundColor White
Write-Host "  3. Import content-workflow.json" -ForegroundColor White
Write-Host "  4. Configure credentials in n8n" -ForegroundColor White
Write-Host "  5. Activate the workflows" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in the service windows to stop them." -ForegroundColor Yellow
Write-Host ""

