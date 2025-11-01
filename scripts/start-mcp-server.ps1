# Start MCP Server for TikTok Automation
# This script starts the MCP server that provides API endpoints for n8n workflows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TikTok Automation MCP Server Starter  " -ForegroundColor Cyan
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

# Start the MCP server
Write-Host "Starting MCP Server..." -ForegroundColor Green
Write-Host ""
node mcp-server.js

