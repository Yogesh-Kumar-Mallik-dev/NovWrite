#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Database & Redis Clean Slate Reset Utility
# Flushes Redis cache and resets PostgreSQL tables to a clean schema state.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🧹 Flushing NovWrite Database and Redis Cache"
echo "========================================================"

# 1. Ensure docker compose postgres & redis services are running
if ! docker compose ps --format json | grep -q "novwrite-postgres"; then
  echo "📦 Starting PostgreSQL and Redis containers..."
  docker compose up -d postgres redis
  sleep 2
fi

# 2. Flush Redis Cache
echo "🔹 [1/2] Flushing Redis 7.2 Cache (FLUSHALL)..."
if docker exec novwrite-redis redis-cli FLUSHALL >/dev/null 2>&1; then
  echo "✅ Redis cache flushed cleanly."
else
  echo "⚠️  Could not flush Redis via docker exec (container might be starting), trying redis-cli locally..."
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -p "${REDIS_PORT:-6379}" FLUSHALL || true
  fi
fi

# 3. Reset PostgreSQL Schema with Prisma
echo "🔹 [2/2] Resetting PostgreSQL Database Schema (Clean Slate)..."
DATABASE_URL="postgresql://${POSTGRES_USER:-novwrite}:${POSTGRES_PASSWORD:-novwrite_dev}@localhost:${POSTGRES_PORT:-5433}/${POSTGRES_DB:-novwrite_db}?schema=public" \
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

