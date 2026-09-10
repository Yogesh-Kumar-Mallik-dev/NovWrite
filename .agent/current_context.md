# Current Context

- **Active Branch:** `world` (synchronized with `main` and `novel`).
- **Execution Constraints:** Mandatory GPG signed commits (`git commit -S`), strict `<type>(<domain>): <expression>` commit message structure, 6-phase test verification (`./test.sh`), strict single-change isolation.
- **Architectural Baseline:** Version 2.12.0 (Phase 2: Go Backend Manuscript, Invariant Rules, and Realtime SSE Stream).
- **Recent Accomplishments & Enforcement Checkpoints:**
  - **Phase 2: Go Backend Persistence & Data Service Binding**:
    - Implemented Chapter & Scene handlers (`apps/api/internal/handlers/novel_handler.go`) with automated word counting, ordering, and cascading deletion.
    - Implemented Invariant Rule & Continuity Audit handlers (`apps/api/internal/handlers/rule_handler.go`) with author overrides.
    - Implemented Realtime Server-Sent Events (SSE) Hub (`apps/api/internal/handlers/event_hub.go`) with project-scoped pub/sub multiplexing and heartbeat keep-alive.
    - Mounted `/chapters`, `/scenes`, `/rules`, `/audit`, and `/events/stream` routes in `apps/api/cmd/server/main.go`.
    - Added full unit test suites for novel, rule, and event hub handlers.
  - **Phase 1: Bridge Engine Consolidation & Deduplication**:
    - Extracted canonical AST formula evaluator into `packages/bridge/src/engine/formulaEngine.ts`.
    - Re-exported across `@novwrite/web`, `@novwrite/data-service`, and `@novwrite/mobile`.
  - **Documentation & Test Parity**:
    - Verified `./check.sh` passes with 0 errors and 0 warnings.
    - Verified `./test.sh` passes all 6 test phases cleanly with 0 errors and 0 warnings.
- **Next Steps:**
  - Proceed with Phase 3 (Web Frontend Sync Engine & Hydration) or await user instructions.
