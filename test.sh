#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Test Suite Runner (Universal Cross-Platform)
# Platform Support: Linux, macOS (Darwin), Windows (Git Bash / MSYS2 / WSL / Cygwin)
# Runs Bridge contracts, Data Service tests, Go API unit tests, Web engine tests, and Typechecks
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"

echo "========================================================"
echo "  🧪 Running All NovWrite Test Suites"
echo "  🖥️  Platform: $OS_TYPE"
echo "========================================================"

# Pre-flight check for test toolchain
for tool in go pnpm node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Error: Required tool '$tool' is not installed or not in PATH."
    exit 1
  fi
done

# 1. Test Bridge Contracts
echo ""
echo "🔹 [1/6] Testing @novwrite/bridge Contracts & Schemas..."
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/bridge test

# 2. Test Data Service Domain Engines
echo ""
echo "🔹 [2/6] Testing @novwrite/data-service Domain Engines..."
pnpm --filter @novwrite/data-service build
pnpm --filter @novwrite/data-service test

# 3. Test Go API Backend
echo ""
echo "🔹 [3/6] Testing Go API Backend & HTTP Handlers..."
(
  cd apps/api
  go test ./...
)

# 4. Test Web Frontend Engines & Utilities
echo ""
echo "🔹 [4/6] Testing @novwrite/web Frontend Engines & Utilities..."
pnpm --filter @novwrite/web test

# 5. Test Mobile Client Engines & Telemetry
echo ""
echo "🔹 [5/6] Testing @novwrite/mobile Client Engines & Telemetry..."
node --test apps/mobile/src/__tests__/mobileEngine.test.ts

# 6. Typecheck Frontend
echo ""
echo "🔹 [6/6] Typechecking Frontend Web Application..."
pnpm --filter @novwrite/web check

echo ""
echo "========================================================"
echo "  ✅ All test suites passed successfully with 0 errors!"
echo "========================================================"
