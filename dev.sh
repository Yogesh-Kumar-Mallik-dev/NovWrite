#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Local Development Launcher (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Starts Go API server (port 8080) and SvelteKit Web Client (port 5173)
# with graceful startup probing, cross-platform port freeing, and signal trapping.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

API_PORT="${PORT:-8080}"
WEB_PORT="5173"
API_HOST="127.0.0.1"
WEB_HOST="127.0.0.1"

# Detect Operating System & Executable Extension
OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"
EXE_EXT=""
case "$OS_TYPE" in
  CYGWIN*|MINGW*|MSYS*|Windows_NT)
    EXE_EXT=".exe"
    ;;
esac

echo "========================================================"
echo "  🚀 Starting NovWrite Development Environment"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# Pre-flight check for required tools
for tool in go pnpm node curl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Required tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

# Cross-platform port clearing function (Linux / macOS / Windows Git Bash)
free_port() {
  local port="$1"
  local name="$2"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
  elif command -v netstat >/dev/null 2>&1; then
    # Fallback for Windows / MSYS environments without lsof
    pids=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p && $4 == "LISTENING" {print $5}' | sort -u | tr -d '\r' || true)
  fi

  if [ -n "$pids" ]; then
    echo "⚠️  Port $port is currently in use (PID: $pids). Terminating stale $name process..."
    for pid in $pids; do
      if [ "$pid" != "0" ] && [ -n "$pid" ]; then
        kill -15 "$pid" 2>/dev/null || true
      fi
    done
    sleep 1

    # Force kill if still lingering
    local remaining=""
    if command -v lsof >/dev/null 2>&1; then
      remaining=$(lsof -ti:"$port" 2>/dev/null || true)
    elif command -v netstat >/dev/null 2>&1; then
      remaining=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p && $4 == "LISTENING" {print $5}' | sort -u | tr -d '\r' || true)
    fi

    if [ -n "$remaining" ]; then
      for pid in $remaining; do
        if [ "$pid" != "0" ] && [ -n "$pid" ]; then
          kill -9 "$pid" 2>/dev/null || true
        fi
      done
    fi
  fi
}

free_port "$API_PORT" "Go API Server"
free_port "$WEB_PORT" "SvelteKit Web Client"

API_PID=""
WEB_PID=""
SHUTDOWN_IN_PROGRESS=0

# Graceful Shutdown Handler
cleanup() {
  if [ "$SHUTDOWN_IN_PROGRESS" -eq 1 ]; then
    return
  fi
  SHUTDOWN_IN_PROGRESS=1
  trap - SIGINT SIGTERM SIGHUP EXIT

  echo ""
  echo "========================================================"
  echo "🛑 Initiating graceful shutdown of all NovWrite services..."
  echo "========================================================"

  # 1. Gracefully terminate SvelteKit Web server
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    echo "🔹 Stopping SvelteKit Web Workbench (PID: $WEB_PID)..."
    kill -15 "$WEB_PID" 2>/dev/null || true
  fi

  # 2. Gracefully terminate Go API server
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    echo "🔹 Stopping Go API Server (PID: $API_PID)..."
    kill -15 "$API_PID" 2>/dev/null || true
  fi

  # 3. Wait up to 3 seconds for processes to cleanly exit
  local wait_count=0
  while [ "$wait_count" -lt 6 ]; do
    local still_running=0
    if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
      still_running=1
    fi
    if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
      still_running=1
    fi

    if [ "$still_running" -eq 0 ]; then
      break
    fi
    sleep 0.5
    wait_count=$((wait_count + 1))
  done

  # 4. Force kill if anything is lingering
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill -9 "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill -9 "$WEB_PID" 2>/dev/null || true
  fi

  # Clean any residual processes on ports portably (no xargs -r for BSD/macOS compatibility)
  if command -v lsof >/dev/null 2>&1; then
    local pids_api
    pids_api=$(lsof -ti:"$API_PORT" 2>/dev/null || true)
    if [ -n "$pids_api" ]; then
      for pid in $pids_api; do kill -9 "$pid" 2>/dev/null || true; done
    fi
    local pids_web
    pids_web=$(lsof -ti:"$WEB_PORT" 2>/dev/null || true)
    if [ -n "$pids_web" ]; then
      for pid in $pids_web; do kill -9 "$pid" 2>/dev/null || true; done
    fi
  fi

  echo "✨ All NovWrite development servers stopped cleanly."
  echo "========================================================"
  exit 0
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

# 1. Build & Start Go API Server in background
echo "📦 [1/2] Preparing Go API Server on http://${API_HOST}:${API_PORT}..."
mkdir -p "$ROOT_DIR/bin"
(cd "$ROOT_DIR/apps/api" && go build -o "$ROOT_DIR/bin/api-server$EXE_EXT" ./cmd/server/main.go)

(
  cd "$ROOT_DIR/apps/api"
  PORT="$API_PORT" ENVIRONMENT=development exec "$ROOT_DIR/bin/api-server$EXE_EXT"
) &
API_PID=$!

# Probe Go API health endpoint until ready
echo "⏳ Waiting for Go API server to become ready..."
api_ready=0
for i in $(seq 1 30 2>/dev/null || echo 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30); do
  if curl -s -f "http://${API_HOST}:${API_PORT}/healthz" >/dev/null 2>&1; then
    api_ready=1
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "❌ Error: Go API server failed to start or crashed unexpectedly."
    exit 1
  fi
  sleep 0.3
done

if [ "$api_ready" -eq 1 ]; then
  echo "✅ Go API Server is live and healthy! (PID: $API_PID)"
else
  echo "⚠️  Go API Server took longer than expected to report healthy, proceeding..."
fi

# 2. Start SvelteKit Web Workbench in background
echo "🌐 [2/2] Starting SvelteKit Web Workbench on http://${WEB_HOST}:${WEB_PORT}..."
(
  cd "$ROOT_DIR/apps/web"
  exec pnpm exec vite dev --host "$WEB_HOST" --port "$WEB_PORT"
) &
WEB_PID=$!

# Probe Web Server until accepting connections
echo "⏳ Waiting for SvelteKit Web Workbench to initialize..."
web_ready=0
for i in $(seq 1 30 2>/dev/null || echo 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30); do
  if curl -s -I "http://${WEB_HOST}:${WEB_PORT}" >/dev/null 2>&1; then
    web_ready=1
    break
  fi
  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    echo "❌ Error: SvelteKit Web Workbench failed to start or crashed unexpectedly."
    exit 1
  fi
  sleep 0.3
done

if [ "$web_ready" -eq 1 ]; then
  echo "✅ SvelteKit Web Workbench is live! (PID: $WEB_PID)"
fi

echo ""
echo "========================================================"
echo "  🌟 NovWrite Development Environment is LIVE"
echo "========================================================"
echo "  🔗 Web Workbench: http://${WEB_HOST}:${WEB_PORT}"
echo "  🔗 API Backend:   http://${API_HOST}:${API_PORT}"
echo "  🔗 Health Probe:  http://${API_HOST}:${API_PORT}/healthz"
echo "  🛑 Press Ctrl+C at any time for graceful shutdown"
echo "========================================================"
echo ""

# Supervisor loop: monitors running processes
while true; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "⚠️  Go API server (PID: $API_PID) stopped unexpectedly."
    cleanup
    break
  fi
  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    echo "⚠️  SvelteKit Web server (PID: $WEB_PID) stopped unexpectedly."
    cleanup
    break
  fi
  sleep 1 &
  wait $! 2>/dev/null || true
done
