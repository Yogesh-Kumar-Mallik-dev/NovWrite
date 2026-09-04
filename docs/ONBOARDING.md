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

## 2. Environment Configuration

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

## 3. Running Locally

### 3.1 Start Infrastructure Containers

```bash
docker compose -f deploy/compose.yaml up -d postgres redis
```

### 3.2 Initialize Prisma Schema

```bash
cd services/data
pnpm install
pnpm prisma migrate dev
pnpm prisma generate
```

### 3.3 Launch Services

- **Data Service (gRPC):**
  ```bash
  cd services/data && pnpm dev
  ```
- **Go Backend API:**
  ```bash
  go run ./api/cmd/server
  ```
- **Web Client:**
  ```bash
  cd frontend/web && pnpm dev
  ```

---

## 4. Agent & Developer Conventions

When contributing code or building features:

1. **Strict Single-Change Policy**: Only make one atomic change per task (one feature, one refactor, or one fix). Reject multi-change requests.
2. **Commit Standard**: Write commit messages matching `<type>(<domain>): <expression>` (e.g. `feat(universe): add stage ladder validator`).
3. **Block-Based Code Formatting**:
   - Begin logical blocks with comment headers explaining purpose and expected outputs.
   - Use early returns to keep logic flat and maintainable.
   - Attach unique block IDs to all error logs and return messages for instant troubleshooting.
4. **Context Tracking**: Maintain active state in `current_context.md`.
