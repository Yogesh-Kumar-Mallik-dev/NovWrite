<#
.SYNOPSIS
    NovWrite Dependencies Alias (.\deps -> .\run.ps1 deps)
.DESCRIPTION
    Forwards directly to .\run.ps1 deps with all options and arguments.
.EXAMPLE
    .\deps
    .\deps -Update
    .\deps -Clean
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") deps @args
