<#
.SYNOPSIS
    NovWrite Dependency Manager (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Installs and updates Node.js (pnpm), Go modules, and Prisma client.
.PARAMETER Update
    Updates dependencies across pnpm and Go modules to latest allowed versions.
.PARAMETER Clean
    Prunes pnpm store caches before installing dependencies.
.PARAMETER Rust
    Also verifies or updates Cargo desktop crates for Tauri.
#>

param(
    [switch]$Update,
    [switch]$Clean,
    [switch]$Rust
)

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

$actionName = if ($Update) { "Updating" } else { "Installing" }

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] $actionName NovWrite Monorepo Dependencies" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Auto-inject standard Cargo bin directory to PATH if present
$userProfileDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)
$cargoBin = Join-Path $userProfileDir ".cargo\bin"
if ((Test-Path $cargoBin) -and ($env:PATH -notlike "*$cargoBin*")) {
    $env:PATH = "$cargoBin;$env:PATH"
}

# Fallback default development database connection URL for Prisma generation
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public"
}

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight toolchain check
# ------------------------------------------------------------------------------
Write-Host "[1/4] Checking core toolchains..." -ForegroundColor Blue
$requiredTools = @("node", "pnpm", "go", "git")
$missingTools = @()

foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        $missingTools += $tool
    }
}

if ($missingTools.Count -gt 0) {
    Write-Error "[!] Error: The following required tools are missing from PATH: $($missingTools -join ', ')"
    exit 1
}

$nodeVer = node -v 2>$null
$pnpmVer = pnpm -v 2>$null
$goVer = go version 2>$null
Write-Host "  [OK] Node.js: $nodeVer" -ForegroundColor Green
Write-Host "  [OK] pnpm:    v$pnpmVer" -ForegroundColor Green
Write-Host "  [OK] Go:      $goVer" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 2: Node.js & pnpm Workspace Dependencies
# ------------------------------------------------------------------------------
Write-Host ""
if ($Update) {
    Write-Host "[2/4] Updating pnpm workspace dependencies..." -ForegroundColor Blue
    pnpm update
} else {
    Write-Host "[2/4] Installing pnpm workspace dependencies..." -ForegroundColor Blue
    if ($Clean) {
        Write-Host "  [*] Cleaning pnpm store cache..." -ForegroundColor DarkGray
        pnpm store prune 2>$null
    }
    pnpm install --frozen-lockfile=false
}
Write-Host "  [OK] Node.js workspace dependencies ready." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: Go API Backend Modules
# ------------------------------------------------------------------------------
Write-Host ""
$apiDir = Join-Path $rootDir "apps/api"
if ($Update) {
    Write-Host "[3/4] Updating Go API modules..." -ForegroundColor Blue
    Push-Location $apiDir
    try {
        go get -u ./... 2>$null
        go mod tidy
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[3/4] Downloading and verifying Go API modules..." -ForegroundColor Blue
    Push-Location $apiDir
    try {
        go mod download
        go mod tidy
    } finally {
        Pop-Location
    }
}
Write-Host "  [OK] Go API dependencies ready." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: Prisma 8 Client Generation & Internal Contracts Build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Generating Prisma 8 client and compiling internal packages..." -ForegroundColor Blue
pnpm --filter @novwrite/data-service run prisma:generate
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/data-service build
Write-Host "  [OK] Prisma client and internal contracts ready." -ForegroundColor Green

# ------------------------------------------------------------------------------
# OPTIONAL STEP: Rust & Cargo Desktop Crates (-Rust)
# ------------------------------------------------------------------------------
if ($Rust) {
    Write-Host ""
    Write-Host "[Optional] Verifying Cargo desktop crates..." -ForegroundColor Blue
    $desktopTauriDir = Join-Path $rootDir "apps/desktop/src-tauri"
    if ((Get-Command cargo -ErrorAction SilentlyContinue) -and (Test-Path $desktopTauriDir)) {
        Push-Location $desktopTauriDir
        try {
            if ($Update) {
                cargo update
            } else {
                cargo check
            }
        } finally {
            Pop-Location
        }
        Write-Host "  [OK] Rust desktop crates ready." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Cargo toolchain not detected in PATH; skipping Rust crates." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
if ($Update) {
    Write-Host "  [*] All dependencies successfully updated!" -ForegroundColor Green
} else {
    Write-Host "  [*] All dependencies successfully installed!" -ForegroundColor Green
}
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Next steps:"
Write-Host "    - Run '.\dev.ps1' to start the development servers"
Write-Host "    - Run '.\check.ps1' to run type checks and lints"
Write-Host "    - Run '.\test.ps1' to run all monorepo test suites"
Write-Host "========================================================" -ForegroundColor Cyan
