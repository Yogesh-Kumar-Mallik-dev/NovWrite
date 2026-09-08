<#
.SYNOPSIS
    NovWrite Local Development Launcher (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Starts Go API server (port 8080) and SvelteKit Web Client (port 5173)
    with graceful startup probing, port clearing, and signal-trapped shutdown.
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
Set-Location $rootDir

$apiPort = if ($env:PORT) { $env:PORT } else { "8080" }
$webPort = "5173"
$apiHost = "127.0.0.1"
$webHost = "127.0.0.1"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting NovWrite Development Environment" -ForegroundColor Cyan
Write-Host "  🖥️  Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for required tools
$requiredTools = @("go", "pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "❌ Error: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# Cross-platform port freeing function
function Free-Port($port, $name) {
    try {
        if ($IsWindows -or ($null -eq $IsWindows -and $env:OS -like "*Windows*")) {
            $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            if ($connections) {
                foreach ($conn in $connections) {
                    $pidToKill = $conn.OwningProcess
                    if ($pidToKill -gt 0) {
                        Write-Host "⚠️  Port $port is in use (PID: $pidToKill). Terminating stale $name process..." -ForegroundColor Yellow
                        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        }
    } catch {
        # Fallback to netstat if Get-NetTCPConnection fails
        $netstatOut = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING\s+(\d+)"
        foreach ($match in $netstatOut) {
            if ($match.Matches[0].Groups[1].Value) {
                $p = [int]$match.Matches[0].Groups[1].Value
                if ($p -gt 0) {
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
}

Free-Port -port $apiPort -name "Go API Server"
Free-Port -port $webPort -name "SvelteKit Web Client"

# 1. Build & Start Go API Server in background
Write-Host "📦 [1/2] Preparing Go API Server on http://${apiHost}:${apiPort}..." -ForegroundColor Blue
$binDir = Join-Path $rootDir "bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$exeExt = if ($IsWindows -or ($null -eq $IsWindows -and $env:OS -like "*Windows*")) { ".exe" } else { "" }
$apiExe = Join-Path $binDir "api-server$exeExt"

Push-Location (Join-Path $rootDir "apps/api")
try {
    go build -o $apiExe ./cmd/server/main.go
} finally {
    Pop-Location
}

$apiEnv = @{
    PORT = "$apiPort"
    ENVIRONMENT = "development"
}

$apiProcess = Start-Process -FilePath $apiExe -WorkingDirectory (Join-Path $rootDir "apps/api") -Environment $apiEnv -PassThru

# Probe Go API health endpoint until ready
Write-Host "⏳ Waiting for Go API server to become ready..." -ForegroundColor DarkGray
$apiReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://${apiHost}:${apiPort}/healthz" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 300
    }
}

if ($apiReady) {
    Write-Host "✅ Go API Server is live and healthy! (PID: $($apiProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "⚠️  Go API Server took longer than expected to report healthy, proceeding..." -ForegroundColor Yellow
}

# 2. Start SvelteKit Web Workbench in background
Write-Host "🌐 [2/2] Starting SvelteKit Web Workbench on http://${webHost}:${webPort}..." -ForegroundColor Blue
$webProcess = Start-Process -FilePath "pnpm" -ArgumentList "exec", "vite", "dev", "--host", $webHost, "--port", $webPort -WorkingDirectory (Join-Path $rootDir "apps/web") -PassThru

# Probe Web Server until accepting connections
Write-Host "⏳ Waiting for SvelteKit Web Workbench to initialize..." -ForegroundColor DarkGray
$webReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://${webHost}:${webPort}" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            $webReady = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 300
    }
}

if ($webReady) {
    Write-Host "✅ SvelteKit Web Workbench is live! (PID: $($webProcess.Id))" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🌟 NovWrite Development Environment is LIVE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🔗 Web Workbench: http://${webHost}:${webPort}"
Write-Host "  🔗 API Backend:   http://${apiHost}:${apiPort}"
Write-Host "  🔗 Health Probe:  http://${apiHost}:${apiPort}/healthz"
Write-Host "  🛑 Press Ctrl+C at any time for graceful shutdown"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Graceful cleanup on exit
try {
    while ($true) {
        if ($apiProcess.HasExited) {
            Write-Host "⚠️  Go API server stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        if ($webProcess.HasExited) {
            Write-Host "⚠️  SvelteKit Web server stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n🛑 Initiating graceful shutdown of NovWrite services..." -ForegroundColor Yellow
    if ($webProcess -and -not $webProcess.HasExited) {
        Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✨ All NovWrite development servers stopped cleanly." -ForegroundColor Green
}
