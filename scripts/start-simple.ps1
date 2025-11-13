# Simple Startup Script for Development
# No fancy checks, just starts the servers

Write-Host ""
Write-Host "Starting MCP Server (Backend) on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node mcp-server.js"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend (Next.js) on port 3001..." -ForegroundColor Magenta  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "System Started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "Backend:  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "Press any key to close this window (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


















