<#
.SYNOPSIS
    NovWrite Build Alias (.\build -> .\run.ps1 build)
.DESCRIPTION
    Forwards directly to .\run.ps1 build with all options and arguments.
.EXAMPLE
    .\build
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") build @args
