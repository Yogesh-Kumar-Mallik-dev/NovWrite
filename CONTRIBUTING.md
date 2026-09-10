# Contributing to NovWrite

Thank you for your interest in contributing to **NovWrite**! We welcome contributions from authors, worldbuilders, and software engineers.

This document outlines our engineering standards, development workflow, commit conventions, testing pipelines, and pull request guidelines.

---

## 1. Code of Conduct & Core Principles

- **Constructive Collaboration:** Be respectful, inclusive, and professional.
- **Canon Over Assumptions:** Canonical universe state is stored deterministically in PostgreSQL; never trust client-side or unverified inputs.
- **Strict Single-Change Policy:** Every Pull Request or task must address strictly **one atomic concern** (a single feature, bug fix, or refactor). Do not bundle unrelated changes.
- **Zero-Badge UI Policy:** Badges, chips, and pill tags are prohibited across the UI (except for raw data tables when explicitly necessary). Use semantic icons, action buttons, accessible breadcrumbs, and slide-over drawers instead.
- **Documentation Parity:** When changing backend routes, database schemas, or CLI commands, update all corresponding documentation in `docs/` in the same commit.

---

## 2. Workstation Setup & Prerequisites

Ensure your machine meets the required toolchains:

- **Go:** `1.23+` (`go version`)
- **Node.js:** `22+ LTS` (`node -v`)
- **pnpm:** `9+` or `10+` (`pnpm -v`)
- **Docker & Docker Compose:** Container engine for PostgreSQL 18 and Redis 7.2
- **Git:** Configured with GPG commit signing

For detailed OS-specific installation instructions (Ubuntu, Debian, Fedora, macOS, Windows PowerShell / WSL2), read the **[NovWrite Developer Onboarding Guide](docs/ONBOARDING.md)**.

---

## 3. Local Development Workflows

### 3.1. Clone & Bootstrap

```bash
git clone https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite.git
cd NovWrite

# Install all monorepo workspace dependencies
pnpm install

# Copy environment variables configuration
cp .env.example .env
```

### 3.2. 1-Click Development Server

NovWrite provides universal cross-platform lifecycle scripts:

- **Linux / macOS / Windows (Git Bash / WSL):**

  ```bash
  # Boots PostgreSQL, Redis, Go API Backend (:8080), and SvelteKit Web (:5173)
  ./dev.sh
  ```

- **Windows (PowerShell):**
  ```powershell
  .\dev.ps1
  ```

---

## 4. Git Branching & Two-Front Architecture

NovWrite maintains two autonomous engineering fronts across dedicated git branches:

- **`world` Branch:** Universe schemas, dynamic blueprints, AST formula engine, timeline event sourcing, and the deterministic State Fold Engine.
- **`novel` Branch:** Prose Studio, manuscript tree, rich text editors, collaborative scene leases, and multi-author presence.
- **`main` Branch:** Production-ready baseline integrating both fronts through typed `@novwrite/bridge` contracts.

### Branching Convention:

- `feat/<domain>-<short-description>` (e.g. `feat/formula-cycle-detector`, `feat/auth-superadmin-gate`)
- `fix/<domain>-<short-description>` (e.g. `fix/entity-lowercase-keys`, `fix/manifest-404`)
- `docs/<short-description>` (e.g. `docs/standards-and-anti-patterns`)

---

## 5. Commit Standards & GPG Signing

### 5.1. Conventional Commit Format

All commits must strictly follow the conventional commit structure:

```text
<type>(<scope>): <short imperative description>

[optional body explaining rationale and non-obvious context]
```

#### Allowed Types:

- `feat`: A new feature or domain capability.
- `fix`: A bug fix or invariant patch.
- `docs`: Documentation updates only.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding or modifying test suites.
- `chore`: Build script, toolchain, or dependency updates.

#### Example:

```bash
git commit -S -m "feat(universe): enforce deterministic DAG cycle detection in formulas"
```

### 5.2. Mandatory GPG Commit Signing

All commits **must be cryptographically signed** with GPG:

```bash
git commit -S -m "..."
```

---

## 6. Testing & Quality Assurance Pipeline

Before submitting a Pull Request, you must run the project diagnostics and 5-phase test runner. Both must pass with **0 errors and 0 warnings**.

### 6.1. Diagnostic Typecheck (`./check.sh` / `.\check.ps1`)

Typechecks `@novwrite/bridge`, `@novwrite/data-service`, and `@novwrite/web` with `svelte-check` and `tsc --noEmit`.

```bash
./check.sh
```

### 6.2. 6-Phase Unified Test Runner (`./test.sh` / `.\test.ps1`)

Executes the entire monorepo test suite across all 6 verification phases:

```text
Phase 1: @novwrite/bridge Contract & Mock Suite
Phase 2: @novwrite/data-service Dynamic Schemas & State Fold Engine (41 unit tests)
Phase 3: Go API Backend Handlers & Middlewares Suite
Phase 4: @novwrite/web Frontend Formula & Project Engines (29 Vitest/Node tests)
Phase 5: @novwrite/mobile Client Engines & Telemetry (11 unit tests)
Phase 6: SvelteKit & Monorepo Diagnostic Typecheck
```

```bash
./test.sh
```

---

## 7. Documentation Standards

All documentation contributions must adhere to **[`docs/DOCUMENTATION_STANDARDS.md`](docs/DOCUMENTATION_STANDARDS.md)**:

- Zero AI buzzwords or hollow marketing language.
- Zero lazy `// TODO` or `...` stubs in code examples.
- All commands and routes must match real codebase implementations.
- Include failure modes, status codes, and RFC 7807 problem details.

---

## 8. Pull Request Checklist

When opening a Pull Request, ensure:

- [ ] Branch is rebased onto the latest target branch (`world`, `novel`, or `main`).
- [ ] Commits are GPG signed (`git commit -S`).
- [ ] `./check.sh` passes with **0 errors and 0 warnings**.
- [ ] `./test.sh` passes all 5 test phases.
- [ ] Documentation in `docs/` is updated to reflect any API, schema, or UI changes.
- [ ] `changes.md` records the release changes.
- [ ] PR description includes the exact rationale, components touched, and verification output.
