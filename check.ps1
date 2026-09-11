<#
.SYNOPSIS
    NovWrite Check Alias (.\check -> .\run.ps1 check)
.DESCRIPTION
    Forwards directly to .\run.ps1 check with all options and arguments.
.EXAMPLE
    .\check
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") check @args
