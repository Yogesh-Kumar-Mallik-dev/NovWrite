# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.10.9 (1-Click Dependency Installation & Update Utilities).
- **Recent Accomplishments:**
  - **1-Click Dependency Manager (`deps.sh`, `deps.ps1`)**:
    - Created fast, non-blocking dependency manager executing 4 core steps (toolchains, pnpm packages, Go modules, Prisma 8 client generation, internal contract builds) in under 5 seconds.
    - Added `--update` / `-Update` and `--clean` / `-Clean` flags, with optional `--rust` / `-Rust` Cargo verification.
    - Injected automatic `DATABASE_URL` fallback ensuring Prisma client generation succeeds in fresh shells.
  - **OS & Desktop Environment Harmony Engine (`apps/desktop/src-tauri/src/lib.rs`)**:
    - Automatic runtime environment detection: Omarchy Linux & tiling compositors (Hyprland, Sway, i3, bspwm, River, etc.) run with frameless `set_decorations(false)` without titlebar or min/max/close buttons.
    - Windows & macOS & floating Linux DEs (GNOME, KDE Plasma, XFCE) automatically preserve native decorations and window controls.
  - **Codebase Health Verification & Formatting**:
    - Formatted repository using `pnpm format`.
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Maintain 100% cross-platform script parity and strict rule compliance across all future functional changes.
