# Recommended Development Commands

A comprehensive cheat-sheet of essential commands for installing dependencies, building, testing, linting, and running **NovWrite**.

---

## 1. Cross-Platform Dependency Installation Cheat Sheet

### 1.1. Linux (Ubuntu / Debian)

```bash
# Core Tools, Go, Node.js 22 LTS, pnpm, Docker, Protoc & Buf
sudo apt-get update && sudo apt-get install -y curl wget git build-essential make protobuf-compiler
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
corepack enable && corepack prepare pnpm@latest --activate
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### 1.2. macOS (Homebrew)

```bash
# Install toolchain and compilers via Homebrew
brew install go node@22 pnpm protobuf bufbuild/buf/buf protoc-gen-go protoc-gen-go-grpc git make
brew install --cask docker
```

### 1.3. Windows (Winget / PowerShell as Admin)

```powershell
# Install toolchain and compilers via Winget
winget install --id Git.Git -e; winget install --id GoLang.Go -e; winget install --id OpenJS.NodeJS.LTS -e; winget install --id pnpm.pnpm -e; winget install --id Google.Protobuf -e; winget install --id BufBuild.Buf -e; winget install --id Docker.DockerDesktop -e
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### 1.4. Verify All Installations

```bash
go version && node -v && pnpm -v && docker --version && protoc --version && buf --version
```

---

## 2. Top-Level Monorepo Orchestration Scripts

All lifecycle commands are executed via the single unified entrypoint (`./script.sh <cmd>` on Linux/macOS/WSL or `.\script.ps1 <cmd>` on Windows PowerShell), orchestrating all tasks from `scripts/` while keeping the root clean.

### 2.1. Bash / Zsh (Linux, macOS, Windows Git Bash / WSL)

```bash
# 🚀 1-Click Development Server (API + Web)
./script.sh dev                    # or: pnpm dev

# 🌐📱🖥️ Launch All 3 Clients (API + Web + Expo Mobile + Tauri Desktop)
# Renders Expo QR code upfront and streams Web/Tauri logs cleanly without terminal hijacking
./script.sh dev --all              # or: ./script.sh dev -a

# 📱 Launch API + Web + Mobile Expo Studio (with upfront QR code)
./script.sh dev --mobile           # or: ./script.sh dev -m

# 🖥️ Launch API + Web + Tauri Desktop Client
./script.sh dev --desktop          # or: ./script.sh dev -d

# 🏗️ 1-Click Monorepo Build (bridge contracts, data-service dist, Go api binary, web bundle)
./script.sh build                  # or: pnpm build

# 🔍 1-Click Monorepo Diagnostics & Typecheck (verifies all TS and Svelte diagnostics across packages)
./script.sh check                  # or: pnpm check

# 🧪 1-Click 6-Phase Test Runner (bridge -> data-service -> Go backend -> web tests -> mobile tests -> typecheck)
./script.sh test                   # or: pnpm test

# 📦 1-Click Dependency Installation & Update
# - First-time clone: ./script.sh deps (installs pnpm, Go, Prisma 8, bridge in < 5s)
# - Updating repo:    ./script.sh deps --update (updates all packages after git pull)
# - Clean cache:      ./script.sh deps --clean
./script.sh deps                   # or: pnpm deps

# ⚙️ 1-Click Environment Setup (installs dependencies, prepares .env, starts DB/Redis, runs Prisma & builds)
./script.sh envi                   # or: pnpm envi

# 🛑 1-Click Environment Teardown & Reset (terminates dev servers, shuts down Docker, purges logs & build dist)
./script.sh uenvi                  # add -v for volume wipe, -a for deep clean

# 🧹 Complete Database & Cache Reset (flushes PostgreSQL tables & Redis keys for fresh onboarding testing)
./script.sh flush-db

# 📱 Render Expo Mobile QR Code
./script.sh qr                     # or: pnpm mobile:qr
```

### 2.2. PowerShell (Windows / Windows Terminal / pwsh)

```powershell
# 🚀 1-Click Development Server (API + Web)
.\script.ps1 dev

# 🌐📱🖥️ Launch All 3 Clients (API + Web + Expo Mobile + Tauri Desktop)
.\script.ps1 dev -All

# 📱 Launch API + Web + Mobile Expo Studio (with upfront QR code)
.\script.ps1 dev -MobileOnly

# 🖥️ Launch API + Web + Tauri Desktop Client
.\script.ps1 dev -DesktopOnly

# 🏗️ 1-Click Monorepo Build
.\script.ps1 build

# 🔍 1-Click Monorepo Diagnostics & Typecheck
.\script.ps1 check

# 🧪 1-Click 6-Phase Test Runner
.\script.ps1 test

# 📦 1-Click Dependency Installation & Update
# - First-time clone: .\script.ps1 deps
# - Updating repo:    .\script.ps1 deps -Update
# - Clean cache:      .\script.ps1 deps -Clean
.\script.ps1 deps

# ⚙️ 1-Click Environment Setup
.\script.ps1 envi

# 🛑 1-Click Environment Teardown & Reset
.\script.ps1 uenvi

# 🧹 Complete Database & Cache Reset
.\script.ps1 flush-db

# 📱 Render Expo Mobile QR Code
.\script.ps1 qr
```

