# Frontend Design Decisions & Preferences

This document records the design preferences, framework choices, and UI/UX conventions shared across all three NovWrite frontends (**Web**, **Desktop**, and **Mobile**).

---

## 1. Frontend Frameworks & UI Stacks

### Web & Desktop

- **Framework**: [SvelteKit](https://svelte.dev/) (Svelte 5 Runes)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Tailwind v4)
- **Component Primitives**: [shadcn-svelte](https://shadcn-svelte.com/) / [Bits UI](https://bits-ui.com/)
  - **Configuration**: Initialized via `frontend/web/components.json` with style `nova`, base color `zinc`, and Tailwind v4 `@theme inline` variables.
  - **Available Official Components**: `button`, `badge`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `scroll-area`, `select`, `separator`, `sheet`, `tabs`, `textarea`, `tooltip` located in `$lib/components/ui/`.
  - **Rule**: Always use `shadcn-svelte` / `bits-ui` component primitives instead of creating ad-hoc custom components from scratch. Install additional components with `pnpm dlx shadcn-svelte add <component>`.
- **Icons**: [@lucide/svelte](https://lucide.dev/)

- **Color Scheme & Aesthetic**:
  - **Inspiration**: **MongoDB Compass / Linear** developer workbench aesthetic (structured panels, crisp high-contrast borderlines `#334155` / `#e2e8f0`, dark graphite/zinc surfaces `#080c14` / `#0d1322` and clean crisp light slate `#f8fafc` / `#ffffff`, tree-view sidebars, and pill badges).
  - **Solid, Grounded Developer Feel (No Marketing Gradients)**:
    - This is an IDE / consistency workbench, **not a product marketing landing page**. Avoid gratuitous gradients. Use clean, solid, grounded colors that convey security, precision, and focus.
  - **Dual Primary Color Palette (Balanced Solid Purple & Red)**:
    - **Solid Purple** (`purple-600` / `purple-700` / `#7c3aed`): Primary workbench identity, tree hierarchy, active tabs, and AI grounding features.
    - **Solid Red** (`red-600` / `red-700` / `#dc2626`): Invariant verification badges, continuity guard status, timeline mutation triggers, and alert highlights.
  - **Light & Dark Mode Support**:
    - Both Dark mode (default) and Light mode must be fully supported with persistent theme selection and clean contrast ratios across all components.

### Mobile (React Native & Expo)

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 52+, [Expo Router](https://docs.expo.dev/router/introduction/))
- **Styling Engine**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS v4 for React Native)
- **Component Primitives (Official `shadcn/ui` Equivalent for React Native)**:
  - **Library**: [React Native Reusables](https://reactnativereusables.com/) (`@rn-primitives`)
  - **Philosophy**: Direct equivalent of `shadcn/ui` for React Native. Provides unstyled, accessible primitive components (`@rn-primitives`) styled with `NativeWind` utility classes that you own and copy-paste directly into your codebase.
  - **Available Primitives**: `button`, `badge`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `separator`, `sheet` (bottom sheet), `tabs`, `textarea`, `tooltip`, `table`.
  - **Rule**: Always use `React Native Reusables` (`@rn-primitives` + `NativeWind`) to maintain exact 1:1 component and styling parity with `shadcn-svelte` on Web and Desktop.
- **Icons**: `lucide-react-native`
- **Navigation**: Expo Router (typed file-based navigation mirroring web route hierarchy).
- **Color Scheme & Theme Parity**:
  - Exact MongoDB Compass-inspired solid Purple (`#7c3aed`) and Red (`#dc2626`) palette.
  - Instant Light/Dark mode parity synced with device settings or user override.
  - Adaptive single-column views with native bottom action bars, bottom sheets, and sticky virtual keyboard toolbars.

---

## 2. Core UI/UX Design Principles & Decoupled Workspaces

1. **Decoupled Standalone Spaces (Writing Space vs Creation Space)**:
   - **NovWrite Prose Studio (Writing Space)** and **NovWrite World Studio (Creation / Canon Space)** operate as decoupled, standalone app workspaces. They are not tabs forced together inside a single cramped layout.
   - **Strict Anti-Pattern Prohibition (No Tab-in-Modal Soup)**:
     - Complex domains such as Character Builders, Custom Field Schemas, Power Progression Ladders, Techniques, Rules Builders, and Timeline Change History **MUST NEVER** be jammed into modals or nested tabs on a single screen.
     - Each domain is a first-class, dedicated standalone page equipped with full-viewport master-detail data tables, rich attribute inspectors, and historical change tables.
2. **Ample & Unobstructed Space for Prose Editor**:
   - The central scene markdown writing canvas receives **maximum screen real estate** (full-height, flexible wide margin, minimal toolbar overhead).
   - Sidebars (chapters/scenes tree) and inspector drawers (timeline/entities) must be compact, collapsible, or toggleable to ensure the writer has ample room for writing.
3. **Context-Aware Drawers**:
   - In the writing space, timeline events, active universe entity properties, and rule verification guards reside in collapsible side drawers that slide seamlessly into view without disrupting writer flow.
4. **Optimistic & Reactive Feedback**:
   - Continuity warnings, invariant guard alerts, and timeline updates evaluate reactively in real time.
5. **Consistency-First Data Visualization**:
   - Invariant statuses and entity mutations are color-coded (e.g., emerald for verified continuity, purple & red for active timeline invariants and continuity guards).

---

## 3. Visual Styling Standards, Badge Discipline & Form Controls

### 3.1. Strict Prohibition of Excessive Gradients & Visual Noise

- **Solid, Grounded Surfaces Over Gradients**: NovWrite is an authoring and lorekeeping IDE/workbench, **not a marketing landing page**.
- **Rule**: Avoid multi-color rainbow gradients, glossy glassmorphism, animated glow borders, and heavy drop shadows.
- **Permitted Usage**: Solid background colors (`zinc-900`, `zinc-950`, `slate-900`), crisp 1px borders (`border-zinc-800` / `border-slate-200`), and subtle monochromatic depth accents. Subtle 2% linear fades are only permitted for scroll fades and backdrop scrims.

### 3.2. Complete Prohibition of Badges (Zero-Badge Policy) & Clean Modern UI

- **Complete Elimination of Badges**: Badges, pill tags, and badge-adjacent colored chips are **strictly prohibited** across the entire frontend.
- **Modern UI Replacements**:
  - **Status & Enums**: Use semantic **Icons with subtle text** (e.g. green check/circle dot for `Alive`/`Clean`, red slash/skull dot for `Dead`/`Violation`, amber alert for `Warning`).
  - **Navigation & Hierarchy**: Use **Breadcrumbs** (e.g. `NovWrite / World Studio / Entities / Eldrin the Spellblade`) for contextual location.
  - **Inspection & Actions**: Use **Interactive Buttons** and **Slide-Over Drawers / Sheets** for metadata inspection rather than clustering inline badges.
  - **Typography & Tags**: Use clean, low-contrast monospace typography (`font-mono text-xs text-zinc-400`) and simple text labels without bordered chip backgrounds.

### 3.3. Communication Layer Separation from Frontend UI

- **Communication Layer Is Internal**: The `@novwrite/bridge` RPC/SSE transport and internal diagnostic message hubs are backend communication machinery and **MUST NOT be exposed as primary UI navigation items** in the main user-facing frontend.
- **User-Facing Focus**: The frontend must focus exclusively on the core creative authoring workflows (**Prose Studio** and **World Studio**). Internal communication debugging belongs strictly in dev CLI tooling or isolated hidden debug routes.

### 3.4. Dropdown Standard: Mandatory `Select` from `shadcn-svelte`

- **Rule**: For all dropdown menus, category selectors, enum choosers, and option pickers, **ALWAYS use the official `Select` component from `shadcn-svelte`** (`$lib/components/ui/select`) or `React Native Reusables` on mobile.
- **Prohibitions**:
  - NEVER use native unstyled `<select>` elements.
  - NEVER build custom DIY dropdowns with raw `<div>` click listeners.
  - Use `Select` (with `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Content`, `Select.Item`) to guarantee keyboard navigation, ARIA accessibility, focus ring styling, and theme consistency.

---

## 4. AI UI/UX Anti-Patterns & Developer Best Practices

When building frontend components, AI coding agents frequently fall into repetitive UI pitfalls. All agents must proactively audit against this checklist:

| AI Anti-Pattern / Mistake                       | Why It Fails                                                                                    | Mandatory Best Practice                                                                                                                                        |
| :---------------------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. "Card Sprawl" (Wall of Boxes)**            | Wrapping every single input or label in a separate bordered `<Card>` destroys visual hierarchy. | Group related data into dense master-detail tables, clean definition lists (`<dl>`), or structured two-column forms.                                           |
| **2. Modal Inside Modal**                       | Opening a modal from a modal traps the user and breaks mobile responsiveness.                   | Use slide-over side sheets (`Sheet`), inline master-detail drawers, or full page routes (`/world/*`).                                                          |
| **3. Missing Empty & Loading States**           | Showing empty blank screens or crashing on empty arrays leaves users confused.                  | Always provide designed empty states (e.g., Lucide icon + clear headline + primary action button `[+ Create First Entity]`) and skeleton loaders (`Skeleton`). |
| **4. Low Contrast & Illegible Text**            | Using `text-zinc-500` or `text-gray-400` on dark backgrounds fails WCAG AA contrast.            | Ensure text meets 4.5:1 contrast. Use `text-foreground` for primary and `text-muted-foreground` with verified contrast for secondary copy.                     |
| **5. Missing Keyboard Accessibility**           | Click-only interfaces slow down professional writers and worldbuilders.                         | Support `Esc` to close drawers, `Tab` order on forms, and global keyboard shortcuts (`Cmd/Ctrl + S` save, `Cmd/Ctrl + K` command palette).                     |
| **6. Arbitrary Spacing & Inconsistent Padding** | Mixing random margins (`m-3`, `p-5`, `gap-7`) causes a disjointed feel.                         | Adhere strictly to the 4px Tailwind grid: `p-2` (8px), `p-4` (16px), `p-6` (24px), `gap-2`, `gap-4`.                                                           |
| **7. Fake/Placeholder Data in Prod Components** | Hardcoding `John Doe` or `lorem ipsum` in production code causes regressions.                   | Consume real schema stores or mock fixtures from `@novwrite/bridge` and the One-Click Seeder.                                                                  |

---

## 5. Unified Responsive Design & Platform Parity

- **Component & Layout Parity Across All 3 Frontends**:
  - All three client platforms (**Web**, **Desktop**, and **Mobile**) share identical UI components, navigation hierarchy, and design elements (barring platform/OS-specific handling such as native file pickers, window chrome, and system trays).
- **Mandatory Hand-in-Hand Responsiveness**:
  - Every frontend view, component, or dialog must be engineered responsively from the start—never as an afterthought or separate phase.
- **Explicit Focus on Awkward Non-Standard Android Widths**:
  - UI layouts must be rigorously verified against narrow and unconventional screen sizes:
    - **Ultra-narrow / Foldable Outer Screens**: 280px – 340px width (e.g. Samsung Galaxy Fold cover screen).
    - **Standard Compact Android Phones**: 360px – 390px width.
    - **Tall Aspect Ratios & Virtual Keyboards**: 20:9, 21:9 displays and dynamic viewport resizing when the on-screen keyboard appears.
  - **Zero Horizontal Overflow Guarantee**: All text, badges, action buttons, and inspector drawers must flex or wrap gracefully without causing unintended horizontal page scrollbars.
  - **Touch Accessibility**: Buttons, tabs, and list items must maintain adequate touch targets (minimum 44x44px or comfortable padded containers) on narrow screens.
- **Adaptive Responsive Continuum**:
  - A minimized or narrow **Web or Desktop window must look and behave identically to the Mobile interface** (collapsible hamburger/bottom navigation, single-column writing focus, slide-over sheets for timeline and entity inspectors).
  - Conversely, the **Mobile interface when rendered on larger screens (tablets, foldables, external monitors) must seamlessly expand into the full multi-pane Web/Desktop studio layout**.
