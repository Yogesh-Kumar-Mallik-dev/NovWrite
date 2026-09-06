#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Local Development Launcher
# Starts Go API server (port 8080) and SvelteKit Web Client (port 5173)
# with graceful startup probing and signal-trapped graceful shutdown.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

API_PORT="${PORT:-8080}"
WEB_PORT="5173"
API_HOST="127.0.0.1"
WEB_HOST="127.0.0.1"

echo "========================================================"
echo "  🚀 Starting NovWrite Development Environment"
echo "========================================================"

# Pre-flight check for required tools
for tool in go pnpm node curl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Required tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

# Function to release a port if held by a stale process
free_port() {
  local port="$1"
  local name="$2"
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "⚠️  Port $port is currently in use (PID: $pids). Terminating stale $name process..."
    kill -15 $pids 2>/dev/null || true
    sleep 1
    # Force kill if still holding port
    pids_remaining=$(lsof -ti:"$port" 2>/dev/null || true)
    if [ -n "$pids_remaining" ]; then
      kill -9 $pids_remaining 2>/dev/null || true
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

  # 3. Wait up to 5 seconds for processes to cleanly exit
  local wait_count=0
  while [ "$wait_count" -lt 10 ]; do
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

  # Clean any residual processes on ports
  lsof -ti:"$API_PORT" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
  lsof -ti:"$WEB_PORT" 2>/dev/null | xargs -r kill -9 2>/dev/null || true

  echo "✨ All NovWrite development servers stopped cleanly."
  echo "========================================================"
  exit 0
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

# 1. Start Go API Server in background
echo "📦 [1/2] Starting Go API Server on http://${API_HOST}:${API_PORT}..."
(
  cd apps/api
  PORT="$API_PORT" ENVIRONMENT=development exec go run ./cmd/server/main.go
) &
API_PID=$!

# Probe Go API health endpoint until ready
echo "⏳ Waiting for Go API server to become ready..."
api_ready=0
for i in {1..30}; do
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
  exec pnpm --filter @novwrite/web dev -- --host "$WEB_HOST" --port "$WEB_PORT"
) &
WEB_PID=$!

# Probe Web Server until accepting connections
echo "⏳ Waiting for SvelteKit Web Workbench to initialize..."
web_ready=0
for i in {1..30}; do
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
  sleep 1
done
