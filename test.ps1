<#
.SYNOPSIS
    NovWrite Test Suite Runner Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\test.ps1"
& $targetScript @args
