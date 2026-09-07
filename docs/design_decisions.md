# NovWrite Architecture & Design Decisions Log

This document records the core design principles, trade-offs, and technical decisions underpinning the NovWrite platform.

---

## Decision 1: Canon Over AI Memory

- **Context:** Large language models suffer from hallucinations, bounded context windows, and inability to maintain persistent multi-chapter state across hundreds of scenes.
- **Decision:** The canonical state of the universe is modeled as explicit structured records in PostgreSQL. AI models are treated as stateless processing engines that receive structured world state as prompt context.
- **Consequences:** Eliminates long-term memory degradation and enables deterministic verification of story continuity.

---

## Decision 2: Hybrid Go Backend + TypeScript Prisma Data Service

- **Context:** Go provides exceptional performance, static typing, low memory footprint, and concurrency for HTTP servers and the continuity rule evaluation engine. Meanwhile, TypeScript with Prisma offers powerful type-safe schema evolution, dynamic JSONB query handling, and seamless JavaScript data model operations.
- **Decision:** Implement the primary HTTP routing, auth, continuity engine, and business workflows in Go, while isolating persistence schema operations and complex JSONB mapping in a TypeScript Data Service communicating over high-speed gRPC.
- **Consequences:** Combines Go's runtime efficiency with Prisma's schema migration agility without sacrificing type safety across service boundaries.

---

## Decision 3: Event-Sourcing State Reconstruction for Timelines

- **Context:** Novels frequently feature flashbacks, time skips, non-linear timelines, and retroactive revisions. Simply storing current entity properties overwrites historical truth.
- **Decision:** Model state mutations as ordered `EventEffect` records attached to story events. The state of an entity at chapter $N$ is reconstructed by folding all event effects up to index $N$.
- **Consequences:** Enables instantaneous timeline branching, historical state queries ("Who possessed the Azure Sword in Chapter 12?"), and audit trails for continuity warnings.

---

## Decision 4: User-Defined Dynamic Entity Schemas via PostgreSQL JSONB

- **Context:** Imposing a rigid relational schema locks authors into specific genres (e.g. standard fantasy RPG classes). NovWrite must support Cultivation, Sci-Fi, Urban Fantasy, Romance, and experimental genres.
- **Decision:** Use relational tables for top-level structures (`Project`, `Novel`, `Chapter`, `Scene`, `EntityType`, `PropertyDefinition`, `Event`) and store entity dynamic values in PostgreSQL `JSONB` columns validated against `PropertyDefinition` schemas.
- **Consequences:** Authors can define arbitrary realms, relationship dimensions, and item stats while maintaining indexable query performance with PostgreSQL GIN indexes.

---

## Decision 5: Explainable & Actionable Continuity Warnings

- **Context:** Automated linting warnings that only state "something is wrong" cause writer frustration and lack credibility.
- **Decision:** Every continuity violation must cite:
  1. The contradictory text/metadata span.
  2. The canonical baseline value.
  3. The specific historical event that established that baseline.
  4. Explicit resolution actions (Accept New Canon, Add Missing Event, Edit Prose).
- **Consequences:** Builds trust with authors by providing transparent evidence and one-click remediation.

---

## Decision 6: Multi-User Collaboration, Creative Author Roles & Platform Administration

