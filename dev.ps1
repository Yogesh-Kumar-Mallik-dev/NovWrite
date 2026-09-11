<#
.SYNOPSIS
    NovWrite Development Server Alias (.\dev -> .\run.ps1 dev)
.DESCRIPTION
    Forwards directly to .\run.ps1 dev with all options and arguments.
.EXAMPLE
    .\dev
    .\dev -MobileOnly
    .\dev -All
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") dev @args
