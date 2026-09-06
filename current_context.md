# Current Context

- **Active Branch:** `world` (World Studio, Dynamic Schemas, Timeline & State Fold Engine).
- **Execution Constraints:** **Strictly DO NOT push changes to remote git without explicit user permission.** Local signed commits (`git commit -S`) are standard.
- **Architectural Baseline:** **Version 2.0 (Blueprint vs. Entity Paradigm, Dual-Valued Enums, Dynamic Formula Engine, Archetype Carousel, Customizable Columns & Tri-Platform Standards)**.
- **Recent Accomplishments:**
  - **Class (Blueprint) vs Object (Entity) Architecture**: Defined 1st-Class Blueprints (`FIRST_CLASS`) for instantiating concrete entities, relational entity graph linking (`BLUEPRINT_REF`), and 2nd-Class Blueprints (`SECOND_CLASS`) for embedded sub-schemas and gauges.
  - **Dual-Valued Enums**: Supported `{ label, value, power }` where qualitative author choices map to numeric power weights consumed by math formulas.
  - **Live AST Formula Engine**: Safe AST parser and real-time reactive evaluator (`formulaEngine.ts`) with mathematical and logical functions (`CLAMP`, `MIN`, `MAX`, `ROUND`, `IF`, `POW`, `SQRT`).
  - **Archetype Carousel**: Implemented horizontal scroll deck on `/world/entities/create` with always-visible side navigation buttons (disabled, hover, active states), single-card stepping, no cut-off cards, and hidden scrollbars.
  - **Per-Blueprint Customizable Table Columns**: Configurable dynamic field and formula column visibility on the Entities Catalog table (`/world/entities`).
  - **Strict `shadcn-svelte` / `bits-ui` Zero-Badge Audit**: Refactored all routes to eliminate badge clutter and enforce accessible headless UI primitives (`Select`, `Label`, `Field`, `Card`, `Textarea`).
  - **Comprehensive Architectural Documentation Sync**: Updated `docs/ARCHITECTURE.md`, `docs/FRONTEND_ARCHITECTURE.md`, `docs/BACKEND_ARCHITECTURE.md`, `docs/DATABASE_ARCHITECTURE.md`, and `NOVWRITE_ARCHITECTURE.md` to reflect complete frontend, backend, and database revamp vision.
- **Current Verification:**
  - Full TypeScript type-checking and Svelte diagnostics passing (`svelte-check` 0 errors / 0 warnings).
  - All unit & integration test suites passing (32/32 tests).
- **Next Steps:**
  - Coordinate with user on the backend/database migration and implementation phase for the revamped `blueprints`, `blueprint_fields`, and `entities` schemas.