- **Context:** Creative projects involve co-authors, world builders, lead lorekeepers, and beta readers working concurrently in shared universes. Fictional storytelling occasionally demands intentional canon deviations (e.g. miraculous resurrection, divine paradoxes) that automated invariant rules would otherwise reject. Additionally, platform-level operations require distinct support capabilities (MFA resets, account recovery, billing refunds, snapshot repairs) without compromising manuscript privacy or system integrity.
- **Decision:**
  1. **In-App Project Roles:** Implement multi-tenant creative roles (`LEAD_AUTHOR`, `CO_AUTHOR`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`) with collaborative heartbeat scene leases (`scene_leases`). Empower `LEAD_AUTHOR`s and `CO_AUTHOR`s to force-approve continuity exceptions and break orphaned scene locks with mandatory textual justifications logged to immutable `admin_override_logs`.
  2. **Platform Administration:** Establish a separate platform-level operational tier (`is_platform_admin = TRUE`) empowering support engineers to assist users with MFA resets, account unlocking, Stripe refund processing, and universe snapshot repairs (logged to append-only `platform_admin_audit_logs`). Strictly prohibit plaintext password exposure, unconsented manuscript browsing without user grants, raw card data access, and log tampering.
- **Consequences:** Enables secure, concurrent multi-user novel writing and lorekeeping while maintaining strict operational separation, complete audit accountability, and narrative flexibility.

---

## Decision 7: Two-Front Git Branching & Dedicated Communication Gateway

- **Context:** Coupling novel drafting logic directly to dynamic worldbuilding engines leads to architectural spaghetti, cross-domain test fragility, and merge conflicts between writers and lore engineers. Cross-domain communication errors are difficult to diagnose when distributed arbitrarily across endpoints.
- **Decision:** Divide development into two strictly isolated fronts on dedicated git branches (`novel` and `world`). Prohibit direct cross-domain imports or raw database joins between prose and lore. Route all inter-space interactions through a dedicated, strictly typed Communication Layer (`@novwrite/bridge`), backed by a centralized Single-Page Diagnostic Console (`/dev/communication-hub`) to capture, debug, mock, and resolve all cross-domain communication errors in one place.
- **Consequences:** Accelerates parallel engineering velocity, enforces complete boundary isolation, simplifies debugging of cross-space communication errors, and provides seamless mocking for frontend teams.

---

## Decision 8: The UPDATE Pipe & Hanging EDIT Trees Dual-Axis Reversible DAG Model

- **Context:** Entities in a novel undergo two distinct types of change: chronological narrative progression along the plot timeline ($T_{\text{story}}$) and vertical authorial drafting revisions/edits ($T_{\text{revision}}$) like fixing typos or retroactive lore tweaks. Treating both as a flat linear history causes destructive overwrites or timeline paradoxes.
- **Decision:** Model the narrative timeline as a horizontal conduit (The UPDATE Pipe: `event0 ---> event1 ---> event2 ...`) and authorial revisions as hanging vertical DAG trees (`EditTree<T>`: `ED0 -> ED1 -> ED2 ...`). Reverting to an earlier revision non-destructively moves the active EDIT head pointer without deleting newer drafts, allowing infinite child branching. Deterministically resolve universe state at any 2D coordinate $(T_{\text{narrative}}, T_{\text{revision}})$.
- **Consequences:** Writers can freely experiment with alternative entity descriptions, undo typo fixes, or branch drafting lines without ever risking permanent loss of previous draft states.

---

## Decision 9: Zero-Trust Backend Validation Parity & Clean Slate Architecture

- **Context:** Relying solely on client-side form sanitization results in broken state when bad payloads bypass the frontend, uppercase keys cause formula lookup misses, or field type changes leave stale bounds or options in JSONB storage.
- **Decision:** Implement strict zero-trust parity across both Go (`apps/api`) and TypeScript (`apps/data-service`). Automatically coerce field machine keys to lowercase (`strings.ToLower`, `.toLowerCase()`), reject duplicate keys (`DUPLICATE_FIELD_KEY`), wipe incompatible configuration upon field type modification, and execute deterministic AST formula evaluation server-side.
- **Consequences:** Guarantees absolute database schema consistency, eliminates formula evaluation drift, and ensures robust API resilience against malformed requests.

---

## Decision 10: 3-Tier Visual Hierarchy & Strict Schema Invariance in Entity Editor

- **Context:** Crowding navigation breadcrumbs, entity metadata, editor view toggles, revision histories, and save buttons into a single horizontal bar creates visual dissonance. Allowing arbitrary unmanaged instance properties creates schema drift and bypasses validation.
- **Decision:**
  1. Structure the Entity Editor header into a 3-tier vertical hierarchy: Tier 1 (Breadcrumb Location), Tier 2 (Identity Banner & Archetype Metadata), and Tier 3 (Utility Toolbar with Form/JSON switch, Feather History drawer trigger, and Save call-to-action).
  2. Enforce strict Schema Invariance by completely eradicating arbitrary ad-hoc instance properties in favor of formal Blueprint schema fields.
- **Consequences:** Delivers a clear, distraction-free workbench interface while preventing data corruption from unvalidated loose properties.
