#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Typecheck & Health Verification Runner
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🔍 Typechecking NovWrite Monorepo"
echo "========================================================"

echo "🔹 [1/3] Typechecking @novwrite/bridge..."
pnpm --filter @novwrite/bridge build

echo "🔹 [2/3] Typechecking @novwrite/data-service..."
pnpm --filter @novwrite/data-service build

echo "🔹 [3/3] Typechecking @novwrite/web..."
pnpm --filter @novwrite/web check

echo ""
echo "========================================================"
echo "  ✅ All packages typechecked cleanly with 0 errors!"
echo "========================================================"
