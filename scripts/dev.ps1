<#
.SYNOPSIS
    NovWrite Local Development Launcher (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Starts Go API server (8080), SvelteKit Web (5173), Expo Mobile (8081), and
    Tauri Desktop with upfront Expo QR rendering, non-hijacking logging, and graceful exit.
#>

param(
    [switch]$All,
    [switch]$Tunnel,
    [switch]$Clear,
    [switch]$WebOnly,
    [switch]$MobileOnly,
    [switch]$DesktopOnly,
    [switch]$ApiOnly,
    [switch]$NoDesktop,
    [switch]$NoMobile
)

$ErrorActionPreference = "Stop"
$rootDir = (Split-Path $PSScriptRoot -Parent)
Set-Location $rootDir

# By default, launch all 3 frontends + API unless restricted by flags
$startMobile = $true
$startDesktop = $true
$startWeb = $true
$startApi = $true

if ($WebOnly) {
    $startMobile = $false
    $startDesktop = $false
    $startWeb = $true
    $startApi = $true
} elseif ($MobileOnly) {
    $startMobile = $true
    $startDesktop = $false
    $startWeb = $false
    $startApi = $true
} elseif ($DesktopOnly) {
    $startMobile = $false
    $startDesktop = $true
    $startWeb = $true
    $startApi = $true
} elseif ($ApiOnly) {
    $startMobile = $false
    $startDesktop = $false
    $startWeb = $false
    $startApi = $true
}

if ($NoDesktop) {
    $startDesktop = $false
}
if ($NoMobile) {
    $startMobile = $false
}

$apiPort = if ($env:PORT) { $env:PORT } else { "8080" }
$webPort = "5173"
$mobilePort = if ($env:EXPO_PORT) { $env:EXPO_PORT } else { "8081" }
$apiHost = "127.0.0.1"
$webHost = "127.0.0.1"

# Automatically add standard Cargo bin directory to PATH if not already present
$userProfileDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)
$cargoBin = Join-Path $userProfileDir ".cargo\bin"
if ((Test-Path $cargoBin) -and ($env:PATH -notlike "*$cargoBin*")) {
    $env:PATH = "$cargoBin;$env:PATH"
}

# Check Rust/Cargo toolchain for Desktop if requested
if ($startDesktop) {
    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        if ($DesktopOnly) {
            Write-Error "[!] Error: Rust/Cargo is required to run Tauri Desktop in -DesktopOnly mode. Please install Rust from https://rustup.rs."
            exit 1
        } else {
            Write-Host "[WARN] Rust/Cargo toolchain not detected in PATH. Tauri Desktop client will be skipped." -ForegroundColor Yellow
            Write-Host "[INFO] To enable the native Desktop window, install Rust from: https://rustup.rs" -ForegroundColor DarkGray
            $startDesktop = $false
        }
    }
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] Starting NovWrite Development Environment" -ForegroundColor Cyan
Write-Host "  [*] Platform: PowerShell / Cross-Platform" -ForegroundColor Cyan
Write-Host "  [*] Targets: API=on Web=$(if ($startWeb) {'on'} else {'off'}) Mobile=$(if ($startMobile) {'on'} else {'off'}) Desktop=$(if ($startDesktop) {'on'} else {'off'})" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Pre-flight check for required tools
$requiredTools = @("go", "pnpm", "node")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "[!] Error: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# Cross-platform port freeing function
function Free-Port($port, $name) {
    $pidsKilled = @{}
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0 -and -not $pidsKilled.ContainsKey($pidToKill)) {
                    Write-Host "[!] Port $port is in use (PID: $pidToKill). Terminating stale $name process..." -ForegroundColor Yellow
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
                    Write-Host "[!] Port $port is in use (PID: $p). Terminating stale $name process..." -ForegroundColor Yellow
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                    $pidsKilled[$p] = $true
                }
            }
        }
    } catch {}
}

Free-Port -port $apiPort -name "Go API Server"
if ($startWeb) {
    Free-Port -port $webPort -name "SvelteKit Web Client"
}
if ($startMobile) {
    Free-Port -port $mobilePort -name "Expo Metro Bundler"
}

