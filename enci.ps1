<#
.SYNOPSIS
    NovWrite Environment Setup Utility (PowerShell / Windows / macOS / Linux)
.DESCRIPTION
    Sets up toolchain, environment files, dependencies, database containers,
    Prisma client, and shared package builds.
#>

param(
    [switch]$SkipDocker,
    [switch]$NoDb,
    [switch]$Reinstall,
    [switch]$Help
)

& (Join-Path $PSScriptRoot "envi.ps1") @PSBoundParameters
