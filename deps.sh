#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Dependency Manager (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Fast, non-blocking dependency installer and updater for pnpm, Go, and Prisma.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

UPDATE_MODE=0
CLEAN_MODE=0
INCLUDE_RUST=0

for arg in "$@"; do
  case "$arg" in
    --update|-u)
      UPDATE_MODE=1
      ;;
    --clean|-c)
      CLEAN_MODE=1
      ;;
    --rust|-r)
      INCLUDE_RUST=1
      ;;
    --help|-h)
      echo "NovWrite Dependency Installation & Update Utility"
      echo "Usage: ./deps.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --update, -u        Update dependencies across pnpm and Go modules"
      echo "  --clean, -c         Clean package store caches and perform fresh install"
      echo "  --rust, -r          Also verify and update Rust/Cargo crates for Tauri desktop"
      echo "  --help, -h          Display this help message"
      exit 0
      ;;
    *)
      echo "⚠️  Unknown option '$arg'. Use --help for usage information."
      ;;
  esac
done

echo "========================================================"
if [ "$UPDATE_MODE" -eq 1 ]; then
  echo "  🔄 Updating NovWrite Monorepo Dependencies"
else
  echo "  📦 Installing NovWrite Monorepo Dependencies"
fi
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# Auto-inject standard Cargo bin directory to PATH if present
if [ -d "$HOME/.cargo/bin" ] && [[ ":$PATH:" != *":$HOME/.cargo/bin:"* ]]; then
  export PATH="$HOME/.cargo/bin:$PATH"
fi

# Fallback default development database connection URL for Prisma generation
export DATABASE_URL="${DATABASE_URL:-postgresql://novwrite:novwrite_dev@localhost:5433/novwrite_db?schema=public}"

# ------------------------------------------------------------------------------
# STEP 1: Pre-flight toolchain check
# ------------------------------------------------------------------------------
echo "🔹 [1/4] Checking core toolchains..."
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
  echo "Please install the missing tools and re-run ./deps.sh."
  exit 1
fi

NODE_VER="$(node -v 2>/dev/null || echo "unknown")"
PNPM_VER="$(pnpm -v 2>/dev/null || echo "unknown")"
GO_VER="$(go version 2>/dev/null | awk '{print $3}' || echo "unknown")"
echo "  ✓ Node.js: $NODE_VER"
echo "  ✓ pnpm:    v$PNPM_VER"
echo "  ✓ Go:      $GO_VER"

# ------------------------------------------------------------------------------
# STEP 2: Node.js & pnpm Workspace Dependencies
# ------------------------------------------------------------------------------
echo ""
if [ "$UPDATE_MODE" -eq 1 ]; then
  echo "🔹 [2/4] Updating pnpm workspace dependencies..."
  pnpm update
else
  echo "🔹 [2/4] Installing pnpm workspace dependencies..."
  if [ "$CLEAN_MODE" -eq 1 ]; then
    echo "  🧹 Cleaning pnpm store cache..."
    pnpm store prune 2>/dev/null || true
  fi
  pnpm install --frozen-lockfile=false
fi
echo "  ✅ Node.js workspace dependencies ready."

# ------------------------------------------------------------------------------
# STEP 3: Go API Backend Modules
# ------------------------------------------------------------------------------
echo ""
if [ "$UPDATE_MODE" -eq 1 ]; then
  echo "🔹 [3/4] Updating Go API modules..."
  (
    cd "$ROOT_DIR/apps/api"
    go get -u ./... 2>/dev/null || true
    go mod tidy
  )
else
  echo "🔹 [3/4] Downloading and verifying Go API modules..."
  (
    cd "$ROOT_DIR/apps/api"
    go mod download
    go mod tidy
  )
fi
echo "  ✅ Go API dependencies ready."

# ------------------------------------------------------------------------------
# STEP 4: Prisma 8 Client Generation & Internal Contracts Build
# ------------------------------------------------------------------------------
echo ""
echo "🔹 [4/4] Generating Prisma 8 client and compiling internal packages..."
pnpm --filter @novwrite/data-service run prisma:generate
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/data-service build
echo "  ✅ Prisma client and internal contracts ready."

# ------------------------------------------------------------------------------
# OPTIONAL STEP: Rust & Cargo Desktop Crates (--rust / -r)
# ------------------------------------------------------------------------------
if [ "$INCLUDE_RUST" -eq 1 ]; then
  echo ""
  echo "🔹 [Optional] Verifying Cargo desktop crates..."
  if command -v cargo &>/dev/null && [ -d "$ROOT_DIR/apps/desktop/src-tauri" ]; then
    (
      cd "$ROOT_DIR/apps/desktop/src-tauri"
      if [ "$UPDATE_MODE" -eq 1 ]; then
        cargo update
      else
        cargo check
      fi
    )
    echo "  ✅ Rust desktop crates ready."
  else
    echo "  ⚠️  Cargo toolchain not detected; skipping Rust crates."
  fi
fi

echo ""
echo "========================================================"
if [ "$UPDATE_MODE" -eq 1 ]; then
  echo "  🌟 All dependencies successfully updated!"
else
  echo "  🌟 All dependencies successfully installed!"
fi
echo "========================================================"
echo "  Next steps:"
echo "    - Run './dev.sh' to start the development servers"
echo "    - Run './check.sh' to run type checks and lints"
echo "    - Run './test.sh' to run all monorepo test suites"
echo "========================================================"
