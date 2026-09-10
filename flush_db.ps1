<#
.SYNOPSIS
    NovWrite Database & Redis Clean Slate Reset Entrypoint Forwarder
#>
$ErrorActionPreference = "Stop"
$targetScript = Join-Path $PSScriptRoot "scripts\flush_db.ps1"
& $targetScript @args
