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
- **Decision:** Divide development into two strictly isolated fronts on dedicated git branches (`novel` and `world`). Prohibit direct cross-domain imports or raw database joins between prose and lore. Route all inter-space interactions through a dedicated, strictly typed Communication Layer (`@novwrite/bridge`), backed by automated contract tests and mock adapters to isolate, test, and resolve all cross-domain communication in one package.
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

---

## Decision 11: Creative Novel Multi-Project Isolation & Architecture

- **Context:** Authors write multiple novels spanning different universes, genres, and world rules. Allowing global cross-pollination or un-scoped entities corrupts canon and introduces cross-tenant query leaks.
- **Decision:** Enforce project-level scoping across every entity, blueprint, timeline event, and scene query (`project_id`). Manage active project context reactively via `projectStore.svelte.ts` on the frontend, with a dynamic Project Switcher in top navigation, modal creation, and zero-state "No Active Project Selected" guidance cards.
- **Consequences:** Guarantees absolute project isolation, seamless switching between author workspaces without full page reloads, and deterministic data boundaries.

---

## Decision 12: Simplified Freeform Genre & Clean Slate Universe Initialization

- **Context:** Hardcoding predefined genre enums (e.g. `XIANXIA`, `FANTASY`, `SCIFI`) restricts authors writing hybrid or niche stories (e.g. "Steampunk Cultivation", "Cyberpunk Space Opera"). Forcing starter archetypes / dummy blueprints upon universe creation clutters newly created worlds with boilerplate fields that authors immediately have to delete.
- **Decision:** Treat `genre` as a freeform string field across the entire stack (PostgreSQL `VARCHAR(100)`, Prisma schema, Go backend models, TypeScript types, and UI input). Initialize new universes on a pure **Clean Slate**—zero pre-seeded blueprints, formulas, or entities—giving authors complete creative freedom.
- **Consequences:** Empowers authors with unrestricted genre expression, reduces onboarding friction, and guarantees clean, clutter-free universe workspaces.

---

## Decision 13: 3-Step Irreversible Project Deletion & Zero Redundant Close Buttons

- **Context:** Project deletion is catastrophic and permanent, obliterating all novels, chapters, blueprints, and timeline events. Single-click or casual confirmations lead to accidental data loss. Furthermore, dialogs, drawers, and toasts cluttered with redundant `X` (cross) close buttons create visual noise when backdrop click, `Escape` key, and bottom action buttons already provide clear dismissal paths.
- **Decision:**
  1. **3-Step Deletion Flow (`DeleteProjectDialog.svelte`):** Require users to navigate three sequential steps before executing project deletion: Step 1 (Scope & impact assessment with exact entity/blueprint counts), Step 2 (Explicit acknowledgment checkbox of permanent irreversibility), and Step 3 (Exact project title verification typing).
  2. **Zero Redundant Close Buttons Standard:** Eliminate redundant top-right cross `(X)` buttons across all modals, drawers, and toasts. Dismissal is handled uniformly via backdrop click, `Escape` key press, and explicit `[Cancel]` / `[Close]` bottom action buttons.
- **Consequences:** Prevents catastrophic accidental universe deletion through intentional friction while delivering clean, distraction-free modal dialogs across the entire application.

---

## Decision 14: Formula Engine Cycle Detection via $O(V+E)$ DAG Topological Traversal

- **Context:** Dynamic formula fields allowing cross-property references can contain circular dependencies (e.g. `power = modifier * 2` and `modifier = power / 3`). Without cycle detection, formula evaluation enters infinite recursion, causing stack overflows or CPU thread starvation across Go and TypeScript runtimes.
- **Decision:** Implement synchronous $O(V+E)$ depth-first search (DFS) topological cycle detection with 3-state coloring (`0 = unvisited`, `1 = visiting`, `2 = visited`) in Go (`apps/api`), TypeScript Data Service (`apps/data-service`), and Web Frontend (`apps/web`). Reject circular blueprints with explicit cycle chain paths (e.g. `power -> modifier -> power`) before saving.
- **Consequences:** Completely eliminates infinite recursion risks and ensures deterministic formula evaluation order across all tiers.

---

## Decision 15: Non-Destructive Schema Evolution & Legacy Property Upcasting

