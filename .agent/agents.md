# Agent Instructions

Welcome, Agents! When working in this repository, you must adhere to the following rules:

1. **Context Tracking**:
   Before ending your task, you must always record your current context, the last step you completed, and any ongoing plans or immediate next steps into `.agent/current_context.md`.
2. **Reviewing Context**:
   At the start of your task, always review `.agent/current_context.md` to understand where the previous agent left off.
3. **Architecture Adherence**:
   Respect the repository's architectural boundaries (e.g., separate domain logic, UI, and transport layers without circular or unauthorized imports).
4. **Mandatory Hand-in-Hand Testing & 100% Coverage Target**:
   - **Co-Located Tests with Every Feature**: Whenever a new feature, domain module, helper, or handler is added or modified, corresponding unit tests **MUST** be created or updated hand-in-hand in the exact same change. No feature is complete without tests.
   - **100% Test Coverage Objective**: Strive for 100% unit test coverage across all domain logic, state machines, rule validators, and API/gRPC handlers. Cover happy paths, edge cases, and error branches.
   - **Dependency Injection & Decoupled Design**:
     - Design all components using **Dependency Injection (DI)** and explicit interfaces.
     - Avoid hardcoding database clients, network calls, or global state in business logic; inject mockable interfaces via constructors or factory functions.
     - Utilize test mocks and spies to guarantee rapid, deterministic, and isolated test suites without requiring live infrastructure during unit tests.
5. **Git Checkpoints & Commit Format**:
   - **Strict Single-Change Policy**: Only perform **one change at a time**—one feature, one refactor, or one fix per task/commit.
   - **Reject Multi-Change Requests**: If a user request contains multiple changes (e.g. multiple features, combinations of fixes + refactors, or multiple distinct tasks), you **MUST reject the request for multiple changes**, explain the single-change policy, and ask the user to split or pick one change to execute first.
   - **Commit Message Format**: Always format git commit messages strictly as:
     ```text
     <type>(<domain>): <expression>
     ```
     Examples: `feat(editor): implement markdown syntax parser`, `fix(auth): handle token expiration grace period`, `refactor(storage): streamline cache invalidation`.
   - **Signed Commits**: Always perform a `git commit -S -m "..."` immediately after completing any functional change, documentation update, or bug fix before passing control back to the user.
6. **Package Manager Standard (pnpm Only)**:
   - Always use **pnpm** exclusively across the monorepo for workspace orchestration, dependency management, script execution, and tool execution (e.g. `pnpm install`, `pnpm --filter <pkg> <cmd>`, `pnpm dlx <tool>`).
   - Never use `npm`, `npx`, or `yarn`.
7. **Code Formatting**:
   Always run prettier (`pnpm dlx prettier --write .` or `pnpm prettier --write .`) before updating `.agent/current_context.md` or committing changes to ensure consistent repository code style.
8. **Block-Based Code Construction & Error Standards**:
   - **Block Structure & Comment Headers**: Write code in modular, logical blocks. Every block must start with a descriptive comment header explaining:
     - What the block is supposed to do
     - The desired output, output types, and data formats (where applicable)
   - **Flat Logic with Early Returns**: Avoid deeply nested conditionals. Utilize guard clauses and **early returns** to ensure the main execution path remains flat and easily visible.
   - **Unique Block IDs & Descriptive Error Messages**:
     - Assign every logical block its own **unique block ID** (e.g., `BLOCK_<DOMAIN>_<ACTION>_<ID>`).
     - Any error generated or returned by a block must **always mention the unique block ID** so developers can immediately identify exactly which block failed.
     - Errors must be specific and descriptive about the exact problem that can occur in that block.
