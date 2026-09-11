<#
.SYNOPSIS
    NovWrite Environment Setup Utility (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Sets up toolchain, environment files, dependencies, database containers,
    Prisma client, and shared package builds.
#>

param(
    [switch]$SkipDocker,
    [switch]$NoDb,
    [switch]$Reinstall,
    [switch]$Help
)

if ($Help) {
    Write-Host "NovWrite Environment Setup Utility"
    Write-Host "Usage: .\envi.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipDocker    Skip starting PostgreSQL & Redis Docker containers"
    Write-Host "  -NoDb          Skip database schema synchronization"
    Write-Host "  -Reinstall     Force clean re-installation of dependencies"
    Write-Host "  -Help          Display this help message"
    exit 0
}

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] Setting Up NovWrite Development Environment" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight toolchain check
# ------------------------------------------------------------------------------
Write-Host "[*] [1/6] Checking required toolchain dependencies..." -ForegroundColor Blue
$requiredTools = @("node", "pnpm", "go", "git")
$missingTools = @()

foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Host "[!] Error: The following required tools are missing from PATH:" -ForegroundColor Red
    foreach ($tool in $missingTools) {
        Write-Host "   - $tool" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install the missing tools and re-run .\envi.ps1." -ForegroundColor Yellow
    Write-Host "Refer to docs/ONBOARDING.md for platform-specific installation instructions." -ForegroundColor Yellow
    exit 1
}

$nodeVer = node -v
$pnpmVer = pnpm -v
Write-Host "  -> Node.js: $nodeVer"
Write-Host "  -> pnpm:    v$pnpmVer"
Write-Host "  -> Go:      installed"

# ------------------------------------------------------------------------------
# STEP 2: Initialize directories and .env configuration
# ------------------------------------------------------------------------------
Write-Host "[*] [2/6] Initializing directories and environment configuration..." -ForegroundColor Blue
$dirsToCreate = @(
    (Join-Path $rootDir "bin"),
    (Join-Path $rootDir "logs"),
    (Join-Path $rootDir "apps/api/bin")
)
foreach ($dir in $dirsToCreate) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$envFile = Join-Path $rootDir ".env"
$envExample = Join-Path $rootDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Host "  -> Creating .env from .env.example..."
        Copy-Item -Path $envExample -Destination $envFile
    } else {
        Write-Host "  -> Creating default .env configuration..."
        $defaultEnv = @"
PORT=8080
ENVIRONMENT=development
LOG_LEVEL=debug
DATA_SERVICE_ADDR=localhost:50051
POSTGRES_USER=novwrite
POSTGRES_PASSWORD=novwrite_dev
POSTGRES_DB=novwrite_db
POSTGRES_PORT=5433
DATABASE_URL=postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24
"@
        Set-Content -Path $envFile -Value $defaultEnv
    }
    Write-Host "  [OK] .env initialized successfully." -ForegroundColor Green
} else {
    Write-Host "  [OK] .env file already exists." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 3: Install Monorepo Node & Go dependencies
# ------------------------------------------------------------------------------
Write-Host "[*] [3/6] Installing Monorepo Node.js & Go dependencies..." -ForegroundColor Blue
if ($Reinstall) {
    Write-Host "  -> Reinstalling pnpm dependencies with fresh cache..."
    pnpm install --force
} else {
    pnpm install
}

Write-Host "  -> Downloading Go backend module dependencies..."
Push-Location (Join-Path $rootDir "apps/api")
try {
    go mod download
} finally {
    Pop-Location
}
Write-Host "  [OK] Dependencies installed successfully." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: Start Docker infrastructure (PostgreSQL 18 + Redis 7.2)
# ------------------------------------------------------------------------------
Write-Host "[*] [4/6] Initializing database & cache infrastructure..." -ForegroundColor Blue
$dockerAvailable = $false
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    $dockerAvailable = $true
}

if (-not $SkipDocker -and $dockerAvailable) {
    $dockerComposeCmd = $null
    try {
        docker compose version | Out-Null
        $dockerComposeCmd = "docker compose"
    } catch {
        if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
            $dockerComposeCmd = "docker-compose"
        }
    }

    if ($dockerComposeCmd) {
        Write-Host "  -> Starting PostgreSQL and Redis containers in background..."
        & ($dockerComposeCmd.Split(' ')) up -d postgres redis
        Start-Sleep -Seconds 2
        Write-Host "  [OK] Database and cache containers triggered." -ForegroundColor Green
    }
} elseif ($SkipDocker) {
    Write-Host "  [*] Skipping Docker container startup (-SkipDocker specified)." -ForegroundColor DarkGray
} else {
    Write-Host "  [WARN] Docker not detected in PATH. Ensure PostgreSQL (port 5433) and Redis (port 6379) are running natively." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 5: Generate Prisma Client & Sync Database Schema
# ------------------------------------------------------------------------------
Write-Host "[*] [5/6] Generating Prisma client & synchronizing database schema..." -ForegroundColor Blue
$pgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "novwrite" }
$pgPass = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "novwrite_dev" }
$pgPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5433" }
$pgDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "novwrite_db" }
$env:DATABASE_URL = "postgresql://${pgUser}:${pgPass}@localhost:${pgPort}/${pgDb}?schema=public"

Push-Location (Join-Path $rootDir "apps/data-service")
try {
    pnpm run prisma:generate
} finally {
    Pop-Location
}

if (-not $NoDb) {
    try {
        pnpm --filter @novwrite/data-service exec prisma db push --accept-data-loss 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] PostgreSQL database schema synchronized cleanly." -ForegroundColor Green
        } else {
            Write-Host "  [*] Database server not reachable right now; schema push deferred until database starts." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "  [*] Database schema push deferred." -ForegroundColor DarkGray
    }
}

# ------------------------------------------------------------------------------
# STEP 6: Compile shared monorepo packages
# ------------------------------------------------------------------------------
Write-Host "[*] [6/6] Compiling shared packages and contracts..." -ForegroundColor Blue
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/data-service build

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [OK] NovWrite Environment Setup Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  -> Start Development Servers:  .\script.ps1 dev"
Write-Host "  -> Run Full Test Suite:        .\script.ps1 test"
Write-Host "  -> Run Typechecks:             .\script.ps1 check"
Write-Host "  -> Teardown / Reset:           .\script.ps1 uenvi"
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
