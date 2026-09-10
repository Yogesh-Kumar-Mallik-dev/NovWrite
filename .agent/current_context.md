# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.10.6 (Windows Process Redirection, QR Script Stdio & Monotonic ID Hardening).
- **Recent Accomplishments:**
  - **Windows PowerShell 5.1 & Process Redirection Fixes (`dev.ps1`, `scripts/show-mobile-qr.mjs`, `flush_db.ps1`)**:
    - Resolved `Start-Process` exception in `dev.ps1` by separating stdout/stderr paths (`expo.log`/`expo-error.log`, `desktop.log`/`desktop-error.log`).
    - Replaced `2>/dev/null` shell redirections in `show-mobile-qr.mjs` with pure Node.js stdio options, eliminating Windows `cmd.exe` path errors.
    - Added error exit code checking in `flush_db.ps1` when PostgreSQL service is offline.
  - **Go Backend High-Frequency Monotonic ID Uniqueness (`apps/api`)**:
    - Integrated atomic sequence counters in `GenerateEditID`, `GenerateRevisionID`, and entity/blueprint/timeline stores, guaranteeing 100% unique IDs across fast test loops on Windows with 15ms clock resolution.
  - **Codebase Health Verification & Formatting**:
    - Formatted repository using `pnpm format`.
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Maintain 100% cross-platform script parity and strict rule compliance across all future functional changes.
