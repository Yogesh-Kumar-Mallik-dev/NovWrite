# Agent Instructions

Welcome, Agents! When working in this repository, you must adhere to the following rules:

1. **Context Tracking**:
   Before ending your task, you must always record your current context, the last step you completed, and any ongoing plans or immediate next steps into `current_context.md`.
2. **Reviewing Context**:
   At the start of your task, always review `current_context.md` to understand where the previous agent left off.
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
   Always run prettier (`pnpm dlx prettier --write .` or `pnpm prettier --write .`) before updating `current_context.md` or committing changes to ensure consistent repository code style.
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
     - Whenever building, modifying, or extending UI elements (buttons, badges, cards, inputs, tabs, dialogs, dropdowns, sheets, popovers, selects, tooltips, scroll-areas, separators), agents **MUST use `shadcn-svelte` components** (located in `$lib/components/ui/` or installed via `pnpm dlx shadcn-svelte add <component>`) instead of designing or inventing ad-hoc components from scratch.
     - Custom UI primitives are only permitted if no applicable `shadcn-svelte` / `bits-ui` component exists.
   - **Mandatory Hand-in-Hand Responsiveness**: Whenever any frontend component, layout, or feature is built or updated, responsiveness **MUST be implemented hand-in-hand** in the exact same change. Deferring responsive styling is strictly prohibited.
   - **Focus on Awkward Non-Standard Android Widths**: Frontends must be rigorously engineered and tested to handle narrow and non-standard Android viewports (e.g. 280px–360px outer foldable displays, compact Android devices 360px–390px, tall 20:9/21:9 aspect ratios, and virtual keyboard height shifts). Prevent all horizontal overflow, wrap toolbars gracefully, and provide accessible touch targets.
   - **Unified Responsive Parity**: All 3 frontends share identical UI elements (barring platform/OS-specific handling). A minimized or narrow Web or Desktop window must adapt to look and behave like the Mobile client, and Mobile on large viewports must expand into the full multi-pane studio view.
10. **Strict UI/UX Rules & AI Anti-Pattern Avoidance**:
    - **Avoid Excessive Gradients & Glows**: Use solid, grounded surfaces (Linear/MongoDB Compass aesthetic). Do not use multi-color rainbow gradients, glossy glassmorphism, or AI glow shimmers.
    - **Strict Badge Discipline**: Badges are permitted **primarily on data tables** for status/enum indicators (e.g., `ALIVE`, `DEAD`, `PUBLISHED`) and compact header status pills. **DO NOT** scatter badges across cards, labels, or body text.
    - **Mandatory `Select` from `shadcn-svelte` for Dropdowns**: For dropdown option selection, **ALWAYS use `Select` from `shadcn-svelte`** (`$lib/components/ui/select`). Never use unstyled native `<select>` or custom div click hacks.
    - **Mandatory Pre-Commit UI/UX Checklist**: Before finalizing any frontend task, agents must verify:
      1. _No Card Sprawl_: Group data into dense master-detail tables or clean lists rather than wrapping every tiny field in its own bordered Card.
      2. _No Modal Soup_: Never open modals inside modals. Use side sheets (`Sheet`) or dedicated `/world/*` workbench routes.
      3. _Complete States_: Include designed empty states (`Skeleton`, empty illustration/icon + action button) and error recovery messages.
      4. _Keyboard Navigation_: Ensure `Esc` closes sheets/drawers, `Tab` traverses form inputs, and `Select` works via arrow keys.
      5. _Verified Contrast_: Ensure text meets WCAG AA 4.5:1 contrast against dark/light surfaces.
