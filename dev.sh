#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Local Development Launcher (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Starts Go API server (8080), SvelteKit Web (5173), Expo Mobile (8081), and
# Tauri Desktop with upfront Expo QR rendering, non-hijacking logging, and graceful exit.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

API_PORT="${PORT:-8080}"
WEB_PORT="5173"
MOBILE_PORT="${EXPO_PORT:-8081}"
API_HOST="127.0.0.1"
WEB_HOST="127.0.0.1"

# Flag parsing (Defaults to launching all 3 frontends + API)
START_MOBILE=1
START_DESKTOP=1
START_WEB=1
START_API=1

for arg in "$@"; do
  case "$arg" in
    --all|-a)
      START_MOBILE=1
      START_DESKTOP=1
      START_WEB=1
      ;;
    --mobile-only|-m)
      START_MOBILE=1
      START_DESKTOP=0
      START_WEB=0
      ;;
    --desktop-only|-d)
      START_MOBILE=0
      START_DESKTOP=1
      START_WEB=1
      ;;
    --web-only|-w)
      START_MOBILE=0
      START_DESKTOP=0
      START_WEB=1
      ;;
    --help|-h)
      echo "NovWrite Universal Development Server Launcher"
      echo "Usage: ./dev.sh [OPTIONS]"
      echo ""
      echo "Default: Launches Go API Backend, Mobile Expo Studio (with upfront QR), Tauri Desktop, and Vite Web."
      echo ""
      echo "Options:"
      echo "  --all, -a           Launch all 3 clients + API (default)"
      echo "  --web-only, -w      Launch Go API and SvelteKit Web only"
      echo "  --desktop-only, -d  Launch Go API, SvelteKit Web, and Tauri Desktop"
      echo "  --mobile-only, -m   Launch Go API and Mobile Expo only"
      echo "  --help, -h          Display this help menu"
      exit 0
      ;;
  esac
done

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
echo "  📦 Targets: API=on Web=on Mobile=$([ "$START_MOBILE" -eq 1 ] && echo "on" || echo "off") Desktop=$([ "$START_DESKTOP" -eq 1 ] && echo "on" || echo "off")"
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
if [ "$START_MOBILE" -eq 1 ]; then
  free_port "$MOBILE_PORT" "Expo Metro Bundler"
fi

API_PID=""
WEB_PID=""
MOBILE_PID=""
DESKTOP_PID=""
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

  # 1. Gracefully terminate Desktop client
  if [ -n "$DESKTOP_PID" ] && kill -0 "$DESKTOP_PID" 2>/dev/null; then
    echo "🔹 Stopping Tauri Desktop Client (PID: $DESKTOP_PID)..."
    kill -15 "$DESKTOP_PID" 2>/dev/null || true
  fi

  # 2. Gracefully terminate Mobile Metro server
  if [ -n "$MOBILE_PID" ] && kill -0 "$MOBILE_PID" 2>/dev/null; then
    echo "🔹 Stopping Expo Mobile Metro Bundler (PID: $MOBILE_PID)..."
    kill -15 "$MOBILE_PID" 2>/dev/null || true
  fi

  # 3. Gracefully terminate SvelteKit Web server
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    echo "🔹 Stopping SvelteKit Web Workbench (PID: $WEB_PID)..."
    kill -15 "$WEB_PID" 2>/dev/null || true
  fi

  # 4. Gracefully terminate Go API server
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    echo "🔹 Stopping Go API Server (PID: $API_PID)..."
    kill -15 "$API_PID" 2>/dev/null || true
  fi

  # Wait up to 3 seconds for processes to cleanly exit
  local wait_count=0
  while [ "$wait_count" -lt 6 ]; do
    local still_running=0
    if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then still_running=1; fi
    if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then still_running=1; fi
    if [ -n "$MOBILE_PID" ] && kill -0 "$MOBILE_PID" 2>/dev/null; then still_running=1; fi
    if [ -n "$DESKTOP_PID" ] && kill -0 "$DESKTOP_PID" 2>/dev/null; then still_running=1; fi

    if [ "$still_running" -eq 0 ]; then
      break
    fi
    sleep 0.5
    wait_count=$((wait_count + 1))
  done

  # Force kill if anything is lingering
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then kill -9 "$API_PID" 2>/dev/null || true; fi
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then kill -9 "$WEB_PID" 2>/dev/null || true; fi
  if [ -n "$MOBILE_PID" ] && kill -0 "$MOBILE_PID" 2>/dev/null; then kill -9 "$MOBILE_PID" 2>/dev/null || true; fi
  if [ -n "$DESKTOP_PID" ] && kill -0 "$DESKTOP_PID" 2>/dev/null; then kill -9 "$DESKTOP_PID" 2>/dev/null || true; fi

  # Clean residual processes on ports portably
  if command -v lsof >/dev/null 2>&1; then
    for p in "$API_PORT" "$WEB_PORT" "$MOBILE_PORT"; do
      local pids_res
      pids_res=$(lsof -ti:"$p" 2>/dev/null || true)
      if [ -n "$pids_res" ]; then
        for pid in $pids_res; do kill -9 "$pid" 2>/dev/null || true; done
      fi
    done
  fi

  echo "✨ All NovWrite development servers stopped cleanly."
  echo "========================================================"
  exit 0
}

