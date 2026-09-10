<#
.SYNOPSIS
    NovWrite Environment Teardown & Reset Utility (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Stops development servers, shuts down Docker containers, cleans logs, and purges build artifacts.
#>

param(
    [switch]$Volumes,
    [switch]$All,
    [switch]$Deep,
    [switch]$Help
)

if ($Help) {
    Write-Host "NovWrite Environment Teardown & Clean Reset Utility"
    Write-Host "Usage: .\uenvi.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Volumes    Remove PostgreSQL and Redis Docker data volumes"
    Write-Host "  -All, -Deep Full deep clean: stop services, remove volumes, and purge node_modules"
    Write-Host "  -Help       Display this help message"
    exit 0
}

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

$removeVolumes = $Volumes -or $All -or $Deep
$deepClean = $All -or $Deep

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] NovWrite Environment Teardown & Clean Reset" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 1: Terminate active development processes & free ports
# ------------------------------------------------------------------------------
Write-Host "[*] [1/4] Stopping running NovWrite dev servers & freeing ports..." -ForegroundColor Blue

function Free-Port($port, $name) {
    $pidsKilled = @{}
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0 -and -not $pidsKilled.ContainsKey($pidToKill)) {
                    Write-Host "  -> Terminating $name (PID: $pidToKill)..." -ForegroundColor Yellow
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    $pidsKilled[$pidToKill] = $true
                }
            }
        }
    } catch {}

    try {
        $netstatOut = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING\s+(\d+)"
        foreach ($match in $netstatOut) {
            if ($match.Matches[0].Groups[1].Value) {
                $p = [int]$match.Matches[0].Groups[1].Value
                if ($p -gt 0 -and -not $pidsKilled.ContainsKey($p)) {
                    Write-Host "  -> Terminating $name (PID: $p)..." -ForegroundColor Yellow
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                    $pidsKilled[$p] = $true
                }
            }
        }
    } catch {}
}

Free-Port -port 8080 -name "Go API Server"
Free-Port -port 5173 -name "SvelteKit Web Client"
Free-Port -port 8081 -name "Expo Mobile Metro Bundler"
Write-Host "  [OK] Server processes checked and terminated." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 2: Shutdown Docker services
# ------------------------------------------------------------------------------
Write-Host "[*] [2/4] Shutting down Docker containers..." -ForegroundColor Blue
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
    if ($removeVolumes) {
        Write-Host "  -> Stopping containers and removing data volumes (-Volumes specified)..."
        & ($dockerComposeCmd.Split(' ')) down -v --remove-orphans 2>$null | Out-Null
    } else {
        Write-Host "  -> Stopping containers (preserving data volumes)..."
        & ($dockerComposeCmd.Split(' ')) down --remove-orphans 2>$null | Out-Null
    }
    Write-Host "  [OK] Docker services stopped." -ForegroundColor Green
} else {
    Write-Host "  [*] Docker not detected or not active; skipping container shutdown." -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# STEP 3: Clean build artifacts, logs, and temporary caches
# ------------------------------------------------------------------------------
Write-Host "[*] [3/4] Cleaning build artifacts and log files..." -ForegroundColor Blue
$pathsToClean = @(
    (Join-Path $rootDir "logs\*"),
    (Join-Path $rootDir "bin\*"),
    (Join-Path $rootDir "apps/api/bin\*"),
    (Join-Path $rootDir "packages/bridge/dist"),
    (Join-Path $rootDir "apps/data-service/dist"),
    (Join-Path $rootDir "apps/web/.svelte-kit"),
    (Join-Path $rootDir "apps/web/build")
)

foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  [OK] Build artifacts and logs purged." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: Deep clean (node_modules) if requested
# ------------------------------------------------------------------------------
if ($deepClean) {
    Write-Host "[*] [4/4] Deep cleaning node_modules and dependency locks (-All specified)..." -ForegroundColor Blue
    $nodeModuleDirs = @(
        (Join-Path $rootDir "node_modules"),
        (Join-Path $rootDir "apps/web/node_modules"),
        (Join-Path $rootDir "apps/mobile/node_modules"),
        (Join-Path $rootDir "apps/desktop/node_modules"),
        (Join-Path $rootDir "apps/data-service/node_modules"),
        (Join-Path $rootDir "packages/bridge/node_modules")
    )

    foreach ($nm in $nodeModuleDirs) {
        if (Test-Path $nm) {
            Write-Host "  -> Removing $nm..."
            Remove-Item -Path $nm -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "  [OK] All node_modules removed." -ForegroundColor Green
} else {
    Write-Host "[*] [4/4] Skipping node_modules purge (use -All or -Deep for deep clean)." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [OK] NovWrite Environment Successfully Teardown & Reset!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  -> To set up the environment again, run:  .\envi.ps1"
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
