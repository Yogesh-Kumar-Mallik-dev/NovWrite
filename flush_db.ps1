<#
.SYNOPSIS
    NovWrite Flush DB Alias (.\flush_db -> .\run.ps1 flush_db)
.DESCRIPTION
    Forwards directly to .\run.ps1 flush_db with all options and arguments.
.EXAMPLE
    .\flush_db
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") flush_db @args