trap cleanup SIGINT SIGTERM SIGHUP EXIT

# ------------------------------------------------------------------------------
# STEP 1: Mobile (Expo SDK 52) - Render QR Upfront & Run Metro Bundler in Background
# ------------------------------------------------------------------------------
if [ "$START_MOBILE" -eq 1 ]; then
  mkdir -p "$ROOT_DIR/logs"
  echo "📱 Displaying Expo QR Code upfront before starting service logs..."
  node "$ROOT_DIR/scripts/show-mobile-qr.mjs"

  echo "🚀 Launching Expo Mobile Metro Bundler in background (logs -> logs/expo.log)..."
  (
    cd "$ROOT_DIR/apps/mobile"
    CI=1 exec pnpm exec expo start --port "$MOBILE_PORT" --host lan > "$ROOT_DIR/logs/expo.log" 2>&1 </dev/null
  ) &
  MOBILE_PID=$!

  # Probe Metro until accepting Expo Go connections
  echo "⏳ Waiting for Expo Mobile Metro Bundler to become ready..."
  for i in $(seq 1 30 2>/dev/null || echo 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30); do
    if curl -s -o /dev/null -H "expo-platform: android" "http://127.0.0.1:${MOBILE_PORT}" >/dev/null 2>&1; then
      echo "✅ Expo Mobile Metro Bundler is live and ready for Expo Go! (PID: $MOBILE_PID)"
      break
    fi
    if ! kill -0 "$MOBILE_PID" 2>/dev/null; then
      echo "⚠️  Expo Metro Bundler exited unexpectedly. Check logs/expo.log for details."
      break
    fi
    sleep 0.3
  done
fi

# ------------------------------------------------------------------------------
# STEP 2: Go API Backend Server
# ------------------------------------------------------------------------------
echo "📦 Preparing Go API Server on http://${API_HOST}:${API_PORT}..."
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

# ------------------------------------------------------------------------------
# STEP 3: Vite Web Workbench (SvelteKit 2 + Vite)
# ------------------------------------------------------------------------------
echo "🌐 Starting SvelteKit Vite Web Workbench on http://${WEB_HOST}:${WEB_PORT}..."
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

# ------------------------------------------------------------------------------
# STEP 4: Tauri 2 Native Desktop Client (attaching to Vite server)
# ------------------------------------------------------------------------------
if [ "$START_DESKTOP" -eq 1 ]; then
  echo "🖥️  Starting Tauri 2 Native Desktop Client (logs -> logs/desktop.log)..."
  mkdir -p "$ROOT_DIR/logs"
  (
    cd "$ROOT_DIR/apps/desktop"
    exec pnpm exec tauri dev --no-dev-server > "$ROOT_DIR/logs/desktop.log" 2>&1 </dev/null
  ) &
  DESKTOP_PID=$!
fi

echo ""
echo "========================================================"
echo "  🌟 NovWrite Development Environment is LIVE"
echo "========================================================"
echo "  🔗 Web Workbench:   http://${WEB_HOST}:${WEB_PORT}"
echo "  🔗 API Backend:     http://${API_HOST}:${API_PORT}"
echo "  🔗 Health Probe:    http://${API_HOST}:${API_PORT}/healthz"
if [ "$START_MOBILE" -eq 1 ]; then
  echo "  📱 Mobile (Expo):   http://127.0.0.1:${MOBILE_PORT} (QR printed above)"
fi
if [ "$START_DESKTOP" -eq 1 ]; then
  echo "  🖥️  Desktop (Tauri): Active (PID: $DESKTOP_PID)"
fi
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
  if [ "$START_MOBILE" -eq 1 ] && [ -n "$MOBILE_PID" ] && ! kill -0 "$MOBILE_PID" 2>/dev/null; then
    echo "⚠️  Expo Mobile Metro Bundler (PID: $MOBILE_PID) stopped unexpectedly."
    cleanup
    break
  fi
  if [ "$START_DESKTOP" -eq 1 ] && [ -n "$DESKTOP_PID" ] && ! kill -0 "$DESKTOP_PID" 2>/dev/null; then
    echo "⚠️  Tauri Desktop Client (PID: $DESKTOP_PID) stopped unexpectedly."
    cleanup
    break
  fi
  sleep 1 &
  wait $! 2>/dev/null || true
done

