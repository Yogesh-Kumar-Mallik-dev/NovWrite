#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Full Monorepo Build Runner
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🔨 Building All NovWrite Packages"
echo "========================================================"

pnpm --recursive run build

echo ""
echo "========================================================"
echo "  ✅ Monorepo build completed successfully!"
echo "========================================================"
