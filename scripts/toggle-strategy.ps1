# Toggle Video Generation Strategy
# Quick script to switch between unique, remix, or ffmpeg strategies

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('unique', 'remix', 'ffmpeg')]
    [string]$Strategy = "unique",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('video_overlay', 'caption_only', 'both')]
    [string]$CtaMode
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Video Strategy Configuration          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Update VIDEO_STRATEGY in .env
$envContent = Get-Content .env
$newContent = @()
$strategyFound = $false

foreach ($line in $envContent) {
    if ($line -match '^VIDEO_STRATEGY=') {
        $newContent += "VIDEO_STRATEGY=$Strategy"
        $strategyFound = $true
        Write-Host "✓ Video strategy set to: $Strategy" -ForegroundColor Green
    } elseif ($CtaMode -and $line -match '^CTA_MODE=') {
        $newContent += "CTA_MODE=$CtaMode"
        Write-Host "✓ CTA mode set to: $CtaMode" -ForegroundColor Green
    } else {
        $newContent += $line
    }
}

# If VIDEO_STRATEGY wasn't found, add it
if (-not $strategyFound) {
    $newContent += ""
    $newContent += "# Video Generation Strategy"
    $newContent += "VIDEO_STRATEGY=$Strategy"
    Write-Host "✓ Video strategy added: $Strategy" -ForegroundColor Green
}

# Write back to .env
$newContent | Set-Content .env

Write-Host ""
Write-Host "Configuration updated!" -ForegroundColor Green
Write-Host ""

# Display current configuration
Write-Host "Current settings:" -ForegroundColor Cyan
Write-Host "  VIDEO_STRATEGY: $Strategy" -ForegroundColor White

if ($CtaMode) {
    Write-Host "  CTA_MODE: $CtaMode" -ForegroundColor White
}

Write-Host ""
Write-Host "Strategy details:" -ForegroundColor Yellow

switch ($Strategy) {
    "unique" {
        Write-Host "  • Generates 10 completely unique videos per topic" -ForegroundColor White
        Write-Host "  • Different visual approaches for each account" -ForegroundColor White
        Write-Host "  • Safest option - lowest detection risk" -ForegroundColor White
        Write-Host "  • Cost: 10x Sora 2 API calls per campaign (~$1.00)" -ForegroundColor White
    }
    "remix" {
        Write-Host "  • Generates 1 master video + 9 Sora remixes" -ForegroundColor White
        Write-Host "  • Variations in color, lighting, effects" -ForegroundColor White
        Write-Host "  • Balanced safety and cost" -ForegroundColor White
        Write-Host "  • Cost: 1 full + 9 remix calls (~$0.55)" -ForegroundColor White
    }
    "ffmpeg" {
        Write-Host "  • Generates 1 video + programmatic variations" -ForegroundColor White
        Write-Host "  • FFmpeg processing for color, speed, effects" -ForegroundColor White
        Write-Host "  • Lowest cost option" -ForegroundColor White
        Write-Host "  • Cost: 1 Sora 2 call (~$0.10)" -ForegroundColor White
        Write-Host "  • NOTE: Not yet implemented - use 'unique' or 'remix'" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Restart MCP server for changes to take effect:" -ForegroundColor Cyan
Write-Host "  .\start-mcp-server.ps1" -ForegroundColor White
Write-Host ""

