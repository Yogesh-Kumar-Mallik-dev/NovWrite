#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Test Suite Runner
# Runs Go API unit tests, Bridge contracts, and Data Service tests
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🧪 Running All NovWrite Test Suites"
echo "========================================================"

# 1. Test Bridge Contracts
echo ""
echo "🔹 [1/4] Testing @novwrite/bridge Contracts..."
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/bridge test

# 2. Test Data Service Domain Engines
echo ""
echo "🔹 [2/4] Testing @novwrite/data-service Domain Engines..."
pnpm --filter @novwrite/data-service build
pnpm --filter @novwrite/data-service test

# 3. Test Go API Backend
echo ""
echo "🔹 [3/4] Testing Go API Backend..."
(
  cd apps/api
  go test ./...
)

# 4. Typecheck Frontend
echo ""
echo "🔹 [4/4] Typechecking Frontend Web Application..."
pnpm --filter @novwrite/web check

echo ""
echo "========================================================"
echo "  ✅ All test suites passed successfully with 0 errors!"
echo "========================================================"
