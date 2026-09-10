<#
.SYNOPSIS
    NovWrite Environment Setup Utility Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\envi.ps1"
& $targetScript @args
