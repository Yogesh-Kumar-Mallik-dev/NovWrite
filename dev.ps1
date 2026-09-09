<#
.SYNOPSIS
    NovWrite Local Development Launcher (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Starts Go API server (8080), SvelteKit Web (5173), Expo Mobile (8081), and
    Tauri Desktop with upfront Expo QR rendering, non-hijacking logging, and graceful exit.
#>

param(
    [switch]$All,
    [switch]$WebOnly,
    [switch]$MobileOnly,
    [switch]$DesktopOnly
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
Set-Location $rootDir

# By default, launch all 3 frontends + API unless restricted by flags
$startMobile = $true
$startDesktop = $true
$startWeb = $true

if ($WebOnly) {
    $startMobile = $false
    $startDesktop = $false
    $startWeb = $true
} elseif ($MobileOnly) {
    $startMobile = $true
    $startDesktop = $false
    $startWeb = $false
} elseif ($DesktopOnly) {
    $startMobile = $false
    $startDesktop = $true
    $startWeb = $true
}

$apiPort = if ($env:PORT) { $env:PORT } else { "8080" }
$webPort = "5173"
$mobilePort = if ($env:EXPO_PORT) { $env:EXPO_PORT } else { "8081" }
$apiHost = "127.0.0.1"
$webHost = "127.0.0.1"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting NovWrite Development Environment" -ForegroundColor Cyan
Write-Host "  🖥️  Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "  📦 Targets: API=on Web=$(if ($startWeb) {'on'} else {'off'}) Mobile=$(if ($startMobile) {'on'} else {'off'}) Desktop=$(if ($startDesktop) {'on'} else {'off'})" -ForegroundColor Cyan
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
if ($startMobile) {
    Free-Port -port $mobilePort -name "Expo Metro Bundler"
}

$mobileProcess = $null
$desktopProcess = $null

$logsDir = Join-Path $rootDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# ------------------------------------------------------------------------------
# STEP 1: If Mobile is enabled, display Expo QR Code upfront & launch non-hijacking Metro
# ------------------------------------------------------------------------------
if ($startMobile) {
    Write-Host "📱 Displaying Expo QR Code upfront before starting service logs..." -ForegroundColor Magenta
    node (Join-Path $rootDir "scripts/show-mobile-qr.mjs")

    Write-Host "🚀 Launching Expo Mobile Metro Bundler in background (logs -> logs/expo.log)..." -ForegroundColor Blue
    $mobileEnv = @{
        CI = "1"
        EXPO_PORT = "$mobilePort"
    }
    $expoLog = Join-Path $logsDir "expo.log"
    $mobileProcess = Start-Process -FilePath "pnpm" -ArgumentList "exec", "expo", "start", "--port", "$mobilePort", "--host", "lan" -WorkingDirectory (Join-Path $rootDir "apps/mobile") -Environment $mobileEnv -RedirectStandardOutput $expoLog -RedirectStandardError $expoLog -PassThru
    
    # Probe Metro until accepting Expo Go connections
    Write-Host "⏳ Waiting for Expo Mobile Metro Bundler to become ready..." -ForegroundColor DarkGray
    $metroReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $headers = @{ "expo-platform" = "android" }
            $response = Invoke-WebRequest -Uri "http://${apiHost}:${mobilePort}" -Headers $headers -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                $metroReady = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }

    if ($metroReady) {
        Write-Host "✅ Expo Mobile Metro Bundler is live and ready for Expo Go! (PID: $($mobileProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expo Metro Bundler took longer than expected to initialize, proceeding..." -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Build & Start Go API Server in background
# ------------------------------------------------------------------------------
Write-Host "📦 Preparing Go API Server on http://${apiHost}:${apiPort}..." -ForegroundColor Blue
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

# ------------------------------------------------------------------------------
# STEP 3: Start SvelteKit Web Workbench in background
# ------------------------------------------------------------------------------
if ($startWeb) {
    Write-Host "🌐 Starting SvelteKit Web Workbench on http://${webHost}:${webPort}..." -ForegroundColor Blue
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
}

# ------------------------------------------------------------------------------
# STEP 4: If Desktop is enabled, start Tauri 2 Native Client
# ------------------------------------------------------------------------------
if ($startDesktop) {
    Write-Host "🖥️  Starting Tauri 2 Native Desktop Client (logs -> logs/desktop.log)..." -ForegroundColor Blue
    $desktopLog = Join-Path $logsDir "desktop.log"
    $desktopProcess = Start-Process -FilePath "pnpm" -ArgumentList "exec", "tauri", "dev", "--no-dev-server" -WorkingDirectory (Join-Path $rootDir "apps/desktop") -RedirectStandardOutput $desktopLog -RedirectStandardError $desktopLog -PassThru
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🌟 NovWrite Development Environment is LIVE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🔗 Web Workbench:   http://${webHost}:${webPort}"
Write-Host "  🔗 API Backend:     http://${apiHost}:${apiPort}"
Write-Host "  🔗 Health Probe:    http://${apiHost}:${apiPort}/healthz"
if ($startMobile) {
    Write-Host "  📱 Mobile (Expo):   http://127.0.0.1:${mobilePort} (QR printed above)"
}
if ($startDesktop) {
    Write-Host "  🖥️  Desktop (Tauri): Active (PID: $($desktopProcess.Id))"
}
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
        if ($mobileProcess -and $mobileProcess.HasExited) {
            Write-Host "⚠️  Expo Mobile Metro Bundler stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        if ($desktopProcess -and $desktopProcess.HasExited) {
            Write-Host "⚠️  Tauri Desktop Client stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n🛑 Initiating graceful shutdown of NovWrite services..." -ForegroundColor Yellow
    if ($desktopProcess -and -not $desktopProcess.HasExited) {
        Stop-Process -Id $desktopProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($mobileProcess -and -not $mobileProcess.HasExited) {
        Stop-Process -Id $mobileProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($webProcess -and -not $webProcess.HasExited) {
        Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✨ All NovWrite development servers stopped cleanly." -ForegroundColor Green
}