9. **Frontend Design Decisions, Hand-in-Hand Responsiveness & Mobile Parity**:
   - Always consult and adhere to `frontend_design_descisions.md` before designing, modifying, or implementing any frontend components, themes, layouts, or UX workflows across any of the 3 frontends (Web, Desktop, Mobile).
   - Any architectural decision, UI library choice, styling convention, or design preference regarding frontends must be recorded in `frontend_design_descisions.md`.
   - **Mandatory Use of shadcn-svelte Component Library**:
     - `shadcn-svelte` is initialized and configured (`frontend/web/components.json`) as the official UI component library across NovWrite frontends.
     - Whenever building, modifying, or extending UI elements (buttons, cards, inputs, tabs, dialogs, dropdowns, sheets, popovers, selects, tooltips, scroll-areas, separators), agents **MUST use `shadcn-svelte` components** (located in `$lib/components/ui/` or installed via `pnpm dlx shadcn-svelte add <component>`) instead of designing or inventing ad-hoc components from scratch.
     - Custom UI primitives are only permitted if no applicable `shadcn-svelte` / `bits-ui` component exists.
   - **Mandatory Hand-in-Hand Responsiveness**: Whenever any frontend component, layout, or feature is built or updated, responsiveness **MUST be implemented hand-in-hand** in the exact same change. Deferring responsive styling is strictly prohibited.
   - **Focus on Awkward Non-Standard Android Widths**: Frontends must be rigorously engineered and tested to handle narrow and non-standard Android viewports (e.g. 280px–360px outer foldable displays, compact Android devices 360px–390px, tall 20:9/21:9 aspect ratios, and virtual keyboard height shifts). Prevent all horizontal overflow, wrap toolbars gracefully, and provide accessible touch targets.
   - **Unified Responsive Parity**: All 3 frontends share identical UI elements (barring platform/OS-specific handling). A minimized or narrow Web or Desktop window must adapt to look and behave like the Mobile client, and Mobile on large viewports must expand into the full multi-pane studio view.
10. **Strict UI/UX Rules, Zero-Badge Policy & Dedicated Page Routes**:
    - **Zero-Badge Policy**: Badges, pill tags, and badge-adjacent colored chips are **strictly prohibited** across the entire frontend. Replace with semantic icons with text dots, interactive action buttons, breadcrumb navigation, and slide-over side drawers/sheets.
    - **Dedicated Page-Based Routes Architecture**: Every primary creation and editing domain MUST be partitioned into dedicated page routes:
      - Default List view (`/` with search, filtering, and a `[+ Create]` action button)
      - Dedicated Creation view (`/create`)
      - Dedicated Update/Detail view based on ID (`/[id]`)
      - Never cram complex multi-field schemas, formula editors, or entity forms into popups or single-page tabs.
    - **No Communication Layer in Frontend**: The `@novwrite/bridge` transport and internal diagnostic message hubs belong to backend machinery and must **NOT** be exposed in primary user-facing navigation or UI bars.
    - **Avoid Excessive Gradients & Glows**: Use solid, grounded surfaces (Linear/MongoDB Compass aesthetic). Do not use multi-color rainbow gradients, glossy glassmorphism, or AI glow shimmers.
    - **Mandatory `Select` from `shadcn-svelte` for Dropdowns**: For dropdown option selection, **ALWAYS use `Select` from `shadcn-svelte`** (`$lib/components/ui/select`). Never use unstyled native `<select>` or custom div click hacks.
    - **Breadcrumbs, Icons & Drawers**: Use breadcrumbs for hierarchical context, clean icons for state indicators, and slide-over sheets/drawers for inspection.
