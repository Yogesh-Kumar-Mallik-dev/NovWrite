#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Full Monorepo Build Pipeline
# Staged production build runner with graceful start, signal trapping, and error handling.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🔨 Building NovWrite Monorepo (Production)"
echo "========================================================"

# Pre-flight check for build toolchain
for tool in go pnpm node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Build tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

BUILD_START_TIME=$(date +%s)
CURRENT_STEP="Initialization"

# Graceful signal handler & error cleanup
cleanup_build() {
  local exit_code=$?
  if [ "$exit_code" -ne 0 ]; then
    echo ""
    echo "========================================================"
    echo "❌ Build Aborted or Failed during: $CURRENT_STEP"
    echo "🛑 Exit Code: $exit_code"
    echo "========================================================"
  fi
  exit "$exit_code"
}

trap cleanup_build SIGINT SIGTERM ERR

# Step 1: Build Shared Contracts (@novwrite/bridge)
CURRENT_STEP="[1/4] @novwrite/bridge"
echo "📦 $CURRENT_STEP: Compiling TypeScript contracts and Zod schemas..."
pnpm --filter @novwrite/bridge run build

# Step 2: Build Prisma & Data Service (@novwrite/data-service)
CURRENT_STEP="[2/4] @novwrite/data-service"
echo "📦 $CURRENT_STEP: Generating Prisma client & compiling TypeScript data engines..."
(
  cd apps/data-service
  pnpm run prisma:generate
  pnpm run build
)

# Step 3: Build Go API Server (apps/api)
CURRENT_STEP="[3/4] apps/api"
echo "📦 $CURRENT_STEP: Compiling Go API Server binary..."
(
  cd apps/api
  mkdir -p bin
  go build -ldflags="-s -w" -o bin/server ./cmd/server/main.go
)

# Step 4: Build SvelteKit Frontend Workbench (apps/web)
CURRENT_STEP="[4/4] @novwrite/web"
echo "📦 $CURRENT_STEP: Building production SvelteKit SSR & client bundle..."
pnpm --filter @novwrite/web run build

BUILD_END_TIME=$(date +%s)
DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

echo ""
echo "========================================================"
echo "  ✅ All NovWrite Packages Built Successfully!"
echo "========================================================"
echo "  ⏱️  Build Duration: ${DURATION}s"
echo "  📦 Artifacts:"
echo "     - @novwrite/bridge:       packages/bridge/dist"
echo "     - @novwrite/data-service: apps/data-service/dist"
echo "     - apps/api:               apps/api/bin/server"
echo "     - @novwrite/web:          apps/web/.svelte-kit/output"
echo "========================================================"
echo ""
