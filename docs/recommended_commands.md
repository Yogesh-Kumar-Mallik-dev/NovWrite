# Recommended Development Commands

A cheat-sheet of essential commands for building, testing, linting, and running **NovWrite**.

---

## 1. Development & Services

```bash
# Start backend infrastructure (PostgreSQL & Redis)
docker compose -f deploy/compose.yaml up -d postgres redis

# Launch TypeScript Data Service in watch mode
cd services/data && pnpm dev

# Launch Go API Server
go run ./api/cmd/server

# Launch SvelteKit Web Frontend
cd frontend/web && pnpm dev
```

---

## 2. Database & Migrations

```bash
# Run pending Prisma migrations
cd services/data && pnpm prisma migrate dev

# Generate Prisma Client
cd services/data && pnpm prisma generate

# Open Prisma Studio web inspector
cd services/data && pnpm prisma studio
```

---

## 3. Testing & Verification

```bash
# Run Go unit tests with mock repositories
go test -v -race ./...

# Run TypeScript data service unit tests
cd services/data && pnpm test

# Run frontend unit tests
cd frontend/web && pnpm test
```

---

## 4. Code Formatting & Quality

```bash
# Check code formatting with Prettier
pnpm prettier --check .

# Automatically format code repository-wide
pnpm prettier --write .

# Go code formatting and vet check
go fmt ./... && go vet ./...
```

---

## 5. Protocol Buffers & gRPC Generation

```bash
# Generate Go and TypeScript gRPC contracts from proto definitions
pnpm run proto:generate
```
