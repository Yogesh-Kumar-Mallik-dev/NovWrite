#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Unified Monorepo CLI & Script Orchestrator
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL)
# Usage: ./run.sh <command> [options]
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

command_help() {
  echo "=================================================================="
  echo "  ⚡ NovWrite Unified Monorepo CLI"
  echo "=================================================================="
  echo "Usage: ./run.sh <command> [options]"
  echo ""
  echo "Core Commands:"
  echo "  dev           Launch dev servers (Go API, Web, Mobile, Desktop)"
  echo "  build         Build production artifacts across all packages"
  echo "  check         Run static typechecks & monorepo diagnostics"
  echo "  test          Run full 6-phase test suite across all packages"
  echo "  deps          Install & update dependencies (pnpm, Go, Prisma)"
  echo "  envi          1-Click environment bootstrap (Docker, DB, builds)"
  echo "  uenvi         1-Click environment teardown & container shutdown"
  echo "  flush-db      Clean-slate flush of Redis cache & PostgreSQL tables"
  echo "  qr            Render Expo terminal QR code for mobile testing"
  echo "  help          Display this help menu"
  echo ""
  echo "Examples:"
  echo "  ./run.sh dev                 # Launch all services"
  echo "  ./run.sh dev --mobile        # Launch mobile only"
  echo "  ./run.sh test                # Run 6-phase test suite"
  echo "  ./run.sh check               # Typecheck all packages"
  echo "  ./run.sh deps --update       # Update monorepo dependencies"
  echo "  ./run.sh envi                # Full environment setup"
  echo "=================================================================="
}

CMD="${1:-dev}"
shift || true

case "$CMD" in
  dev)
    exec "$SCRIPTS_DIR/dev.sh" "$@"
    ;;
  build)
    exec "$SCRIPTS_DIR/build.sh" "$@"
    ;;
  check)
    exec "$SCRIPTS_DIR/check.sh" "$@"
    ;;
  test)
    exec "$SCRIPTS_DIR/test.sh" "$@"
    ;;
  deps)
    exec "$SCRIPTS_DIR/deps.sh" "$@"
    ;;
  envi|enci)
    exec "$SCRIPTS_DIR/envi.sh" "$@"
    ;;
  uenvi|uenci)
    exec "$SCRIPTS_DIR/uenvi.sh" "$@"
    ;;
  flush-db|flush_db|flush)
    exec "$SCRIPTS_DIR/flush_db.sh" "$@"
    ;;
  qr|mobile:qr)
    node "$SCRIPTS_DIR/show-mobile-qr.mjs"
    ;;
  help|--help|-h)
    command_help
    exit 0
    ;;
  *)
    if [ -f "$SCRIPTS_DIR/$CMD.sh" ]; then
      exec "$SCRIPTS_DIR/$CMD.sh" "$@"
    elif [ -f "$SCRIPTS_DIR/$CMD" ]; then
      exec "$SCRIPTS_DIR/$CMD" "$@"
    else
      echo "❌ Unknown command '$CMD'."
      echo "Run './run.sh help' for available commands."
      exit 1
    fi
    ;;
esac
