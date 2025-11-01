# Start n8n Workflow Automation Platform
# This script starts the n8n server for managing TikTok automation workflows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      n8n Workflow Platform Starter     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your settings." -ForegroundColor Yellow
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

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Check if tunnel mode is enabled
$tunnelMode = [System.Environment]::GetEnvironmentVariable("N8N_TUNNEL_MODE", "Process")

# Start n8n
Write-Host "Starting n8n..." -ForegroundColor Green
Write-Host ""

if ($tunnelMode -eq "true") {
    Write-Host "Tunnel mode enabled - n8n will be accessible via public URL" -ForegroundColor Yellow
    npm run n8n:tunnel
} else {
    Write-Host "Starting in local mode" -ForegroundColor Yellow
    Write-Host "Access n8n at: http://localhost:5678" -ForegroundColor Cyan
    Write-Host ""
    npm run n8n
}