# Cross-platform child process launcher that supports Windows batch/script runners (pnpm/npm)
function Start-MonorepoChildProcess($command, $arguments, $workingDirectory, $redirectOut = $null, $redirectErr = $null) {
    $isWin = $IsWindows -or ($null -eq $IsWindows -and $env:OS -like "*Windows*")
    if ($isWin) {
        $cmdExe = if ($env:ComSpec) { $env:ComSpec } else { "cmd.exe" }
        $cmdArgs = @("/c", $command) + $arguments
        $params = @{
            FilePath = $cmdExe
            ArgumentList = $cmdArgs
            WorkingDirectory = $workingDirectory
            PassThru = $true
        }
        if ($redirectOut) { $params["RedirectStandardOutput"] = $redirectOut }
        if ($redirectErr) { $params["RedirectStandardError"] = $redirectErr }
        return Start-Process @params
    } else {
        $params = @{
            FilePath = $command
            ArgumentList = $arguments
            WorkingDirectory = $workingDirectory
            PassThru = $true
        }
        if ($redirectOut) { $params["RedirectStandardOutput"] = $redirectOut }
        if ($redirectErr) { $params["RedirectStandardError"] = $redirectErr }
        return Start-Process @params
    }
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
    Write-Host "[*] Displaying Expo QR Code upfront before starting service logs..." -ForegroundColor Magenta
    node (Join-Path $rootDir "scripts/show-mobile-qr.mjs")

    Write-Host "[*] Launching Expo Mobile Metro Bundler in background (logs -> logs/expo.log)..." -ForegroundColor Blue
    $env:EXPO_PORT = "$mobilePort"
    if ($Tunnel) {
        $env:EXPO_TUNNEL = "1"
    }
    $expoArgs = @("exec", "expo", "start", "--port", "$mobilePort")
    if ($Tunnel) { $expoArgs += "--tunnel" } else { $expoArgs += @("--host", "lan") }
    if ($Clear) { $expoArgs += "--clear" }

    $expoLog = Join-Path $logsDir "expo.log"
    $expoErrLog = Join-Path $logsDir "expo-error.log"
    $mobileProcess = Start-MonorepoChildProcess -command "pnpm" -arguments $expoArgs -workingDirectory (Join-Path $rootDir "apps/mobile") -redirectOut $expoLog -redirectErr $expoErrLog
    
    # Probe Metro until accepting Expo Go connections
    Write-Host "[*] Waiting for Expo Mobile Metro Bundler to become ready..." -ForegroundColor DarkGray
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
        Write-Host "[OK] Expo Mobile Metro Bundler is live and ready for Expo Go! (PID: $($mobileProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Expo Metro Bundler took longer than expected to initialize, proceeding..." -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------------------------
# STEP 2: Build & Start Go API Server in background
# ------------------------------------------------------------------------------
Write-Host "[*] Preparing Go API Server on http://${apiHost}:${apiPort}..." -ForegroundColor Blue
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

$env:PORT = "$apiPort"
$env:ENVIRONMENT = "development"

$apiProcess = Start-Process -FilePath $apiExe -WorkingDirectory (Join-Path $rootDir "apps/api") -PassThru

# Probe Go API health endpoint until ready
Write-Host "[*] Waiting for Go API server to become ready..." -ForegroundColor DarkGray
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
    Write-Host "[OK] Go API Server is live and healthy! (PID: $($apiProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "[WARN] Go API Server took longer than expected to report healthy, proceeding..." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 3: Start SvelteKit Web Workbench in background
# ------------------------------------------------------------------------------
if ($startWeb) {
    Write-Host "[*] Starting SvelteKit Web Workbench on http://${webHost}:${webPort}..." -ForegroundColor Blue
    $webArgs = @("exec", "vite", "dev", "--host", $webHost, "--port", $webPort)
    $webProcess = Start-MonorepoChildProcess -command "pnpm" -arguments $webArgs -workingDirectory (Join-Path $rootDir "apps/web")

    # Probe Web Server until accepting connections
    Write-Host "[*] Waiting for SvelteKit Web Workbench to initialize..." -ForegroundColor DarkGray
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
        Write-Host "[OK] SvelteKit Web Workbench is live! (PID: $($webProcess.Id))" -ForegroundColor Green
    }
}

