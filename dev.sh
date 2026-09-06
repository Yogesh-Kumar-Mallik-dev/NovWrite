#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Local Development Launcher
# Starts Go API server (port 8080) and SvelteKit Web Client (port 5173)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🚀 Starting NovWrite Development Environment"
echo "========================================================"

# Trap termination signals to kill all child background processes gracefully
cleanup() {
  echo ""
  echo "🛑 Stopping all NovWrite development servers..."
  kill 0 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Go API Server
echo "📦 Starting Go API Server on http://127.0.0.1:8080..."
(
  cd apps/api
  PORT=8080 ENVIRONMENT=development go run ./cmd/server/main.go
) &
API_PID=$!

# Wait briefly for API server to initialize
sleep 1

# 2. Start SvelteKit Web Workbench
echo "🌐 Starting SvelteKit Web Workbench on http://127.0.0.1:5173..."
(
  pnpm --filter @novwrite/web dev -- --host 127.0.0.1 --port 5173
) &
WEB_PID=$!

echo ""
echo "========================================================"
echo "  ✅ NovWrite is running!"
echo "  - Web Workbench: http://127.0.0.1:5173"
echo "  - API Backend:   http://127.0.0.1:8080"
echo "  - Press Ctrl+C to stop all servers"
echo "========================================================"
echo ""

# Wait for background jobs to finish
wait
