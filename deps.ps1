<#
.SYNOPSIS
    NovWrite Dependency Manager Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\deps.ps1"
& $targetScript @args
