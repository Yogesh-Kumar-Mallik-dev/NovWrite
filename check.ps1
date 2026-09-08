<#
.SYNOPSIS
    NovWrite Typecheck & Health Verification Runner (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Typechecks @novwrite/bridge, @novwrite/data-service, and @novwrite/web.
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🔍 Typechecking NovWrite Monorepo" -ForegroundColor Cyan
Write-Host "  🖥️  Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for required tools
$requiredTools = @("pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "❌ Error: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

Write-Host "🔹 [1/3] Typechecking @novwrite/bridge..." -ForegroundColor Blue
pnpm --filter @novwrite/bridge build

Write-Host "🔹 [2/3] Typechecking @novwrite/data-service..." -ForegroundColor Blue
pnpm --filter @novwrite/data-service build

Write-Host "🔹 [3/3] Typechecking @novwrite/web..." -ForegroundColor Blue
pnpm --filter @novwrite/web check

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ✅ All packages typechecked cleanly with 0 errors!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
