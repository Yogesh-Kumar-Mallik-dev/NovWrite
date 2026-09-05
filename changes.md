# NovWrite Documentation & Specification Changelog

This document maintains the official, chronological change log for **`Novwrite.docx`** and all authoritative system architecture specifications.

> **Governance Policy:**  
> `Novwrite.docx` serves as the authoritative, up-to-date B.Tech Major Project Technical Report and Architecture Specification. Whenever a major architectural decision, domain engine update, database modification, or frontend redesign occurs, `Novwrite.docx` **must be regenerated** and the exact changes recorded in this changelog.

---

## Version Timeline

```mermaid
timeline
    title NovWrite Specification & Document Evolution
    2026-09-05 : Version 1.0 (Architecture Baseline)
               : Database, Backend, Frontend, Cache Specs Locked
    2026-09-05 : Version 1.1 (Decoupled Workspaces)
               : Prose Studio vs World Studio Separation
               : Anti-Pattern Prohibition (No Tab-in-Modal Soup)
    2026-09-05 : Version 1.2 (Runes State & Co-Development)
               : Svelte 5 Runes State Stores
               : Multi-Platform Simultaneous Engineering
    2026-09-05 : Version 1.3 (React Native & Reusables Parity)
               : React Native + Expo Mobile Stack
               : React Native Reusables (@rn-primitives) Integration
    2026-09-06 : Version 1.4 (B.Tech Formalization & Report Generation)
               : Novwrite.docx Academic Capstone Report Generated
               : Comprehensive 8-Chapter Technical Specification
    2026-09-06 : Version 1.5 (Multi-User RBAC & Admin Override Governance)
               : Multi-User Collaboration & Tenancy
               : Admin Override Powers vs Boundaries Matrix
               : Heartbeat Scene Leases & Active Lock Breakers
    2026-09-06 : Version 1.6 (Platform Administration & Creative Author Roles)
               : Platform Admin Capabilities (MFA Reset, Refunds, Data Repair)
               : Strict Operational Boundaries & Manuscript Privacy Grants
               : Creative In-App Roles (Lead Author, Co-Author, Editor)
    2026-09-06 : Version 1.7 (Two-Front Branching & Dedicated Communication Gateway)
               : Dedicated Git Branches (world & novel) with Upstream Tracking
               : Zero Direct Cross-Talk Invariant & @novwrite/bridge Contracts
               : Single-Page Communication Diagnostics Hub (/dev/communication-hub)
```

---

## Release Details

### [Version 1.7] — 2026-09-06

