<#
.SYNOPSIS
    NovWrite Environment Setup Alias (.\envi -> .\run.ps1 envi)
.DESCRIPTION
    Forwards directly to .\run.ps1 envi with all options and arguments.
.EXAMPLE
    .\envi
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") envi @args
