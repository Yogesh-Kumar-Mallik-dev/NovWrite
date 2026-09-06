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

### 3.1. Complete Freedom in Blueprint Creation
- Users have total freedom to construct custom blueprints from scratch with arbitrary categories, freeform domain tags, and multi-typed fields.
- **First-Class vs. Second-Class Blueprint Hierarchy**:
  - **1st-Class Blueprints (Entity Archetypes)**: Instantiate tangible entities in the timeline (e.g. `Cultivator / Protagonist`, `Sacred Weapon & Relic`, `Sanctuary & Realm`, `Sect & Faction`).
  - **2nd-Class Blueprints (Sub-Blueprints & Value Objects)**: Reusable embedded data structures and continuous scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`) referenced inside 1st-Class blueprints.

### 3.2. Dynamic Enum Categories
- When building `ENUM` fields, users can define and manage dynamic option tags (e.g. `gender` with custom categories `["Male", "Female", "Dual-Yin-Yang", "Celestial"]`).
- In entity forms, these options dynamically populate accessible `Select` dropdown components.

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

---

## 5. AI UI/UX Anti-Patterns Checklist

All AI coding agents must proactively audit against this checklist before submitting UI changes:

1. **Did you add any badge or pill tag?** $\to$ Replace with icons with text, action buttons, or breadcrumbs.
2. **Did you use native unstyled `<select>`?** $\to$ Replace with `shadcn-svelte` `Select` component.
3. **Did you create a modal or nested tab for a major domain?** $\to$ Provide a dedicated page route (`/`, `/create`, `/[id]`).
4. **Did you expose internal communication layers in main nav?** $\to$ Restrict to `/dev/communication-hub`.
5. **Did you test live formula reactivity?** $\to$ Ensure dynamic formulas re-evaluate seamlessly on state modifications.
