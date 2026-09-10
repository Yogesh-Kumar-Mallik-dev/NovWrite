# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), strict `<type>(<domain>): <expression>` commit message structure, 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.10.9 (1-Click Dependency Installation & Update Utilities).
- **Recent Accomplishments & Enforcement Checkpoints:**
  - **Dependency Workflow Focus (First-Time Clone vs Repo Update)**:
    - Explicitly highlighted across `README.md`, `docs/ONBOARDING.md`, `CONTRIBUTING.md`, and `docs/recommended_commands.md`:
      - **First-Time Clone (Mandatory)**: Run `./deps.sh` / `.\deps.ps1` (or `./envi.sh` / `.\envi.ps1`) to orchestrate all pnpm, Go, Prisma, and bridge dependencies.
      - **Updating Repo (After `git pull`)**: Run the exact same command in update mode: `./deps.sh --update` / `.\deps.ps1 -Update`.
    - Positioned 1-click launch as Section 1 at the top, with manual alternatives documented below.
  - **Commit Structure Strict Enforcement**:
    - Strict `<type>(<domain>): <expression>` commit format applied with GPG signature (`git commit -S`) and verified before remote push.
  - **1-Click Dependency Manager (`deps.sh`, `deps.ps1`)**:
    - Fast, non-blocking dependency manager executing toolchains, pnpm packages, Go modules, Prisma 8 client generation, and internal contract builds in under 5 seconds.
  - **Documentation & Test Parity**:
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Maintain strict single-change isolation and `<type>(<domain>): <expression>` signed commit discipline on all tasks.
