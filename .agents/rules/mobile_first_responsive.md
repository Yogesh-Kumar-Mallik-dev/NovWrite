---
name: mobile-first-responsive-design
description: >-
  Official rules and guidelines for Mobile-First Adaptation and Core Responsive
  Layout Architecture across all NovWrite frontends.
trigger: always_on
---

# Official Rule: Mobile-First Adaptation & Responsive Layout Architecture

## 1. Core Responsive Philosophy: Fluid Layouts & Viewport Resilience

Do NOT approach responsiveness as "add more Tailwind breakpoints for more devices."

The target is NOT: "Support every device model."
The target IS: **"Every component should remain usable and visually correct for any reasonable viewport/container size."**

Do this using:

1. **Fluid layouts** (`w-full`, `max-w-[min(..., 100%)]`, dynamic clamps).
2. **Container-aware components** and auto-fit grids (`grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]`).
3. **A small number of structural breakpoints** (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) that represent genuine interaction shifts.
4. **Content-driven sizing** rather than hardcoded pixel dimensions.
5. **Proper wrapping and defensive overflow behavior** (`min-w-0`, `flex-wrap gap-2`, `truncate`).
6. **Zero unexpected page-level horizontal overflow** (`scrollWidth > innerWidth` must never occur on the root viewport).
7. **Isolated Horizontal Scrolling**: If tabular data or complex DAG visualizations genuinely require horizontal space, isolate scrolling strictly inside bounded component boxes (`overflow-x-auto w-full min-w-0`).
8. **Viewport-Safe Modals & Dialogs**: Modals must never exceed `max-h-[min(90dvh,800px)] overflow-y-auto` with internal scrolling to ensure action buttons and headers are always visible on short screens (e.g. 1280×600 laptop or 844×390 mobile landscape).
9. **Safe Area Cover**: Always include `viewport-fit=cover` in meta viewport for notch and foldable display support.

---

## 2. Mobile-First Adaptation: Do NOT Force Desktop UI onto Mobile

Do NOT interpret "responsive" as:

> _"Take the desktop layout and squeeze everything until it fits on mobile."_

That is strictly forbidden.

When a desktop interaction pattern becomes unsuitable for a small screen, use the **appropriate mobile-specific interaction pattern instead**. The application MUST have genuinely different UI structures when necessary.

### Structural Interaction Mappings

| Desktop UI Interaction                | Mobile UI Interaction Pattern (< 768px / md)                                                                                                               |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistent Top / Side Navigation**  | **Hamburger `[☰]` + Slide-Over Drawer / Sheet** containing project telemetry, workspaces, and sub-links.                                                  |
| **Multi-Item Sub-Header Tabs**        | **Breadcrumb + Mobile Section Dropdown (`Select`)** for 1-tap switching without horizontal scrolling.                                                      |
| **Wide Tabular Grid (`<Table>`)**     | **Dedicated Mobile Entity Card List** (with prominent title, metadata chips, formula badges, and full-width touch actions) + optional Table view switcher. |
| **Horizontal Toolbar**                | **Prominent Search Bar** full-width + Compact Action / View switcher row + primary `+ Create` button.                                                      |
| **Multi-Column Form Grid**            | **Single-Column Stacked Form** with generous vertical spacing and min 44px touch targets.                                                                  |
| **Split-Panel / Dual-Axis Inspector** | **Mobile Tabbed Inspector** (e.g. `[Revisions]` vs `[Coordinates & State]`) allowing full-height focused view on both axes.                                |
| **Horizontal Action Button Trays**    | **Stacked Primary Action** (full-width `[Save Changes]`) above secondary actions (`[Delete]`, `[Cancel]`).                                                 |

---

## 3. Strict Prohibitions

Do NOT:

- ❌ Shrink everything until it fits
- ❌ Reduce text font sizes until they become illegible
- ❌ Make buttons tiny or smaller than 36px–44px touch targets
- ❌ Squeeze navigation items into a single tiny, overflowing row
- ❌ Force desktop multi-column sidebars onto phones
- ❌ Force desktop wide tables onto narrow mobile screens without a dedicated card alternative
- ❌ Cram toolbars into an unreadable single line
- ❌ Hide critical functionality or primary actions simply to preserve the desktop layout

---

## 4. Architectural Preference Order

When a component does not fit on a smaller screen, follow this strict preference order:

1. **Fluidly resize it** if it remains usable
2. **Reflow / wrap it** if that remains usable
3. **Change the layout structure** (e.g., 2-column to 1-column stack)
4. **Replace desktop interaction with a mobile-specific interaction** (e.g., table $\to$ touch cards; split panels $\to$ mobile tabs)
5. **Move secondary actions into an overflow menu** (`[⋮]` or sheet)
6. **Collapse navigation into a drawer / sheet**
7. **Stack content vertically**
8. **Use isolated horizontal scrolling ONLY when the content genuinely requires it** (e.g., code diffs, wide matrices)

---

## 5. Standardized 10-Item Pagination & Layout Jump Prevention

1. **Standard 10-Item Page Size**: All GET endpoints, entities registries, timeline streams, and schemas lists MUST be paginated into standard 10-item pages.
2. **Top Pagination Header Bar**: Pagination controls (Showing range, `[Previous]`, `Page X / Y`, `[Next]`) MUST be positioned **ABOVE** the table/card list container.
   - Placing pagination above the data ensures users can navigate pages without having the pagination bar jump up and down dynamically based on varying record heights or counts.
3. **Zero Layout Shifts**: Heights and pagination boundaries must be deterministic.
