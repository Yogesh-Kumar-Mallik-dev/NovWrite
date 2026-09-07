# NovWrite Developer Onboarding Guide

Welcome to the **NovWrite** engineering codebase. This document outlines prerequisites, environment setup, local development workflows, and coding conventions.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation:

- **Go 1.23+**: Application API backend.
- **Node.js 22+ & pnpm 9+**: SvelteKit web client and TypeScript data service.
- **Docker & Docker Compose**: Local PostgreSQL 18, Redis, and Traefik testing.
- **Protocol Buffers Compiler (`protoc`)**: For gRPC contract generation.

---

## 2. Clone Repository

```bash
git clone https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite.git
cd NovWrite
```

---

## 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Key environment variables:

- `PORT=8080`: Go HTTP API port.
- `DATA_SERVICE_ADDR=localhost:50051`: Internal gRPC endpoint.
- `DATABASE_URL=postgresql://novwrite:novwrite_dev@localhost:5432/novwrite_db?sslmode=disable`
- `REDIS_URL=redis://localhost:6379/0`
- `JWT_SECRET=your-super-secret-signing-key`
- `OPENAI_API_KEY=sk-...` (or compatible LLM provider key)

---

## 4. Running Locally

### 4.1 Start Infrastructure Containers

```bash
docker compose -f deploy/compose.yaml up -d postgres redis
```

### 4.2 Initialize Prisma Schema & Build Contracts

```bash
# Generate Prisma Client and push schemas
pnpm --filter @novwrite/data-service db:generate
pnpm --filter @novwrite/data-service db:push

# Build shared bridge contracts
pnpm --filter @novwrite/bridge build
```

### 4.3 1-Click Orchestration Scripts

NovWrite provides dedicated lifecycle scripts in the repository root:

```bash
# 1-Click Graceful Development Server (starts DB, Redis, API, Data Service, Web)
./dev.sh

# 1-Click Monorepo Build (builds all packages and Go binaries)
./build.sh

# 1-Click Monorepo Typecheck (verifies bridge, data-service, and web diagnostics)
./check.sh

# 1-Click 5-Phase Monorepo Test Runner (runs 66+ tests across all tiers)
./test.sh

# Complete Database & Cache Reset (cleans PostgreSQL tables and Redis)
./flush_db.sh
```

### 4.4 Granular Service Launch (Manual)

If running services individually:

- **TypeScript Data Service:**
  ```bash
  pnpm --filter @novwrite/data-service dev
  ```
- **Go API Backend Server:**
  ```bash
  cd apps/api && go run ./cmd/server
  ```
- **SvelteKit Web Frontend:**
  ```bash
  pnpm --filter @novwrite/web dev
  ```

---

## 5. Agent & Developer Conventions

When contributing code or building features:

1. **Strict Single-Change Policy**: Only make one atomic change per task (one feature, one refactor, or one fix). Reject multi-change requests.
2. **Commit Standard**: Write commit messages matching `<type>(<domain>): <expression>` (e.g. `feat(universe): add stage ladder validator`).
3. **Signed Commits**: Always sign commits using `git commit -S -m "..."`.
4. **Block-Based Code Formatting**:
   - Begin logical blocks with comment headers explaining purpose and expected outputs.
   - Use early returns to keep logic flat and maintainable.
   - Attach unique block IDs (`BLOCK_<DOMAIN>_<ACTION>_<ID>`) to all error logs and return messages.
5. **Zero-Badge UI Policy**: Badges and pill tags are prohibited on the frontend. Use semantic icons, action buttons, accessible breadcrumbs, and slide drawers.
6. **Context Tracking**: Maintain active state in [`current_context.md`](file:///home/yogesh/Projects/NovWrite/.agent/current_context.md).
