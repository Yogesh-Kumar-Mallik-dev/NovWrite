<#
.SYNOPSIS
    NovWrite Full Monorepo Build Pipeline (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Staged production build runner for @novwrite/bridge, @novwrite/data-service,
    apps/api, and @novwrite/web.
#>

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] Building NovWrite Monorepo (Production)" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for build toolchain
$requiredTools = @("go", "pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "[!] Error: Build tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

$startTime = [DateTime]::UtcNow

# Step 1: Build Shared Contracts (@novwrite/bridge)
Write-Host "[*] [1/4] @novwrite/bridge: Compiling TypeScript contracts and Zod schemas..." -ForegroundColor Blue
pnpm --filter @novwrite/bridge run build

# Step 2: Build Prisma & Data Service (@novwrite/data-service)
Write-Host "[*] [2/4] @novwrite/data-service: Generating Prisma client & compiling TypeScript data engines..." -ForegroundColor Blue
Push-Location (Join-Path $rootDir "apps/data-service")
try {
    if (-not $env:DATABASE_URL) {
        $env:DATABASE_URL = "postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public"
    }
    pnpm run prisma:generate
    pnpm run build
} finally {
    Pop-Location
}

# Step 3: Build Go API Server (apps/api)
Write-Host "[*] [3/4] apps/api: Compiling Go API Server binary..." -ForegroundColor Blue
$binDir = Join-Path $rootDir "apps/api/bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$exeExt = if ($IsWindows -or ($null -eq $IsWindows -and $env:OS -like "*Windows*")) { ".exe" } else { "" }
$serverExe = Join-Path $binDir "server$exeExt"

Push-Location (Join-Path $rootDir "apps/api")
try {
    go build -ldflags="-s -w" -o $serverExe ./cmd/server/main.go
} finally {
    Pop-Location
}

# Step 4: Build SvelteKit Frontend Workbench (apps/web)
Write-Host "[*] [4/4] @novwrite/web: Building production SvelteKit SSR & client bundle..." -ForegroundColor Blue
pnpm --filter @novwrite/web run build

$endTime = [DateTime]::UtcNow
$duration = [Math]::Round(($endTime - $startTime).TotalSeconds)

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [OK] All NovWrite Packages Built Successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  -> Build Duration: ${duration}s"
Write-Host "  -> Artifacts:"
Write-Host "     - @novwrite/bridge:       packages/bridge/dist"
Write-Host "     - @novwrite/data-service: apps/data-service/dist"
Write-Host "     - apps/api:               apps/api/bin/server$exeExt"
Write-Host "     - @novwrite/web:          apps/web/.svelte-kit/output"
Write-Host "     - @novwrite/desktop:      apps/desktop/src-tauri"
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