- **Context:** When blueprints evolve (e.g. renaming or removing fields), existing entities contain historical attributes. Deleting unknown properties immediately causes unrecoverable data loss in historical timeline branches.
- **Decision:** Implement non-destructive schema evolution. Deprecated or removed properties are preserved under underscore prefixes (`_legacy_property` or `_key`) and dynamically upcasted via runtime helpers (`UpcastLegacyProperties` / `upcastLegacyProperties`) rather than stripped.
- **Consequences:** Preserves historical fidelity across bitemporal branches without failing strict zero-trust schema validation.

---

## Decision 16: Bitemporal Micro-Revision Compaction for Authorial Draft Trees

- **Context:** Frequent micro-edits (such as consecutive `TYPO_FIX` operations) cause vertical revision trees to bloat with dozens of near-identical nodes, increasing storage overhead and slowing traversal.
- **Decision:** Implement deterministic micro-revision compaction (`CompactMicroRevisions` in Go, `compactMicroRevisions` in TypeScript `EditTreeEngine`). Collapse contiguous linear chains of `TYPO_FIX` revisions into atomic baseline edit nodes while preserving non-linear authorial branches.
- **Consequences:** Prevents state explosion and keeps bitemporal revision trees lightweight and fast to resolve.

---

## Decision 17: RFC 6902-Style Differential State Patching Across IPC Boundaries

- **Context:** Transmitting complete snapshot payloads across the Communication Bridge (`@novwrite/bridge`) and WebSocket streams for minor property updates wastes bandwidth and introduces JSON parsing bottlenecks.
- **Decision:** Introduce RFC 6902-compliant differential state patching (`diffEntityProperties`, `applyEntityPatch`, `JSONPatchOpSchema`). Transmit lightweight delta arrays (`[{ op: "replace", path: "/mana", value: 450 }]`) across domain boundaries.
- **Consequences:** Reduces IPC and network payload size by up to 90% while maintaining deterministic state synchronization.

---

## Decision 18: Viewport-Safe Mobile Dialogs with Sticky Bottom Action Trays

- **Context:** Mobile keyboards and small screens (e.g. 1280x600 laptop screens or mobile devices in landscape) cut off modal action buttons and cause root page-level scrollbars when dialogs exceed viewport bounds.
- **Decision:** Enforce `flex flex-col max-h-[min(90dvh,750px)] overflow-hidden` modal containers across all dialogs (`CreateProjectDialog`, `EditProjectDialog`, `DeleteProjectDialog`). Isolate form fields within an internal scrollable body (`overflow-y-auto flex-1`), and dock action buttons in a sticky footer tray (`sticky bottom-0 bg-card/95 backdrop-blur-md shrink-0`) safely above virtual keyboards.
- **Consequences:** Guarantees primary actions (`Save`, `Cancel`, `Create`, `Delete`) remain perpetually visible and accessible regardless of screen dimensions or keyboard presence.

---

## Decision 19: Universal Cross-Platform Scripting Architecture (POSIX Bash + PowerShell)

- **Context:** Developers and CI environments work across heterogeneous operating systems: Linux distributions, macOS (Darwin), and Windows (PowerShell, Command Prompt, Git Bash, MSYS2, WSL). Hardcoded GNU utilities (such as `xargs -r`), Linux-specific port killers, or un-extended binary paths (`bin/api-server` vs `bin/api-server.exe`) fail on macOS and Windows.
- **Decision:**
  1. Make all 5 top-level `.sh` scripts (`dev.sh`, `build.sh`, `check.sh`, `test.sh`, `flush_db.sh`) universally portable by adding runtime OS detection, `.exe` extension awareness, BSD-safe port freeing without `xargs -r`, Docker Compose v1/v2 compatibility, and portable signal trapping.
  2. Provide native companion PowerShell scripts (`dev.ps1`, `build.ps1`, `check.ps1`, `test.ps1`, `flush_db.ps1`) providing 1-click parity for Windows developers executing directly in PowerShell / Windows Terminal.
- **Consequences:** Delivers seamless, zero-friction developer onboarding and flawless script execution on every major operating system.

---

## Decision 20: Defensive API Security, Dynamic CORS, In-Memory Token Bucket Rate Limiting, and JWT Auth Context

