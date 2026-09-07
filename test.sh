#!/usr/bin/env bash
set -e

# ==============================================================================
# NovWrite Test Suite Runner
# Runs Bridge contracts, Data Service tests, Go API unit tests, Web engine tests, and Typechecks
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  🧪 Running All NovWrite Test Suites"
echo "========================================================"

# 1. Test Bridge Contracts
echo ""
echo "🔹 [1/5] Testing @novwrite/bridge Contracts & Schemas..."
pnpm --filter @novwrite/bridge build
pnpm --filter @novwrite/bridge test

# 2. Test Data Service Domain Engines
echo ""
echo "🔹 [2/5] Testing @novwrite/data-service Domain Engines..."
pnpm --filter @novwrite/data-service build
pnpm --filter @novwrite/data-service test

# 3. Test Go API Backend
echo ""
echo "🔹 [3/5] Testing Go API Backend & HTTP Handlers..."
(
  cd apps/api
  go test ./...
)

# 4. Test Web Frontend Engines & Utilities
echo ""
echo "🔹 [4/5] Testing @novwrite/web Frontend Engines & Utilities..."
pnpm --filter @novwrite/web test

# 5. Typecheck Frontend
echo ""
echo "🔹 [5/5] Typechecking Frontend Web Application..."
pnpm --filter @novwrite/web check

echo ""
echo "========================================================"
echo "  ✅ All test suites passed successfully with 0 errors!"
echo "========================================================"
