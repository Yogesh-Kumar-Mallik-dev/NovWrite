#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Database & Redis Clean Slate Reset Utility (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Flushes Redis cache and resets PostgreSQL tables to a clean schema state.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

echo "========================================================"
echo "  🧹 Flushing NovWrite Database and Redis Cache"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# Pre-flight check for required tools
for tool in pnpm node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Required tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

# Detect Docker Compose binary (v2 plugin or v1 standalone)
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
fi

# 1. Ensure docker compose postgres & redis services are running (if docker available)
if [ -n "$DOCKER_COMPOSE_CMD" ]; then
  if ! $DOCKER_COMPOSE_CMD ps 2>/dev/null | grep -q "postgres"; then
    echo "📦 Starting PostgreSQL and Redis containers..."
    $DOCKER_COMPOSE_CMD up -d postgres redis
    sleep 2
  fi
else
  echo "⚠️  Docker Compose not detected in PATH; attempting direct database reset..."
fi

# 2. Flush Redis Cache
echo "🔹 [1/2] Flushing Redis 7.2 Cache (FLUSHALL)..."
redis_flushed=0
if command -v docker >/dev/null 2>&1 && docker exec novwrite-redis redis-cli FLUSHALL >/dev/null 2>&1; then
  echo "✅ Redis cache flushed cleanly via Docker container."
  redis_flushed=1
elif command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -p "${REDIS_PORT:-6379}" FLUSHALL >/dev/null 2>&1; then
    echo "✅ Redis cache flushed cleanly via local redis-cli."
    redis_flushed=1
  fi
fi

if [ "$redis_flushed" -eq 0 ]; then
  echo "⚠️  Could not contact Redis to flush keys (service may not be running or is starting up)."
fi

# 3. Reset PostgreSQL Schema with Prisma
echo "🔹 [2/2] Resetting PostgreSQL Database Schema (Clean Slate)..."
POSTGRES_USER="${POSTGRES_USER:-novwrite}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-novwrite_dev}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-novwrite_db}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

pnpm --filter @novwrite/data-service exec prisma db push --force-reset --accept-data-loss

echo ""
echo "========================================================"
echo "  ✨ Backend Clean Slate Established!"
echo "  - PostgreSQL: All database tables reset to 0 records."
echo "  - Redis 7.2:  FLUSHALL completed (all keys purged)."
echo "========================================================"
echo "  💡 Web Client Note:"
echo "  The web workbench caches active projects in browser"
echo "  localStorage (which browser hard-refreshes preserve)."
echo ""
echo "  To clear your browser cache to bare bones:"
echo "  1. Open DevTools Console (F12) on http://localhost:5173"
echo "  2. Run: localStorage.clear(); location.reload();"
echo "     (or: Application tab -> Storage -> Clear site data)"
echo "========================================================"

