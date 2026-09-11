#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Environment Setup Utility (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Sets up dependencies, environment files, containers, Prisma client, and builds.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

SKIP_DOCKER=0
SKIP_DB=0
FORCE_REINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --skip-docker|-s)
      SKIP_DOCKER=1
      ;;
    --no-db)
      SKIP_DB=1
      ;;
    --reinstall|-r)
      FORCE_REINSTALL=1
      ;;
    --help|-h)
      echo "NovWrite Environment Setup Utility"
      echo "Usage: ./envi.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-docker, -s   Skip starting PostgreSQL & Redis Docker containers"
      echo "  --no-db             Skip database schema synchronization"
      echo "  --reinstall, -r     Force clean re-installation of dependencies"
      echo "  --help, -h          Display this help message"
      exit 0
      ;;
    *)
      echo "⚠️  Unknown option '$arg'. Use --help for usage information."
      ;;
  esac
done

echo "========================================================"
echo "  🚀 Setting Up NovWrite Development Environment"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight toolchain check
# ------------------------------------------------------------------------------
echo "🔹 [1/6] Checking required toolchain dependencies..."
REQUIRED_TOOLS=("node" "pnpm" "go" "git")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
  if ! command -v "$tool" &>/dev/null; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo "❌ Error: The following required tools are missing from PATH:"
  for tool in "${MISSING_TOOLS[@]}"; do
    echo "   - $tool"
  done
  echo ""
  echo "Please install the missing tools and re-run ./envi.sh."
  echo "Refer to docs/ONBOARDING.md for platform-specific installation instructions."
  exit 1
fi

NODE_VER="$(node -v 2>/dev/null || echo "unknown")"
PNPM_VER="$(pnpm -v 2>/dev/null || echo "unknown")"
GO_VER="$(go version 2>/dev/null | awk '{print $3}' || echo "unknown")"
echo "  ✓ Node.js: $NODE_VER"
echo "  ✓ pnpm:    v$PNPM_VER"
echo "  ✓ Go:      $GO_VER"

# ------------------------------------------------------------------------------
# STEP 2: Initialize directories and .env configuration
# ------------------------------------------------------------------------------
echo "🔹 [2/6] Initializing directories and environment configuration..."
mkdir -p "$ROOT_DIR/bin" "$ROOT_DIR/logs" "$ROOT_DIR/apps/api/bin"

if [ ! -f "$ROOT_DIR/.env" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    echo "  📄 Creating .env from .env.example..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  else
    echo "  ⚠️  .env.example not found; creating default .env..."
    cat <<'ENV_EOF' > "$ROOT_DIR/.env"
PORT=8080
ENVIRONMENT=development
LOG_LEVEL=debug
DATA_SERVICE_ADDR=localhost:50051
POSTGRES_USER=novwrite
POSTGRES_PASSWORD=novwrite_dev
POSTGRES_DB=novwrite_db
POSTGRES_PORT=5433
DATABASE_URL=postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24
ENV_EOF
  fi
  echo "  ✓ .env initialized successfully."
else
  echo "  ✓ .env file already exists."
fi

# ------------------------------------------------------------------------------
# STEP 3: Install Monorepo Node & Go dependencies
# ------------------------------------------------------------------------------
echo "🔹 [3/6] Installing Monorepo Node.js & Go dependencies..."
if [ "$FORCE_REINSTALL" -eq 1 ]; then
  echo "  📦 Reinstalling pnpm dependencies with fresh cache..."
  pnpm install --force
else
  pnpm install
fi

echo "  📦 Downloading Go backend module dependencies..."
(
  cd "$ROOT_DIR/apps/api"
  go mod download
)
echo "  ✓ Dependencies installed successfully."

# ------------------------------------------------------------------------------
# STEP 4: Start Docker infrastructure (PostgreSQL 18 + Redis 7.2)
# ------------------------------------------------------------------------------
echo "🔹 [4/6] Initializing database & cache infrastructure..."
DOCKER_AVAILABLE=0
if command -v docker &>/dev/null; then
  DOCKER_AVAILABLE=1
fi

if [ "$SKIP_DOCKER" -eq 0 ] && [ "$DOCKER_AVAILABLE" -eq 1 ]; then
  DOCKER_COMPOSE_CMD=""
  if docker compose version &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
  fi

  if [ -n "$DOCKER_COMPOSE_CMD" ]; then
    echo "  🐳 Starting PostgreSQL and Redis containers in background..."
    $DOCKER_COMPOSE_CMD up -d postgres redis

    echo "  ⏳ Waiting for PostgreSQL container to become ready..."
    MAX_ATTEMPTS=20
    ATTEMPT=0
    PG_READY=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
      if docker exec novwrite-postgres pg_isready -U novwrite -d novwrite_db &>/dev/null; then
        PG_READY=1
        break
      fi
      ATTEMPT=$((ATTEMPT + 1))
      sleep 1
    done

    if [ "$PG_READY" -eq 1 ]; then
      echo "  ✓ PostgreSQL and Redis containers are healthy and online."
    else
      echo "  ⚠️  PostgreSQL took longer than expected to initialize; proceeding..."
    fi
  fi
elif [ "$SKIP_DOCKER" -eq 1 ]; then
  echo "  ℹ️  Skipping Docker container startup (--skip-docker specified)."
else
  echo "  ⚠️  Docker not found in PATH. Ensure PostgreSQL (port 5433) and Redis (port 6379) are running natively."
fi

# ------------------------------------------------------------------------------
# STEP 5: Generate Prisma Client & Sync Database Schema
# ------------------------------------------------------------------------------
echo "🔹 [5/6] Generating Prisma client & synchronizing database schema..."
POSTGRES_USER="${POSTGRES_USER:-novwrite}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-novwrite_dev}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-novwrite_db}"
export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public}"

(
  cd "$ROOT_DIR/apps/data-service"
  pnpm run prisma:generate
)

if [ "$SKIP_DB" -eq 0 ]; then
  if pnpm --filter @novwrite/data-service exec prisma db push --accept-data-loss 2>/dev/null; then
    echo "  ✓ PostgreSQL database schema synchronized cleanly."
  else
    echo "  ℹ️  Database server not reachable right now; schema push deferred until database starts."
  fi
fi

# ------------------------------------------------------------------------------
# STEP 6: Compile shared monorepo packages
# ------------------------------------------------------------------------------
echo "🔹 [6/6] Compiling shared packages and contracts..."
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/data-service build

echo ""
echo "========================================================"
echo "  ✅ NovWrite Environment Setup Complete!"
echo "========================================================"
echo "  🚀 Next Steps:"
echo "     • Start Development Servers:  ./script.sh dev"
echo "     • Run Full Test Suite:        ./script.sh test"
echo "     • Run Typechecks:             ./script.sh check"
echo "     • Teardown / Reset:           ./script.sh uenvi"
echo "========================================================"
echo ""
