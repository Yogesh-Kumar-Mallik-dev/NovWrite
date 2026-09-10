#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Environment Teardown / Unsetup Utility (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Stops development servers, shuts down Docker containers, and cleans build artifacts.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

REMOVE_VOLUMES=0
DEEP_CLEAN=0

for arg in "$@"; do
  case "$arg" in
    --volumes|-v)
      REMOVE_VOLUMES=1
      ;;
    --all|-a|--deep)
      DEEP_CLEAN=1
      REMOVE_VOLUMES=1
      ;;
    --help|-h)
      echo "NovWrite Environment Teardown & Clean Reset Utility"
      echo "Usage: ./uenvi.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --volumes, -v   Remove PostgreSQL and Redis Docker data volumes"
      echo "  --all, -a       Full deep clean: stop services, remove volumes & purge node_modules"
      echo "  --help, -h      Display this help message"
      exit 0
      ;;
    *)
      echo "⚠️  Unknown option '$arg'. Use --help for usage information."
      ;;
  esac
done

echo "========================================================"
echo "  🛑 NovWrite Environment Teardown & Clean Reset"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# ------------------------------------------------------------------------------
# STEP 1: Terminate active development processes & free ports
# ------------------------------------------------------------------------------
echo "🔹 [1/4] Stopping running NovWrite dev servers & freeing ports..."

free_port() {
  local port="$1"
  local name="$2"

  if command -v fuser &>/dev/null; then
    fuser -k -TERM "${port}/tcp" 2>/dev/null || true
  elif command -v lsof &>/dev/null; then
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "  Stopping $name on port $port (PID: $pids)..."
      kill -TERM $pids 2>/dev/null || true
      sleep 0.5
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

free_port 8080 "Go API Server"
free_port 5173 "SvelteKit Web Client"
free_port 8081 "Expo Mobile Metro Bundler"
echo "  ✓ Server processes terminated."

# ------------------------------------------------------------------------------
# STEP 2: Shutdown Docker services
# ------------------------------------------------------------------------------
echo "🔹 [2/4] Shutting down Docker containers..."
DOCKER_COMPOSE_CMD=""
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  DOCKER_COMPOSE_CMD="docker-compose"
fi

if [ -n "$DOCKER_COMPOSE_CMD" ]; then
  if [ "$REMOVE_VOLUMES" -eq 1 ]; then
    echo "  🐳 Stopping containers and removing data volumes (--volumes specified)..."
    $DOCKER_COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
  else
    echo "  🐳 Stopping containers (preserving data volumes)..."
    $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  fi
  echo "  ✓ Docker services stopped."
else
  echo "  ℹ️  Docker not detected or not active; skipping container shutdown."
fi

# ------------------------------------------------------------------------------
# STEP 3: Clean build artifacts, logs, and temporary caches
# ------------------------------------------------------------------------------
echo "🔹 [3/4] Cleaning build artifacts and log files..."
rm -rf "$ROOT_DIR/logs"/* 2>/dev/null || true
rm -rf "$ROOT_DIR/bin"/* 2>/dev/null || true
rm -rf "$ROOT_DIR/apps/api/bin"/* 2>/dev/null || true
rm -rf "$ROOT_DIR/packages/bridge/dist" 2>/dev/null || true
rm -rf "$ROOT_DIR/apps/data-service/dist" 2>/dev/null || true
rm -rf "$ROOT_DIR/apps/web/.svelte-kit" 2>/dev/null || true
rm -rf "$ROOT_DIR/apps/web/build" 2>/dev/null || true
echo "  ✓ Build artifacts and logs purged."

# ------------------------------------------------------------------------------
# STEP 4: Deep clean (node_modules) if requested
# ------------------------------------------------------------------------------
if [ "$DEEP_CLEAN" -eq 1 ]; then
  echo "🔹 [4/4] Deep cleaning node_modules and dependency locks (--all specified)..."
  rm -rf "$ROOT_DIR/node_modules"
  rm -rf "$ROOT_DIR/apps/web/node_modules"
  rm -rf "$ROOT_DIR/apps/mobile/node_modules"
  rm -rf "$ROOT_DIR/apps/desktop/node_modules"
  rm -rf "$ROOT_DIR/apps/data-service/node_modules"
  rm -rf "$ROOT_DIR/packages/bridge/node_modules"
  echo "  ✓ All node_modules removed."
else
  echo "🔹 [4/4] Skipping node_modules purge (use --all or -a for deep clean)."
fi

echo ""
echo "========================================================"
echo "  ✅ NovWrite Environment Successfully Teardown & Reset!"
echo "========================================================"
echo "  💡 To set up the environment again, run:  ./envi.sh"
echo "========================================================"
echo ""
