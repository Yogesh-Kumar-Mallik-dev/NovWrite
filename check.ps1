<#
.SYNOPSIS
    NovWrite Typecheck & Health Verification Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\check.ps1"
& $targetScript @args
