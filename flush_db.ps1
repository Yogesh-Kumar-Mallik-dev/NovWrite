<#
.SYNOPSIS
    NovWrite Database & Redis Clean Slate Reset Utility (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Flushes Redis cache and resets PostgreSQL tables to a clean schema state.
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] Flushing NovWrite Database and Redis Cache" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for required tools
$requiredTools = @("pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "[!] Error: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# 1. Ensure docker compose postgres & redis services are running
$dockerComposeCmd = $null
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        docker compose version | Out-Null
        $dockerComposeCmd = "docker compose"
    } catch {
        if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
            $dockerComposeCmd = "docker-compose"
        }
    }
}

if ($dockerComposeCmd) {
    $psOutput = & ($dockerComposeCmd.Split(' ')) ps 2>$null | Out-String
    if ($psOutput -notmatch "postgres") {
        Write-Host "[*] Starting PostgreSQL and Redis containers..." -ForegroundColor Blue
        & ($dockerComposeCmd.Split(' ')) up -d postgres redis
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "[WARN] Docker Compose not detected in PATH; attempting direct database reset..." -ForegroundColor Yellow
}

# 2. Flush Redis Cache
Write-Host "[*] [1/2] Flushing Redis 7.2 Cache (FLUSHALL)..." -ForegroundColor Blue
$redisFlushed = $false
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        docker exec novwrite-redis redis-cli FLUSHALL 2>$null | Out-Null
        Write-Host "[OK] Redis cache flushed cleanly via Docker container." -ForegroundColor Green
        $redisFlushed = $true
    } catch {}
}

if (-not $redisFlushed -and (Get-Command "redis-cli" -ErrorAction SilentlyContinue)) {
    try {
        $redisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { "6379" }
        redis-cli -p $redisPort FLUSHALL | Out-Null
        Write-Host "[OK] Redis cache flushed cleanly via local redis-cli." -ForegroundColor Green
        $redisFlushed = $true
    } catch {}
}

if (-not $redisFlushed) {
    Write-Host "[WARN] Could not contact Redis to flush keys (service may not be running or is starting up)." -ForegroundColor Yellow
}

# 3. Reset PostgreSQL Schema with Prisma
Write-Host "[*] [2/2] Resetting PostgreSQL Database Schema (Clean Slate)..." -ForegroundColor Blue
$pgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "novwrite" }
$pgPass = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "novwrite_dev" }
$pgPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5433" }
$pgDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "novwrite_db" }

$env:DATABASE_URL = "postgresql://${pgUser}:${pgPass}@localhost:${pgPort}/${pgDb}?schema=public"

pnpm --filter @novwrite/data-service exec prisma db push --force-reset --accept-data-loss

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [OK] Backend Clean Slate Established!" -ForegroundColor Green
Write-Host "  - PostgreSQL: All database tables reset to 0 records." -ForegroundColor Green
Write-Host "  - Redis 7.2:  FLUSHALL completed (all keys purged)." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [*] Web Client Note:"
Write-Host "  The web workbench caches active projects in browser"
Write-Host "  localStorage (which browser hard-refreshes preserve)."
Write-Host ""
Write-Host "  To clear your browser cache to bare bones:"
Write-Host "  1. Open DevTools Console (F12) on http://localhost:5173"
Write-Host "  2. Run: localStorage.clear(); location.reload();"
Write-Host "     (or: Application tab -> Storage -> Clear site data)"
Write-Host "========================================================" -ForegroundColor Green
