<#
.SYNOPSIS
    NovWrite Build Pipeline Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\build.ps1"
& $targetScript @args
