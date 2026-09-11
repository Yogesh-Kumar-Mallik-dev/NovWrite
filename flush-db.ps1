<#
.SYNOPSIS
    NovWrite Flush DB Alias (.\flush-db -> .\run.ps1 flush-db)
.DESCRIPTION
    Forwards directly to .\run.ps1 flush-db with all options and arguments.
.EXAMPLE
    .\flush-db
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") flush-db @args
