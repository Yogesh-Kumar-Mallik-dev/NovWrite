# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), strict `<type>(<domain>): <expression>` commit message structure, 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.10.9 (1-Click Dependency Installation & Update Utilities).
- **Recent Accomplishments & Enforcement Checkpoints:**
  - **1-Click Scripts as Section 1 Obvious First Choice (`README.md`, `docs/ONBOARDING.md`)**:
    - Restructured both `README.md` and `docs/ONBOARDING.md` so **Section 1 is the 1-Click Quickstart** (`./envi.sh` / `.\envi.ps1`, `./dev.sh` / `.\dev.ps1`, `./deps.sh` / `.\deps.ps1`) directly at the top of the files.
    - Placed workstation toolchains, OS prerequisites, and manual step-by-step installation below the 1-click launch as secondary alternatives.
  - **Commit Structure Strict Enforcement**:
    - Strict `<type>(<domain>): <expression>` commit format applied with GPG signature (`git commit -S`) and verified before remote push.
  - **1-Click Dependency Manager (`deps.sh`, `deps.ps1`)**:
    - Fast, non-blocking dependency manager executing toolchains, pnpm packages, Go modules, Prisma 8 client generation, and internal contract builds in under 5 seconds.
  - **Documentation & Test Parity**:
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Maintain strict single-change isolation and `<type>(<domain>): <expression>` signed commit discipline on all tasks.
