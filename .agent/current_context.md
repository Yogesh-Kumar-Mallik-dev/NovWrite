# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.10.5 (Windows PowerShell 5.1 Unicode ANSI Sanitization & Zero Parser Errors).
- **Recent Accomplishments:**
  - **PowerShell Unicode ANSI Sanitization across All `.ps1` Scripts (`dev.ps1`, `test.ps1`, `build.ps1`, `check.ps1`, `flush_db.ps1`)**:
    - Eliminated all multi-byte Unicode emojis in favor of 100% pure ASCII indicator tokens (`[*]`, `[OK]`, `[!]`, `[WARN]`, `->`, `==`), preventing parser errors on legacy Windows-1252 code pages in Windows PowerShell 5.1.
    - Replaced PowerShell 7-only `-Environment` with native parent session environment setting (`$env:EXPO_PORT`, `$env:PORT`, `$env:ENVIRONMENT`), ensuring 100% compatibility across both PowerShell 5.1 and modern PowerShell Core (`pwsh`).
    - Enhanced `Free-Port` helper with deduplicated PID tracking across `Get-NetTCPConnection` and `netstat` fallback queries.
    - Verified 100% cross-platform parity between Unix `.sh` and Windows `.ps1` core scripts.
  - **Codebase Health Verification & Formatting**:
    - Formatted repository using `pnpm format`.
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Maintain 100% cross-platform script parity and strict rule compliance across all future functional changes.
