<#
.SYNOPSIS
    NovWrite Unified Monorepo CLI & Script Orchestrator (PowerShell)
.DESCRIPTION
    Single root entrypoint for launching dev servers, tests, builds,
    environment setups, and database resets.
.EXAMPLE
    .\run.ps1 dev
    .\run.ps1 test
    .\run.ps1 build
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = "dev",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
$scriptsDir = Join-Path $rootDir "scripts"

function Show-Help {
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "  [*] NovWrite Unified Monorepo CLI (PowerShell)" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "Usage: .\run.ps1 <command> [options]`n"
    Write-Host "Core Commands:"
    Write-Host "  dev           Launch dev servers (Go API, Web, Mobile, Desktop)"
    Write-Host "  build         Build production artifacts across all packages"
    Write-Host "  check         Run static typechecks & monorepo diagnostics"
    Write-Host "  test          Run full 6-phase test suite across all packages"
    Write-Host "  deps          Install & update dependencies (pnpm, Go, Prisma)"
    Write-Host "  envi          1-Click environment bootstrap (Docker, DB, builds)"
    Write-Host "  uenvi         1-Click environment teardown & container shutdown"
    Write-Host "  flush-db      Clean-slate flush of Redis cache & PostgreSQL tables"
    Write-Host "  qr            Render Expo terminal QR code for mobile testing"
    Write-Host "  help          Display this help menu`n"
    Write-Host "Examples:"
    Write-Host "  .\run.ps1 dev                # Launch all services"
    Write-Host "  .\run.ps1 dev -MobileOnly    # Launch mobile only"
    Write-Host "  .\run.ps1 test               # Run 6-phase test suite"
    Write-Host "  .\run.ps1 check              # Typecheck all packages"
    Write-Host "==================================================================" -ForegroundColor Cyan
}

switch ($Command.ToLower()) {
    "dev" {
        & (Join-Path $scriptsDir "dev.ps1") @ScriptArgs
    }
    "build" {
        & (Join-Path $scriptsDir "build.ps1") @ScriptArgs
    }
    "check" {
        & (Join-Path $scriptsDir "check.ps1") @ScriptArgs
    }
    "test" {
        & (Join-Path $scriptsDir "test.ps1") @ScriptArgs
    }
    "deps" {
        & (Join-Path $scriptsDir "deps.ps1") @ScriptArgs
    }
    { $_ -in "envi", "enci" } {
        & (Join-Path $scriptsDir "envi.ps1") @ScriptArgs
    }
    { $_ -in "uenvi", "uenci" } {
        & (Join-Path $scriptsDir "uenvi.ps1") @ScriptArgs
    }
    { $_ -in "flush-db", "flush_db", "flush" } {
        & (Join-Path $scriptsDir "flush_db.ps1") @ScriptArgs
    }
    { $_ -in "qr", "mobile:qr" } {
        node (Join-Path $scriptsDir "show-mobile-qr.mjs")
    }
    { $_ -in "help", "--help", "-h" } {
        Show-Help
    }
    default {
        $targetScript = Join-Path $scriptsDir "$Command.ps1"
        if (Test-Path $targetScript) {
            & $targetScript @ScriptArgs
        } else {
            Write-Host "[!] Unknown command '$Command'." -ForegroundColor Red
            Write-Host "Run '.\run.ps1 help' for available commands."
            exit 1
        }
    }
}
