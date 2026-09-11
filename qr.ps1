<#
.SYNOPSIS
    NovWrite QR Code Alias (.\qr -> .\run.ps1 qr)
.DESCRIPTION
    Forwards directly to .\run.ps1 qr with all options and arguments.
.EXAMPLE
    .\qr
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
& (Join-Path $rootDir "run.ps1") qr @args
