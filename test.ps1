<#
.SYNOPSIS
    NovWrite Test Alias (.\test -> .\run.ps1 test)
.DESCRIPTION
    Forwards directly to .\run.ps1 test with all options and arguments.
.EXAMPLE
    .\test
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") test @args