- **Context:** Public or multi-tenant API surfaces without payload bounding or rate limits are vulnerable to payload memory exhaustion DoS, brute-force attacks, unauthorized resource mutation, and cross-origin hijacking. Hardcoded CORS policies prevent flexible local desktop (Tauri) and staging deployments.
- **Decision:**
  1. **Request Body Size Limiter (`MaxBytesMiddleware`):** Enforce a strict 10MB payload limit (`http.MaxBytesReader`) on all inbound requests.
  2. **In-Memory Token Bucket Rate Limiting (`RateLimiterMiddleware`):** Protect endpoints with thread-safe client IP rate limiting (300 requests/min default), client IP extraction (`X-Forwarded-For`, `X-Real-IP`, `RemoteAddr`), dynamic `X-RateLimit-*` headers, and RFC 7807 429 Too Many Requests responses.
  3. **Content Security Policy & Defensive Headers:** Inject `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and strict Content Security Policy.
  4. **Dynamic Environment-Configured CORS:** Allow comma-separated origins configured via `CORS_ALLOWED_ORIGINS` with safe localhost and `tauri://localhost` defaults.
  5. **JWT Authentication & User Context (`JWTAuthMiddleware`):** Implement standard HMAC-SHA256 JWT parsing, verification, and context population (`GetUserFromContext`), with support for both strict token-gated routes and non-blocking user identity extraction.
- **Consequences:** Hardens the API against payload DoS, prevents resource abuse, protects author privacy, and delivers secure multi-platform desktop/web connectivity.

---

## Decision 21: Three-Tier Multi-User Hierarchy (USER, ADMIN, SUPER_ADMIN)

- **Context:** Fictional worldbuilding and prose drafting require multi-user collaboration across standard authors, platform support engineers, and system operators. Conflating workspace project roles (`LEAD_AUTHOR`, `CO_AUTHOR`) with system-level platform administration leads to privilege escalation, unverified tenant access, and administrative ambiguity.
- **Decision:** Establish an explicit 3-tier system role model:
  1. **`USER` (Standard Author / Storyteller):** Can create novel projects, author lore blueprints and entities, write prose, and invite collaborators to projects with granular workspace roles (`LEAD_AUTHOR`, `CO_AUTHOR`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`).
  2. **`ADMIN` (Platform Administrator):** Empowered to perform verified support operations, view user accounts, assist with MFA resets, unlock accounts, and initiate snapshot repairs without browsing private manuscripts.
  3. **`SUPER_ADMIN` (Root / Super Administrator):** Unrestricted system authority; manages user role promotions/demotions, platform configuration, and administrative audits.
  - Implement native database enum support (`UserRole`), typed RPC contracts in `@novwrite/bridge`, JWT role claims context (`UserClaims`), and Go HTTP middlewares (`RequireAdmin`, `RequireSuperAdmin`, `RequireRole`).
- **Consequences:** Enforces strict role isolation, eliminates unauthorized privilege escalation, and provides full auditability across creative and operational boundaries.

---

## Decision 22: Singleton Super Admin Constraint, Username & Password Protected Dashboard, and Server CLI

- **Context:** Unconstrained proliferation of root administrative accounts poses severe platform security risks. Exposing a root dashboard without strong authentication barriers or restricting root operations to web-only interfaces leaves the platform vulnerable to session hijacking and credential stuffing.
- **Decision:**
  1. **Singleton Super Admin Constraint:** Enforce that exactly one `SUPER_ADMIN` account exists in the platform at all times (`novwrite_ops` / `sysadmin@novwrite.dev`). Reject API requests attempting to register or promote secondary `SUPER_ADMIN` accounts, and protect the singleton from deletion.
  2. **Username & Password Protected Dashboard Gate (`/superadmin` & `POST /api/v1/superadmin/login`):** Guard the `/superadmin` web route behind a mandatory credentials screen. The server verifies identity against the singleton record and asserts that the caller holds `RoleSuperAdmin` before minting 24-hour HMAC-SHA256 JWT tokens. Unauthorized role logins are denied with `403 Forbidden`.
  3. **Backend Host Server CLI (`apps/api/cmd/admin-cli`):** Provide an out-of-band administrative interface on the backend server shell supporting direct telemetry inspection (`status`), root JWT token generation (`token`), user listings (`list-users`), and role promotions/demotions (`promote`, `demote`).
- **Consequences:** Guarantees absolute single-root accountability, provides dual-layer dashboard security (credentials + JWT guard), and enables secure terminal-based operations directly on the server host.



