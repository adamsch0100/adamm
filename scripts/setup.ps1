# Setup Script for TikTok Automation System
# This script performs initial setup and validation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TikTok Automation - Setup Script      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0 -or -not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18 or higher from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeMajorVersion -lt 18) {
    Write-Host "ERROR: Node.js version 18 or higher is required!" -ForegroundColor Red
    Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
    Write-Host "Please upgrade Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green

# Check npm
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm $npmVersion detected" -ForegroundColor Green
} else {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Create .env file if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Please edit the .env file and add your API keys!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required API keys:" -ForegroundColor Cyan
    Write-Host "  1. VMOS_API_KEY - From VMOS Cloud dashboard" -ForegroundColor White
    Write-Host "  2. COINMARKETCAP_API_KEY - From https://coinmarketcap.com/api/" -ForegroundColor White
    Write-Host "  3. OPENAI_API_KEY - From https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "  4. ALERT_EMAIL - Your email for notifications" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Create data directory for n8n
if (-Not (Test-Path ".n8n")) {
    New-Item -ItemType Directory -Path ".n8n" | Out-Null
    Write-Host "✓ Created .n8n data directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!                       " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure API keys in .env file:" -ForegroundColor Yellow
Write-Host "   notepad .env" -ForegroundColor White
Write-Host ""
Write-Host "2. Start all services:" -ForegroundColor Yellow
Write-Host "   .\start-all.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. Import workflows into n8n:" -ForegroundColor Yellow
Write-Host "   - Open http://localhost:5678" -ForegroundColor White
Write-Host "   - Go to Workflows > Import" -ForegroundColor White
Write-Host "   - Import warmup-workflow.json" -ForegroundColor White
Write-Host "   - Import content-workflow.json" -ForegroundColor White
Write-Host ""
Write-Host "4. Configure n8n credentials:" -ForegroundColor Yellow
Write-Host "   - Add VMOS API Key credential" -ForegroundColor White
Write-Host "   - Add CoinMarketCap API Key credential" -ForegroundColor White
Write-Host "   - Configure Gmail for notifications" -ForegroundColor White
Write-Host ""
Write-Host "5. Activate workflows and start automation!" -ForegroundColor Yellow
Write-Host ""
Write-Host "For detailed instructions, see README.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"

