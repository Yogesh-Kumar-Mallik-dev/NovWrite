<#
.SYNOPSIS
    NovWrite Environment Teardown & Reset Utility (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Stops development servers, shuts down Docker containers, cleans logs, and purges build artifacts.
#>

param(
    [switch]$Volumes,
    [switch]$All,
    [switch]$Deep,
    [switch]$Help
)

& (Join-Path $PSScriptRoot "uenvi.ps1") @PSBoundParameters
