#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Typecheck & Health Verification Runner (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

echo "========================================================"
echo "  🔍 Typechecking NovWrite Monorepo"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# Pre-flight check for required tools
for tool in pnpm node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Required tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

echo "🔹 [1/4] Typechecking @novwrite/bridge..."
pnpm --filter @novwrite/bridge build

echo "🔹 [2/4] Typechecking @novwrite/data-service..."
pnpm --filter @novwrite/data-service build

echo "🔹 [3/4] Typechecking @novwrite/web..."
pnpm --filter @novwrite/web check

echo "🔹 [4/4] Typechecking @novwrite/mobile..."
pnpm --filter @novwrite/mobile exec tsc --noEmit

echo ""
echo "========================================================"
echo "  ✅ All packages typechecked cleanly with 0 errors!"
echo "========================================================"
