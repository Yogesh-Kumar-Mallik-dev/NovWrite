# Frontend Design Decisions & Preferences

This document records the design preferences, framework choices, and UI/UX conventions shared across all three NovWrite frontends (**Web**, **Desktop**, and **Mobile**).

---

## 1. Frontend Frameworks & UI Stacks

### Web & Desktop

- **Framework**: [SvelteKit](https://svelte.dev/) (Svelte 5 Runes)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Tailwind v4)
- **Component Primitives**: [shadcn-svelte](https://shadcn-svelte.com/) / [Bits UI](https://bits-ui.com/)
  - **Configuration**: Initialized via `frontend/web/components.json` with style `nova`, base color `zinc`, and Tailwind v4 `@theme inline` variables.
  - **Available Official Components**: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `scroll-area`, `select`, `separator`, `sheet`, `tabs`, `textarea`, `tooltip`, `breadcrumb` located in `$lib/components/ui/`.
  - **Rule**: Always use `shadcn-svelte` / `bits-ui` component primitives instead of creating ad-hoc custom components from scratch.
- **Icons**: [@lucide/svelte](https://lucide.dev/)

- **Color Scheme & Aesthetic**:
  - **Inspiration**: **Linear / MongoDB Compass** developer workbench aesthetic (structured panels, crisp high-contrast borderlines `#27272a` / `#3f3f46`, dark graphite/zinc surfaces `#09090b` / `#18181b` and clean crisp light slate `#f8fafc` / `#ffffff`, tree-view sidebars, and accessible breadcrumbs).
  - **Solid, Grounded Developer Feel (No Marketing Gradients)**:
    - This is an IDE / consistency workbench, **not a product marketing landing page**. Avoid gratuitous gradients. Use clean, solid, grounded colors that convey security, precision, and focus.
  - **Primary Palette Accent**:
    - **Teal & Cyan** (`teal-400` / `cyan-400`): 1st-Class Blueprints and 2nd-Class Sub-Schemas.
    - **Amber** (`amber-400` / `amber-500`): Mathematical & Logical Formula Expressions and live calculations.
    - **Rose & Red** (`rose-500` / `red-600`): Invariant violations, continuity alerts, and critical mutations.
  - **Light & Dark Mode Support**:
    - Both Dark mode (default) and Light mode must be fully supported with persistent theme selection and clean contrast ratios across all components.

### Mobile (React Native & Expo)

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 52+, [Expo Router](https://docs.expo.dev/router/introduction/))
- **Styling Engine**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS v4 for React Native)
- **Component Primitives (Official `shadcn/ui` Equivalent for React Native)**:
  - **Library**: [React Native Reusables](https://reactnativereusables.com/) (`@rn-primitives`)
  - **Philosophy**: Direct equivalent of `shadcn/ui` for React Native. Provides unstyled, accessible primitive components (`@rn-primitives`) styled with `NativeWind` utility classes that you own and copy-paste directly into your codebase.
  - **Available Primitives**: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `separator`, `sheet` (bottom sheet), `tabs`, `textarea`, `tooltip`, `table`.
  - **Rule**: Always use `React Native Reusables` (`@rn-primitives` + `NativeWind`) to maintain exact 1:1 component and styling parity with `shadcn-svelte` on Web and Desktop.
- **Icons**: `lucide-react-native`
- **Navigation**: Expo Router (typed file-based navigation mirroring web route hierarchy).

---

## 2. Core UI/UX Design Principles & Decoupled Workspaces

1. **Decoupled Standalone Spaces (Writing Space vs Creation Space)**:
   - **NovWrite Prose Studio (Writing Space)** and **NovWrite World Studio (Creation / Canon Space)** operate as decoupled, standalone app workspaces. They are not tabs forced together inside a single cramped layout.
2. **Dedicated Page-Based Routing Architecture (No Tab-in-Modal Soup)**:
   - Every core creation domain is partitioned into a 3-tier dedicated route structure:
     - **List Page (Default `/`)**: Catalog table/grid with search, category filtering, and `[+ Create]` action button.
     - **Create Page (`/create`)**: Full-viewport creation form with dedicated validation and live test sandboxes.
     - **Update/Detail Page (`/[id]`)**: Deep-linkable inspector for modifying attributes, inspecting causal sequences, and testing dynamic formulas.
3. **Ample & Unobstructed Space for Prose Editor**:
   - The central scene markdown writing canvas receives **maximum screen real estate** (full-height, flexible wide margin, minimal toolbar overhead).
   - Sidebars (chapters/scenes tree) and inspector drawers (timeline/entities) must be compact, collapsible, or toggleable to ensure the writer has ample room for writing.
4. **Context-Aware Drawers**:
   - In the writing space, timeline events, active universe entity properties, and rule verification guards reside in collapsible side drawers that slide seamlessly into view without disrupting writer flow.
5. **Optimistic & Reactive Feedback**:
   - Continuity warnings, invariant guard alerts, and formula recalculations evaluate reactively in real time.

---

## 3. Blueprint Creation, Formulas & Dynamic Properties UX

### 3.1. Complete Freedom in Blueprint Creation & Clean Slate Architecture

- **Clean Slate Guarantee**: Creating a blueprint starts completely from scratch with a blank dynamic fields array—never preload dummy or arbitrary fields (e.g. `gender`).
- **Strict Lowercase Machine Keys**: Field machine keys (`name`) must strictly be lowercased (`.toLowerCase()`) and sanitized (`[^a-z0-9_\.]`).
- **Full Dynamic Field Editing & Slate Wipe**:
  - Authors can freely edit field types, names, labels, and bounds at any time.
  - Changing a field's type automatically wipes irrelevant type-specific configuration (e.g., number bounds or formulas on strings/enums; options on numbers/formulas) ensuring clean state.
- **Post-Save Route Redirection**:
  - After creating or saving edits on a blueprint or entity, always seamlessly navigate the user back to the primary domain table (`/world/schemas` for blueprints; `/world/entities` for entities).
- **First-Class vs. Second-Class Blueprint Hierarchy**:
  - **1st-Class Blueprints (Entity Archetypes)**: Instantiate tangible entities in the timeline (e.g. `Cultivator / Protagonist`, `Sacred Weapon & Relic`, `Sanctuary & Realm`, `Sect & Faction`).
  - **2nd-Class Blueprints (Sub-Blueprints & Value Objects)**: Reusable embedded data structures and continuous scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`) referenced inside 1st-Class blueprints.

### 3.2. Dynamic Enum Categories & Array Types

- When building `ENUM` fields, users can define and manage dynamic option tags (e.g. `elemental_affinities` with `["Fire", "Water", "Lightning", "Wind"]`).
- When building `ARRAY` fields, users can store freeform string/item lists (e.g., titles, martial arts techniques).
- When building `ARRAY_REF` fields, users can multi-select referenced entities of a target blueprint.
- In entity forms, options dynamically populate accessible `Select` dropdown components.

### 3.3. Mathematical & Logical Formula Editor UX

- Blueprints support computed `FORMULA` fields evaluated by a safe, sandboxed AST expression engine ([`formulaEngine.ts`](file:///home/yogesh/Projects/NovWrite/apps/web/src/lib/engine/formulaEngine.ts)).
- **Formula Editor Toolbar**:
  - Quick-insert variable chips for all sibling and dot-notation fields (e.g., `cultivation.major_realm`, `attack`, `special_Physique`).
  - Operator insertion buttons (`+`, `-`, `*`, `/`, `^`, `%`, `(`, `)`, `IF(`, `CLAMP(`, `MIN(`, `MAX(`, `SQRT(`).
  - Real-time syntax validation indicator (green checkmark for valid syntax, inline error message for unbalanced parentheses or invalid tokens).
  - Live test sandbox allowing authors to input mock numbers and verify formula outputs before saving.
- **Real-Time Reactive Updates in Entity Forms**:
  - When editing entity attributes in `/world/entities/create` or `/world/entities/[id]`, formula outputs (such as `Total Combat Power`) recalculate and update instantly on the screen as the user types.

---

## 4. Visual Styling Standards & Zero-Badge Policy

### 4.1. Strict Prohibition of Excessive Gradients & Visual Noise

- **Solid, Grounded Surfaces Over Gradients**: NovWrite is an authoring and lorekeeping IDE/workbench, **not a marketing landing page**.
- **Rule**: Avoid multi-color rainbow gradients, glossy glassmorphism, animated glow borders, and heavy drop shadows.
- **Permitted Usage**: Solid background colors (`zinc-900`, `zinc-950`, `slate-900`), crisp 1px borders (`border-zinc-800` / `border-slate-200`), and subtle monochromatic depth accents.

### 4.2. Complete Prohibition of Badges (Zero-Badge Policy)

- **Zero Badges Across the UI**: Badges, colored pill tags, and badge-adjacent chips are **strictly prohibited** across all application views.
- **Modern UI Replacements**:
  - **Status & Identity**: Use semantic **Icons with subtle typography** (e.g. green circle dot for clean state, red alert for violation, pink heart for affection bonds, amber calculator for formulas).
  - **Navigation & Hierarchy**: Use **Breadcrumbs** (e.g. `NovWrite / World Studio / Entities / Eldrin the Spellblade`) for contextual location.
  - **Inspection & Actions**: Use **Interactive Buttons** and **Slide-Over Drawers / Sheets** for metadata inspection rather than clustering inline badges.
  - **Typography & Tags**: Use clean, low-contrast monospace typography (`font-mono text-xs text-zinc-400`) and simple text labels without bordered chip backgrounds.

### 4.3. Communication Layer Separation from Frontend UI

- **Communication Layer Is Internal**: The `@novwrite/bridge` RPC/SSE transport and internal diagnostic message hubs are backend communication machinery and **MUST NOT be exposed as primary UI navigation items** in the main user-facing frontend.
- **User-Facing Focus**: The frontend must focus exclusively on the core creative authoring workflows (**Prose Studio** and **World Studio**). Internal communication debugging belongs strictly in dev CLI tooling or isolated hidden debug routes (`/dev/communication-hub`).

### 4.4. Dropdown Standard: Mandatory `Select` from `shadcn-svelte`

- **Rule**: For all dropdown menus, category selectors, enum choosers, and option pickers, **ALWAYS use the official `Select` component from `shadcn-svelte`** (`$lib/components/ui/select`) or `React Native Reusables` on mobile.
- **Prohibitions**:
  - NEVER use native unstyled `<select>` elements.
  - NEVER build custom DIY dropdowns with raw `<div>` click listeners.
  - Use `Select` (with `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Content`, `Select.Item`) to guarantee keyboard navigation, ARIA accessibility, focus ring styling, and theme consistency.

### 4.5. JSON Editor Standard: CodeMirror 6 with Syntax Highlighting & Word Wrapping

- **Rule**: For all raw JSON editing and diagnostics inspection, embed the official CodeMirror 6 component (`$lib/components/ui/json-editor/json-editor.svelte`).
- **Features Required**:
  - Word wrapping (`EditorView.lineWrapping`) enabled by default so text does not clip or cause horizontal overflow.
  - Consistent token coloring (Cyan keys, Emerald strings, Orange numbers, Rose booleans, Purple null).
  - Dynamic light/dark theme synchronization via `themeStore.mode`.

### 4.6. Theme Switcher Standard: Sliding Toggle with Single Inactive Icon

- **Rule**: Theme toggle must be a sliding switch with an animated thumb.
- **Icon Convention**: Only display the inactive target icon on the exposed slot of the track (Sun icon when in Dark mode; Moon icon when in Light mode).

### 4.7. Error Screens Standard: Full-Screen Isolated Canvases with Generous Whitespace

- **Rule**: 404 and 500 error pages must be completely isolated full-screen views.
- **Chrome Removal**: Remove all top development bars, main navigation bars, and studio switchers on error pages.
- **Spacing**: Ample vertical breathing room (`space-y-10 md:space-y-12`, `py-16 md:py-24`) between badge, hero number, description, buttons, and diagnostic inspector.

### 4.8. Entity Editor 3-Tier Visual Hierarchy Layout Standard

- **Rule**: The header of the Entity Editor (`/world/entities/[id]`) must strictly follow a 3-tier vertical hierarchy:
  - **Tier 1 (Location & Navigation)**: Breadcrumbs path (`‹ All Entities / World Studio › Entities › {entity.name}`) providing location without competing with actions.
  - **Tier 2 (Identity Banner)**: Prominent entity name, archetype icon, template link, category, and sequence number.
  - **Tier 3 (Utilities & Actions Toolbar)**: View mode segmented controls (`Visual Form` vs `Raw JSON`), Feather History revision drawer trigger with live revision count (`⚡ Feather History (N)`), schema jump button, and primary `Save Changes` button.

### 4.9. UPDATE Pipe & Hanging EDIT Trees Visualizer (`PipeTreeVisualizer.svelte`)

- **Rule**: Always render dual-axis revision history using the interactive `PipeTreeVisualizer` component.
- **Visual Design**:
  - Horizontal narrative pipeline conduit with glowing connecting lines.
  - Vertical branch nodes with tree-connector rails.
  - Clear `[⚡ ACTIVE EDIT HEAD]` pill indicator on the active node.
  - Interactive non-destructive checkout on node click.

### 4.10. Strict Schema Invariance & Eradication of Arbitrary Instance Properties

- **Rule**: The Entity Editor must **never display an unmanaged "Custom & Extended Object Properties" section**.
- **Blueprint-First**: All entity attributes must be governed by the Blueprint schema. To add or modify fields, users edit the Blueprint in `/world/schemas/[id]`. This prevents schema drift and maintains zero-trust validation parity.

---

## 5. Core Responsive Philosophy: Fluid Layouts & Viewport Resilience

### 5.1. Philosophy

- Do NOT approach responsiveness as "add more Tailwind breakpoints for more devices."
- Target: **"Every component should remain usable and visually correct for any reasonable viewport/container size."**
- Core principles:
  1. **Fluid layouts** (`w-full`, `max-w-[min(..., 100%)]`, dynamic clamp typography and editor heights).
  2. **Container-aware components** and auto-fit grids (`grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]`).
  3. **Small number of structural breakpoints** (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) representing genuine interaction shifts.
  4. **Content-driven sizing** rather than hardcoded pixel widths.
  5. **Defensive overflow & flex wrapping** (`min-w-0`, `flex-wrap gap-2`, `truncate`).
  6. **Zero Root Horizontal Overflow**: `scrollWidth > innerWidth` must never occur on the root viewport.
  7. **Isolated Horizontal Scrolling**: Tables and complex visualizers scroll strictly inside bounded containers (`overflow-x-auto w-full min-w-0`).
  8. **Viewport-Safe Modals & Dialogs**: All modals/dialogs must be constrained to `max-h-[min(90dvh,800px)] overflow-y-auto` with internal scrolling to prevent action button clipping on short screens (e.g. 1280×600 laptop or 844×390 mobile landscape).
  9. **Safe Area Cover**: Always include `viewport-fit=cover` in meta viewport for notch and foldable display support.

---

## 6. Mobile-First Adaptation: Do NOT Force Desktop UI

### 6.1. Philosophy

Do NOT interpret "responsive" as: _"Take the desktop layout and squeeze everything until it fits on mobile."_

When a desktop interaction pattern becomes unsuitable for a small screen, deploy the **appropriate mobile-specific interaction pattern instead**. The application must have genuinely different UI structures when necessary.

### 6.2. Structural Interaction Mappings

| Surface                    | Desktop UI (≥ 768px / md)                                                                 | Mobile UI (< 768px / md)                                                                                                                                               |
| :------------------------- | :---------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Global Navigation**      | Persistent horizontal top bar with studio switchers & project telemetry.                  | **Hamburger `[☰]` (min 44px) + Slide-Over Drawer/Sheet** with project context, workspaces, and sub-links.                                                             |
| **Sub-Header Navigation**  | Horizontal tab pills list across the top.                                                 | **Breadcrumb + Mobile Section Dropdown (`Select`)** for 1-tap switching without horizontal scrolling.                                                                  |
| **Data Tables**            | Full wide tabular grid (`<Table>`) with blueprint-tuned dynamic columns & sticky headers. | **Dedicated Mobile Entity Card List** (with icon, name, category pill, `#Seq` badge, live formula chips, and full-width touch actions) + optional Table view switcher. |
| **Workbench Toolbars**     | Multi-item horizontal toolbar.                                                            | **Prominent full-width search** + Compact Action/View switcher row + primary `+ Create` button.                                                                        |
| **Form Layouts**           | Multi-column side-by-side attribute grid.                                                 | **Single-column stacked form** with generous vertical spacing and min 44px touch targets.                                                                              |
| **Complex Inspectors**     | Side-by-side 12-column dual-axis inspector.                                               | **Mobile Segmented Tabbed Inspector** (`[Authorial Revisions (N)]` vs `[Plot Coordinates & State]`).                                                                   |
| **Action Trays & Footers** | Right-aligned horizontal button row `[Cancel] [Save] [Delete]`.                           | **Stacked Primary Action** (full-width `[Save Changes]`) above secondary actions (`[Delete]`, `[Cancel]`).                                                             |

### 6.3. Preference Order for Small Viewports

1. Fluidly resize it if it remains usable
2. Reflow / wrap it if that remains usable
3. Change the layout structure (e.g. 2-col to 1-col stack)
4. Replace desktop interaction with a mobile-specific interaction (e.g. table $\to$ touch cards; split panels $\to$ mobile tabs)
5. Move secondary actions into an overflow menu (`[⋮]` or sheet)
6. Collapse navigation into a drawer / sheet
7. Stack content vertically
8. Use isolated horizontal scrolling ONLY when the content genuinely requires it

---

## 7. Standardized 10-Item Pagination & Layout Jump Prevention UX

1. **Standard 10-Item Page Size**: All GET endpoints, entities registries, timeline streams, and schemas lists MUST be paginated into standard 10-item pages.
2. **Top Pagination Header Bar**: Pagination controls (Showing range, `[Previous]`, `Page X / Y`, `[Next]`) MUST be positioned **ABOVE** the table/card list container.
   - Placing pagination above the data ensures users can navigate pages without having the pagination bar jump up and down dynamically based on varying record heights or counts.
3. **Zero Layout Shifts**: Heights and pagination boundaries must be deterministic.

---

## 8. AI UI/UX Anti-Patterns Checklist

All AI coding agents must proactively audit against this checklist before submitting UI changes:

1. **Did you add any badge or pill tag?** $\to$ Replace with icons with text, action buttons, or breadcrumbs.
2. **Did you use native unstyled `<select>`?** $\to$ Replace with `shadcn-svelte` `Select` component.
3. **Did you create a modal or nested tab for a major domain?** $\to$ Provide a dedicated page route (`/`, `/create`, `/[id]`).
4. **Did you expose internal communication layers in main nav?** $\to$ Restrict to `/dev/communication-hub`.
5. **Did you test live formula reactivity?** $\to$ Ensure dynamic formulas re-evaluate seamlessly on state modifications.
6. **Did you ensure getters called in `$derived` are side-effect free?** $\to$ Never mutate `$state` inside derivations.
7. **Did you verify error screens have chrome stripped and word wrapping enabled?** $\to$ Check full isolation on 404/500 routes.
8. **Did you include arbitrary unmanaged custom properties in Entity Editor?** $\to$ Eradicate; enforce strict Blueprint schema invariance.
9. **Did you respect the 3-Tier Visual Hierarchy in Entity Editor?** $\to$ Ensure Tier 1 (Navigation), Tier 2 (Identity), and Tier 3 (Actions) are clearly separated.
10. **Did you squeeze desktop UI instead of deploying mobile interaction patterns?** $\to$ Deploy Hamburger/Drawer, Mobile Cards, Single-Column Forms, and Tabbed Inspectors.
11. **Did you cause root page-level horizontal overflow (`scrollWidth > innerWidth`)?** $\to$ Wrap wide content in `overflow-x-auto w-full min-w-0`.
12. **Did you place pagination below tables where it jumps?** $\to$ Place pagination bar above the table/card list container.
13. **Are modals missing `max-h-[min(90dvh,800px)] overflow-y-auto`?** $\to$ Ensure dialogs are bounded and internally scrollable.
14. **Are touch targets smaller than 36px–44px on mobile?** $\to$ Ensure all interactive buttons and inputs meet mobile touch target requirements.
