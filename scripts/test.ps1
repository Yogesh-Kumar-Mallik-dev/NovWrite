<#
.SYNOPSIS
    NovWrite Test Suite Runner (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Runs all test suites across @novwrite/bridge, @novwrite/data-service, apps/api, and @novwrite/web.
#>

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] Running All NovWrite Test Suites" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for test toolchain
$requiredTools = @("go", "pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "[!] Error: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# 1. Test Bridge Contracts
Write-Host "`n[*] [1/6] Testing @novwrite/bridge Contracts & Schemas..." -ForegroundColor Blue
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/bridge test

# 2. Test Data Service Domain Engines
Write-Host "`n[*] [2/6] Testing @novwrite/data-service Domain Engines..." -ForegroundColor Blue
pnpm --filter @novwrite/data-service build
pnpm --filter @novwrite/data-service test

# 3. Test Go API Backend
Write-Host "`n[*] [3/6] Testing Go API Backend & HTTP Handlers..." -ForegroundColor Blue
Push-Location (Join-Path $rootDir "apps/api")
try {
    go test ./...
} finally {
    Pop-Location
}

# 4. Test Web Frontend Engines & Utilities
Write-Host "`n[*] [4/6] Testing @novwrite/web Frontend Engines & Utilities..." -ForegroundColor Blue
pnpm --filter @novwrite/web test

# 5. Test Mobile Client Engines & Telemetry
Write-Host "`n[*] [5/6] Testing @novwrite/mobile Client Engines & Telemetry..." -ForegroundColor Blue
node --test apps/mobile/src/__tests__/mobileEngine.test.ts

# 6. Typecheck Frontend
Write-Host "`n[*] [6/6] Typechecking Frontend Web Application..." -ForegroundColor Blue
pnpm --filter @novwrite/web check

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [OK] All test suites passed successfully with 0 errors!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