# ------------------------------------------------------------------------------
# STEP 4: If Desktop is enabled, start Tauri 2 Native Client
# ------------------------------------------------------------------------------
if ($startDesktop) {
    Write-Host "[*] Starting Tauri 2 Native Desktop Client..." -ForegroundColor Blue
    Write-Host "[*] Compiling & launching native binary (logs -> logs/desktop.log)..." -ForegroundColor DarkGray
    $desktopLog = Join-Path $logsDir "desktop.log"
    $desktopErrLog = Join-Path $logsDir "desktop-error.log"
    if (Test-Path $desktopLog) { Remove-Item $desktopLog -Force -ErrorAction SilentlyContinue }
    if (Test-Path $desktopErrLog) { Remove-Item $desktopErrLog -Force -ErrorAction SilentlyContinue }
    $desktopArgs = @("exec", "tauri", "dev")
    $desktopProcess = Start-MonorepoChildProcess -command "pnpm" -arguments $desktopArgs -workingDirectory (Join-Path $rootDir "apps/desktop") -redirectOut $desktopLog -redirectErr $desktopErrLog
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [*] NovWrite Development Environment is LIVE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
if ($startWeb) {
    Write-Host "  -> Web Workbench:   http://${webHost}:${webPort}"
}
Write-Host "  -> API Backend:     http://${apiHost}:${apiPort}"
Write-Host "  -> Health Probe:    http://${apiHost}:${apiPort}/healthz"
if ($startMobile) {
    Write-Host "  -> Mobile (Expo):   http://127.0.0.1:${mobilePort} (QR printed above)"
}
if ($startDesktop) {
    Write-Host "  -> Desktop (Tauri): Active (PID: $($desktopProcess.Id))"
}
Write-Host "  [!] Press Ctrl+C at any time for graceful shutdown"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Graceful cleanup on exit
try {
    while ($true) {
        if ($apiProcess -and $apiProcess.HasExited) {
            Write-Host "[!] Go API server stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        if ($webProcess -and $webProcess.HasExited) {
            Write-Host "[!] SvelteKit Web server stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        if ($mobileProcess -and $mobileProcess.HasExited) {
            Write-Host "[!] Expo Mobile Metro Bundler stopped unexpectedly." -ForegroundColor Yellow
            break
        }
        if ($desktopProcess -and $desktopProcess.HasExited) {
            $exitCode = $desktopProcess.ExitCode
            if ($null -ne $exitCode -and $exitCode -ne 0) {
                Write-Host "[!] Tauri Desktop process exited with code $exitCode." -ForegroundColor Yellow
                if (Test-Path $desktopErrLog) {
                    $errSnippet = Get-Content $desktopErrLog -Tail 10 -ErrorAction SilentlyContinue
                    if ($errSnippet) {
                        Write-Host "[!] Desktop error log snippet:" -ForegroundColor Yellow
                        $errSnippet | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
                    }
                }
            } else {
                Write-Host "[*] Tauri Desktop Client closed." -ForegroundColor Cyan
            }
            if ($DesktopOnly) {
                break
            } else {
                Write-Host "[*] Keeping SvelteKit Web and Go API servers active." -ForegroundColor Cyan
                $desktopProcess = $null
            }
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "[!] Initiating graceful shutdown of NovWrite services..." -ForegroundColor Yellow
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
    Free-Port -port $apiPort -name "Go API Server"
    if ($startWeb) {
        Free-Port -port $webPort -name "SvelteKit Web Client"
    }
    if ($startMobile) {
        Free-Port -port $mobilePort -name "Expo Metro Bundler"
    }
    Write-Host "[OK] All NovWrite development servers stopped cleanly." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Cyan
}

