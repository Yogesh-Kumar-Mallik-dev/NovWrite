# Recommended Development Commands

A cheat-sheet of essential commands for building, testing, linting, and running **NovWrite**.

---

## 1. Top-Level Monorepo Orchestration Scripts

```bash
# 1-Click Graceful Development Server (starts DB, Redis, API, Data Service, Web with health checks & graceful shutdown)
./dev.sh

# 1-Click Monorepo Build (builds bridge, data-service, Go api binary, web bundle)
./build.sh

# 1-Click Monorepo Typecheck (verifies all TS and Svelte diagnostics across packages)
./check.sh

# 1-Click Monorepo Test Suite (runs bridge tests, data-service tests, Go backend tests)
./test.sh

# Complete Database & Cache Reset (flushes PostgreSQL tables & Redis keys for clean testing)
./flush_db.sh
```

---

## 2. Granular Package Development & Services

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

## 3. Database & Prisma Operations

```bash
# Run pending Prisma migrations
pnpm --filter @novwrite/data-service db:migrate

# Push Prisma schema directly (for development)
pnpm --filter @novwrite/data-service db:push

# Generate Prisma Client
pnpm --filter @novwrite/data-service db:generate

# Open Prisma Studio web inspector
pnpm --filter @novwrite/data-service db:studio
```

---

## 4. Testing & Verification

```bash
# 1-Click 5-Phase Monorepo Test Runner (bridge -> data-service -> Go backend -> web tests -> typecheck)
./test.sh

# Phase 1: Run @novwrite/bridge contract tests
pnpm --filter @novwrite/bridge test

# Phase 2: Run @novwrite/data-service domain & formula tests
pnpm --filter @novwrite/data-service test

# Phase 3: Run all Go backend unit and integration tests
cd apps/api && go test -v ./...

# Phase 4: Run @novwrite/web Vitest frontend component & store tests
pnpm --filter @novwrite/web test

# Phase 5: Check SvelteKit frontend & monorepo diagnostics
./check.sh
# or individual:
pnpm --filter @novwrite/web check
```

---

## 5. Code Formatting & Quality

```bash
# Automatically format all files repository-wide
pnpm prettier --write .

# Go code formatting and vet check
cd apps/api && go fmt ./... && go vet ./...
```