11. **First-Class & Second-Class Blueprint Freedom & Sandboxed Formula Standards**:
    - **1st-Class Blueprints (Entity Archetypes)**: Primary entities that instantiate into the world timeline with unique IDs, state snapshots, and causal mutations (e.g., Characters, Sacred Relics, Realms, Factions).
    - **2nd-Class Blueprints (Sub-Blueprints & Value Objects)**: Reusable embedded data structures and continuous scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`) that are referenced in 1st-Class or other 2nd-Class blueprints.
    - **Dynamic Enum Categories**: Allow users to configure dynamic options on `ENUM` fields (e.g. `gender` with `["Male", "Female", "Dual-Yin-Yang", "Celestial"]`) and render with `Select`.
    - **Safe Mathematical Formula Engine**: Any dynamic computed fields must use the safe AST expression parser ([`formulaEngine.ts`](file:///home/yogesh/Projects/NovWrite/apps/web/src/lib/engine/formulaEngine.ts)). Never use raw `eval()`. Support dot-notation properties (`cultivation.major_realm`), arithmetic, logical conditionals (`IF`), and math functions (`CLAMP`, `MIN`, `MAX`, `SQRT`, `POW`).
12. **Zero-Trust Backend Validation Parity, Lowercase Machine Keys & Clean Slate Rules**:
    - **Strict Lowercase Machine Keys**: Field machine keys (`name`) must always be strictly lowercased (`.toLowerCase()` / `strings.ToLower`) and sanitized (`[^a-z0-9_\.]`). Schema-level duplicate field keys must be rejected with `DUPLICATE_FIELD_KEY`.
    - **Clean Slate Guarantee**: Creating a blueprint must always start completely from scratch with a blank dynamic fields array. Never preload arbitrary or hardcoded dummy fields (e.g. `gender`).
    - **Dynamic Field Type Slate Wipe**: Modifying a field's type must immediately wipe irrelevant type configuration (bounds, enum options, formulas) on both frontend and backend.
    - **Deterministic Backend Formula Recomputation**: Formulas must be parsed, validated, and computed deterministically on the backend (`formula_engine.go` & `formulaEngine.ts`). Never trust client-provided numbers.
    - **100% Bits UI Select Dropdown Usage**: Every single dropdown selector in the web app must use the official `Select` primitive from `shadcn-svelte` / `Bits UI`.
    - **Post-Save Navigation Redirect**: Blueprint and Entity creation/edit forms must always navigate the user back to `/world/schemas` or `/world/entities` upon successful save.
13. **Core Responsive Philosophy & Layout Robustness**:
    - **No Device-Specific Query Chasing**: Do not add random breakpoints for specific phone models. Every component must be fluidly usable at arbitrary container and viewport sizes (from 280px foldables up to 4K ultrawide monitors and 200% font zoom).
    - **Zero Root Horizontal Overflow**: Root page-level horizontal overflow (`scrollWidth > innerWidth`) is **strictly forbidden**. Any component requiring extensive width (e.g. data tables, narrative pipe tracks) must be wrapped in an isolated horizontal container (`overflow-x-auto w-full min-w-0`).
    - **Viewport-Safe Modals & Dialogs**: All modals, sheets, and dialogs must be constrained to `max-h-[min(90dvh,800px)] overflow-y-auto` with internal scrolling to prevent action buttons and headers from being clipped on short viewports (e.g., 1280×600 laptop or 844×390 mobile landscape).
    - **Touch Targets & Fluid Spacing**: Minimum 36px–44px touch targets for all interactive controls on mobile.
14. **Mobile-First Adaptation — Do NOT Force Desktop UI**:
    - **No "Squeezing" Desktop UI**: Responsive design is **NOT** taking desktop layouts and squeezing text/buttons until they fit on mobile. When a desktop interaction pattern becomes unsuitable for a small screen, you **MUST use the appropriate mobile-specific interaction pattern instead**.
    - **Intentional Structural Interaction Mappings**:
      - _Desktop Persistent Nav / Sidebar_ $\to$ _Mobile Hamburger `[☰]` + Slide-Over Drawer/Sheet_.
      - _Desktop Multi-Item Subnav_ $\to$ _Breadcrumb + Mobile Section Dropdown (`Select`)_.
      - _Desktop Wide Multi-Column Table_ $\to$ _Dedicated Mobile Entity Card List_ (with key attributes preview, live formula chips, and full-width touch actions) + optional table toggle.
      - _Desktop Multi-Column Form Grid_ $\to$ _Single-Column Stacked Form_ with generous vertical touch spacing.
      - _Desktop Side-by-Side Dual-Axis Split_ $\to$ _Mobile Segmented Tabbed Inspector_ (`[Revisions]` vs `[Coordinates & State]`).
      - _Desktop Horizontal Action Button Trays_ $\to$ _Stacked Primary Full-Width Action_ above secondary actions.
    - **Strict Architectural Preference Order**:
      1. Fluidly resize it if it remains usable
      2. Reflow/wrap it if that remains usable
      3. Change the layout structure (e.g. 2-col to 1-col stack)
      4. Replace desktop interaction with a mobile-specific interaction (e.g. table $\to$ touch cards; split panels $\to$ mobile tabs)
      5. Move secondary actions into an overflow menu (`[⋮]` or sheet)
      6. Collapse navigation into a drawer/sheet
      7. Stack content vertically
      8. Use isolated horizontal scrolling ONLY when the content genuinely requires it
15. **Standardized 10-Item Pagination & Layout Jump Prevention**:
    - **Standard 10-Item Page Size**: All GET endpoints, list views, timeline feeds, and table datasets must be paginated in 10-item chunks with standardized metadata (`page`, `pageSize: 10`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`).
    - **Top Pagination Bar Location**: Pagination controls MUST be positioned **ABOVE** tables/lists rather than below, preventing cumulative layout shifts (CLS) and UI jumps when record heights vary across pages.
