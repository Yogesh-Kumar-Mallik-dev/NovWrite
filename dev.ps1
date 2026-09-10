<#
.SYNOPSIS
    NovWrite Local Development Launcher Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\dev.ps1"
& $targetScript @args
