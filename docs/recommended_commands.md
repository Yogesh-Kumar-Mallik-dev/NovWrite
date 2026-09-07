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

```bash
# 🚀 1-Click Development Server (Postgres, Redis, API, Data Service, Web with health checks & graceful shutdown)
./dev.sh

# 🏗️ 1-Click Monorepo Build (bridge contracts, data-service dist, Go api binary, web bundle)
./build.sh

# 🔍 1-Click Monorepo Diagnostics & Typecheck (verifies all TS and Svelte diagnostics across packages)
./check.sh

# 🧪 1-Click 5-Phase Test Runner (bridge -> data-service -> Go backend -> web tests -> typecheck)
./test.sh

# 🧹 Complete Database & Cache Reset (flushes PostgreSQL tables & Redis keys for fresh onboarding testing)
./flush_db.sh
```

---

## 3. Granular Package Development & Services

```bash
# Start backend infrastructure (PostgreSQL & Redis)
docker compose -f deploy/compose.yaml up -d postgres redis

# Launch TypeScript Data Service
pnpm --filter @novwrite/data-service dev

# Launch Go API Server
cd apps/api && go run ./cmd/server

# Launch SvelteKit Web Frontend
pnpm --filter @novwrite/web dev
```

---

## 4. Database & Prisma Operations

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
# 1-Click 5-Phase Monorepo Test Runner
./test.sh

# Phase 1: Run @novwrite/bridge contract tests
pnpm --filter @novwrite/bridge test

# Phase 2: Run @novwrite/data-service domain & formula tests
pnpm --filter @novwrite/data-service test

# Phase 3: Run all Go backend unit and integration tests
cd apps/api && go test -v ./...

# Phase 4: Run @novwrite/web frontend engine & store tests
pnpm --filter @novwrite/web test

# Phase 5: Check SvelteKit frontend & monorepo diagnostics
./check.sh
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