### 2.3. Optional Zsh / Bash Shell Aliases (`~/.zshrc` or `~/.bashrc`)

For developers who prefer direct shorthand commands without typing `./script.sh` each time, you can append the following aliases to your shell configuration file:

```zsh
# --- NovWrite Shorthand Lifecycle Aliases ---
alias dev='./script.sh dev'
alias build='./script.sh build'
alias check='./script.sh check'
alias test='./script.sh test'
alias deps='./script.sh deps'
alias envi='./script.sh envi'
alias uenvi='./script.sh uenvi'
alias flush-db='./script.sh flush-db'
alias qr='./script.sh qr'
```

To apply immediately in your current Zsh session:

```zsh
source ~/.zshrc
```

---

## 3. Granular Package Development & Services

```bash
# Start backend infrastructure (PostgreSQL & Redis)
docker compose up -d postgres redis

# Launch TypeScript Data Service
pnpm --filter @novwrite/data-service dev

# Launch Go API Server
cd apps/api && go run ./cmd/server

# Launch SvelteKit Web Frontend
pnpm --filter @novwrite/web dev

# Launch Tauri 2 Native Desktop Client (Linux, macOS, Windows)
pnpm --filter @novwrite/desktop dev

# Build Tauri 2 Native Desktop Application Bundle
pnpm --filter @novwrite/desktop build

# Launch React Native & Expo Mobile Client
pnpm --filter @novwrite/mobile start

# Launch Mobile Client on Android / iOS Simulator
pnpm --filter @novwrite/mobile android   # or: pnpm --filter @novwrite/mobile ios
```

---

## 4. Backend Super Admin Server CLI (Exclusive Root Control Plane)

The Singleton Super Admin is managed exclusively on the backend server host via the `admin-cli` tool:

```bash
# 👑 Inspect Singleton Super Admin status, user counts, and platform telemetry
cd apps/api && go run ./cmd/admin-cli status

# 👑 Initialize root Singleton Super Admin (Clean Slate Bootstrap)
cd apps/api && go run ./cmd/admin-cli bootstrap-superadmin sysadmin@novwrite.dev novwrite_ops

# 🔑 Generate root authentication token for the Super Admin Dashboard (/superadmin)
cd apps/api && go run ./cmd/admin-cli token

# 👥 List all registered users, platform admins, and roles
cd apps/api && go run ./cmd/admin-cli list-users

# ⬆️ Promote a standard USER to ADMIN
cd apps/api && go run ./cmd/admin-cli promote author@novwrite.dev

# ⬇️ Demote an ADMIN back to standard USER
cd apps/api && go run ./cmd/admin-cli demote admin@novwrite.dev
```

---

## 5. Database & Prisma Operations

```bash
# Push Prisma schema directly to PostgreSQL (development)
pnpm --filter @novwrite/data-service db:push

# Generate typed Prisma Client bindings
pnpm --filter @novwrite/data-service db:generate

# Run pending Prisma migrations (production)
pnpm --filter @novwrite/data-service db:migrate

# Open Prisma Studio visual web inspector
pnpm --filter @novwrite/data-service db:studio
```

---

## 5. Testing & Verification

```bash
# 1-Click 6-Phase Monorepo Test Runner
./script.sh test

# Phase 1: Run @novwrite/bridge contract tests
pnpm --filter @novwrite/bridge test

# Phase 2: Run @novwrite/data-service domain & formula tests
pnpm --filter @novwrite/data-service test

# Phase 3: Run all Go backend unit and integration tests
cd apps/api && go test -v ./...

# Phase 4: Run @novwrite/web frontend engine & store tests
pnpm --filter @novwrite/web test

# Phase 5: Run @novwrite/mobile client engine tests
pnpm --filter @novwrite/mobile test

# Phase 6: Check SvelteKit frontend & monorepo diagnostics
./script.sh check
```

---

## 6. Code Formatting, Quality & Git Signing

```bash
# Automatically format all files repository-wide
pnpm prettier --write .

# Go code formatting and vet check
cd apps/api && go fmt ./... && go vet ./...

# Signed Git Commit (Standard: <type>(<domain>): <expression>)
git commit -S -m "feat(domain): description of atomic change"
```
