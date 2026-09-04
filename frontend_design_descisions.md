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

## 3. Unified Responsive Design & Platform Parity

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