**Scope:** Two-Front Isolated Branching Model & Centralized Cross-Domain Communication Layer  
**Target Documents:** [`docs/COMMUNICATION_LAYER.md`](file:///home/yogesh/Projects/NovWrite/docs/COMMUNICATION_LAYER.md), [`docs/design_decisions.md`](file:///home/yogesh/Projects/NovWrite/docs/design_decisions.md), [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)

#### Added

- **Two-Front Git Branching Architecture:**
  - Created and published dedicated remote branches: `origin/world` (World Studio, dynamic schemas, timeline fold engine, rules graph) and `origin/novel` (Prose Studio, manuscript tree, TipTap rich text, collaborative scene leases).
  - Configured upstream git tracking (`git branch -u origin/world` and `git branch -u origin/novel`) with isolated development lifecycles.
- **The Zero Direct Cross-Talk Invariant:**
  - Established strict boundary rules prohibiting raw cross-domain imports or direct SQL joins between prose content and dynamic lore models.
  - Specified `@novwrite/bridge` as the single authoritative communication contract (Protobuf RPC and Zod schemas) for all inter-space queries (`SceneGroundingRequest`, `ValidateContinuityRequest`, `EntityMentionQuery`).
- **Centralized Communication Diagnostics Hub (`/dev/communication-hub`):**
  - Designed a single-page diagnostic dashboard to inspect real-time inter-space traffic, detect payload schema discrepancies, simulate mock responses, and replay failing requests.
  - Centralized RFC 7807 problem normalizer ensuring all cross-domain communication errors are debugged and resolved in one place.
- **Academic Report & Specification Synchronization:**
  - Regenerated [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx) to **Version 1.7**, integrating the Two-Front Architecture and Communication Bridge into Chapter 1, Chapter 2, and the Executive Summary.

---

### [Version 1.6] — 2026-09-06

**Scope:** Platform-Level Administration System & Creative In-App Author Terminology  
**Target Documents:** [`docs/DATABASE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/DATABASE_ARCHITECTURE.md), [`docs/BACKEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/BACKEND_ARCHITECTURE.md), [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md), [`docs/CACHE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/CACHE_ARCHITECTURE.md), [`docs/design_decisions.md`](file:///home/yogesh/Projects/NovWrite/docs/design_decisions.md), [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)

#### Added

- **Platform-Level Administration & Support Subsystem (`SYSTEM_ADMIN`)**:
  - **Account & Security Operations:** Support capabilities for Platform Admins (`is_platform_admin = TRUE`) to reset lost MFA/2FA authenticators upon identity verification and unlock brute-force locked accounts with mandatory support ticket referencing.
  - **Billing & Payment Management:** Ability to process partial/full Stripe payment refunds and adjust subscription tier states directly through the admin portal.
  - **Universe State Snapshot Repair Tools:** Administrative tooling to trigger manual re-folds and snapshot cache repairs for corrupted entity states.
  - **Platform Admin Audit Logging:** Dedicated `platform_admin_audit_logs` table tracking admin user ID, target user ID, action category (`MFA_RESET`, `ACCOUNT_UNLOCK`, `STRIPE_REFUND`, `DATA_REPAIR`), ticket ID, metadata JSONB, and IP address.
  - **Dedicated Admin API & Portal:** Secure `/api/v1/platform/*` endpoints protected by `PlatformAdminAuthMiddleware` requiring step-up MFA verification, and an isolated `/platform-admin` frontend workspace.
- **Strict Platform Admin Security Boundaries & Protections**:
  - **Zero Plaintext Password Access:** Passwords remain strictly hashed (Argon2id/bcrypt) with no administrative viewing or decryption capability.
  - **Manuscript Privacy & Consent Grants:** Platform admins are strictly barred from silently browsing private user novels or lore; debugging access requires explicit, time-bounded user support access grants.
  - **PCI-DSS Compliance:** Raw credit card data is never accessible or stored; payment operations use tokenized Stripe customer and charge IDs.
  - **Append-Only Immutability:** Admin audit logs cannot be modified, updated, or deleted by any administrative role.
- **Creative In-App Author Role Standardization**:
  - Renamed generic project "Admin" roles to creative author terminology: `LEAD_AUTHOR` (Project Creator), `CO_AUTHOR` (Senior Lorekeeper/Collaborator with canon override authority), `EDITOR`, `CONTRIBUTOR`, and `VIEWER`.
  - Updated in-app lock breaking and canon exception overrides to `BLOCK_AUTHOR_OVERRIDE_*`.
- **Academic Report & Specification Synchronization**:
  - Regenerated [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx) to reflect the separation between Platform Administration and In-App Author roles across all relevant chapters.

---

### [Version 1.5] — 2026-09-06

**Scope:** Multi-User Collaboration, Tenancy & Admin Override Governance  
**Target Documents:** [`docs/DATABASE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/DATABASE_ARCHITECTURE.md), [`docs/BACKEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/BACKEND_ARCHITECTURE.md), [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md), [`docs/CACHE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/CACHE_ARCHITECTURE.md), [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)

#### Added

- **Multi-User Tenancy & Project Membership Schema:** Introduced `project_members` with 5-tier role hierarchy (`OWNER`, `ADMIN`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`), fine-grained permission overrides, and author attribution across scenes, entities, events, and rules.
- **Collaborative Scene Lock & Heartbeat Lease Engine:** Implemented `scene_leases` table and Redis lease keys with 60-second sliding TTLs and 20-second heartbeat renewals to prevent concurrent overwrite collisions.
- **Admin Override Governance & Decision Matrix:**
  - **Authorized Powers:** Force-approving intentional canon invariant exceptions (`FORCE_APPROVE_VIOLATION`), breaking stale/abandoned scene locks, merging conflicting timeline branches, and soft-quarantining broken entities.
  - **Mandatory Audit Logging:** Created `admin_override_logs` table enforcing textual justification, admin ID, timestamp, and previous/new state capture for every override action (`BLOCK_ADMIN_OVERRIDE_*`).
  - **Immutable Architectural Safety Rails:** Strictly prohibited overwriting historical event audit trails, cross-tenant project access, project transfer/deletion by non-owners, and author impersonation.
- **Frontend Collaborative Presence UI:** Active collaborator avatar stack, locked scene warning banners, role-based action gatekeepers, and `shadcn` Admin Override Dialog modals.
- **Cache & Concurrency Tier Expansions:** Multi-user presence tracking and scene lease mutexes added to Redis 7.2 caching topology.
- **Docx Report Synchronization:** Regenerated [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx) with updated multi-user collaboration chapters, schemas, and governance matrices.

---

### [Version 1.4] — 2026-09-06

**Scope:** Academic Formalization & `Novwrite.docx` Major Project Report Generation  
**Target Artifact:** [`Novwrite.docx`](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)

#### Added

- **Formal Academic Report Structure (`Novwrite.docx`)**:
  - **Cover Page & Departmental Metadata:** B.Tech Major Project Technical Report under the Department of Computer Science & Engineering.
  - **Abstract & Executive Summary:** Formalization of the _Canon Over AI Memory_ architectural thesis.
  - **Chapter 1 (Introduction & Problem Definition):** Comparative analysis against existing LLM tools (SudoWrite, NovelAI, standard RAG).
  - **Chapter 2 (System Architecture & Topology):** Go 1.23+ Core API, TypeScript Prisma Data Service, and PostgreSQL + Redis infrastructure.
  - **Chapter 3 (Database & Persistence Architecture):** Relational prose backbone, dynamic JSONB schema definitions, event sourcing tables, and HNSW vector search.
  - **Chapter 4 (Backend Subsystems & Continuity Engine):** Deterministic 4-step State Fold Engine algorithm, 4 invariant rule classes, and RFC 7807 explainable violation details.
  - **Chapter 5 (Frontend Architecture & Multi-Platform Design):** Decoupled standalone studios, elimination of nested tab-and-modal soup, dedicated creation workbenches, and Tri-Platform co-development (Web, Tauri 2 Desktop, React Native + Expo Mobile).
  - **Chapter 6 (Cache & Ephemeral State):** 5-tier Redis 7.2 caching topology, checkpoint snapshots, mutex fold locks, and cascading invalidation.
  - **Chapter 7 (Quality Assurance, Testing & DevOps):** 100% test coverage target via Dependency Injection, single-change policy, signed Git commits, and Docker Compose topology.
  - **Chapter 8 (Conclusion & Future Work):** CRDT multi-author collaboration, graph neural network continuity auditing, and offline SLM sidecars.
- **Repository-Level Documentation Index:** Integrated `Novwrite.docx` directly into [`README.md`](file:///home/yogesh/Projects/NovWrite/README.md).

---

### [Version 1.3] — 2026-09-05

**Scope:** Native Mobile Framework Specification & `shadcn/ui` Mobile Equivalent  
**Target Documents:** [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md), [`frontend_design_descisions.md`](file:///home/yogesh/Projects/NovWrite/frontend_design_descisions.md)

#### Added

- **React Native & Expo Ecosystem:** Explicitly established **React Native with Expo (SDK 52+, Expo Router)** as the official native mobile client stack.
- **React Native Reusables (`@rn-primitives`)**: Specified [React Native Reusables](https://reactnativereusables.com/) styled with **NativeWind v4** (Tailwind for React Native) as the official `shadcn/ui` counterpart on mobile.
- **Tri-Platform Co-Development Parity Matrix:** Added comprehensive comparative matrix mapping components, styling engines, routing standards, theme synchronization, and keyboard handling across Web, Desktop, and Mobile.
- **Mermaid Syntax & GitHub Rendering Fixes:** Resolved subgraph direct edge parsing issues across all architecture diagrams.
- **Authoritative Repository URLs:** Updated proto package paths and onboarding clone instructions to `https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite`.

---

### [Version 1.2] — 2026-09-05

**Scope:** Svelte 5 Runes State Architecture & Tri-Platform Co-Development Scaffolding  
**Target Documents:** [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md)

#### Added

- **Svelte 5 Runes Store Architecture:** Integrated complete reactive store implementation (`UniverseStore`) using `$state`, `$derived`, and `$effect` for dynamic entity selection, category filtering, search, and per-entity history fetching.
- **Tri-Platform Co-Development Standard:** Mandated simultaneous engineering of Web, Desktop (Tauri 2), and Mobile frontends from shared design tokens and API contracts.

---

### [Version 1.1] — 2026-09-05

**Scope:** Decoupled Standalone Studios Architecture & Anti-Pattern Elimination  
**Target Documents:** [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md), [`frontend_design_descisions.md`](file:///home/yogesh/Projects/NovWrite/frontend_design_descisions.md)

#### Added

- **Decoupled Standalone Studios:** Decoupled **NovWrite Prose Studio (Writing Space)** from **NovWrite World Studio (Creation / Canon Space)** into separate, standalone app workspaces.
- **Strict Anti-Pattern Prohibition (No Tab-in-Modal Soup):** Explicitly prohibited cramming Characters, Power Progression Ladders, Techniques, Custom Field Schemas, and Rule Assertions into pop-up modals or nested tab carousels on a single page.
- **Dedicated World Creation Workspaces:**
  - Characters & Entity Studio (`/world/characters`) with Master-Detail Grid and dedicated **Change History Table** per entity.
  - Power Systems & Progression Studio (`/world/progression`).
  - Universe Schema & Field Architect Studio (`/world/schema`).
  - Continuity Rules & Invariant Builder (`/world/rules`).
  - Causal Timeline & Historical Event Studio (`/world/timeline`).
  - Relationships & Affiliations Matrix (`/world/relationships`).
  - Continuity Health & Canon Reconciler Studio (`/world/audit`).

---

### [Version 1.0] — 2026-09-05

**Scope:** System Architecture Baseline & Core Technical Specifications  
**Target Documents:** [`docs/DATABASE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/DATABASE_ARCHITECTURE.md), [`docs/BACKEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/BACKEND_ARCHITECTURE.md), [`docs/FRONTEND_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md), [`docs/CACHE_ARCHITECTURE.md`](file:///home/yogesh/Projects/NovWrite/docs/CACHE_ARCHITECTURE.md)

#### Added

- **Database Architecture Specification:** PostgreSQL 18 schema with `pgvector`, dynamic JSONB schemas with GIN indexing, immutable event sourcing tables (`Event`, `EventEffect`), and snapshot tables.
- **Backend Architecture Specification:** Multi-tier Go 1.23+ application API layer + TypeScript Prisma Data Service over coarse-grained gRPC, domain engines, RFC 7807 problem details with unique block IDs (`BLOCK_<DOMAIN>_<ACTION>_<ID>`), and 100% test coverage target via Dependency Injection.
- **Frontend Architecture Specification:** SvelteKit 2 + Svelte 5 Runes + `shadcn-svelte` + Tailwind CSS v4, MongoDB Compass / Linear developer workbench styling (Solid Purple `#7c3aed` & Red `#dc2626`), and Android responsive parity (280px–390px).
- **Cache Architecture Specification:** 5-tier Redis 7.2 caching topology, point-in-time folded state snapshot caching, single-flight mutex locks, and cascading invalidation protocols.
