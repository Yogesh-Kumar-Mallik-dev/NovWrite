<#
.SYNOPSIS
    NovWrite Environment Teardown Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\uenvi.ps1"
& $targetScript @args
