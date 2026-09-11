<#
.SYNOPSIS
    NovWrite Environment Teardown Alias (.\uenvi -> .\run.ps1 uenvi)
.DESCRIPTION
    Forwards directly to .\run.ps1 uenvi with all options and arguments.
.EXAMPLE
    .\uenvi
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") uenvi @args
