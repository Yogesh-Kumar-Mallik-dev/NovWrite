# NovWrite Subsystem Architecture & Implementation Guide

This document provides a comprehensive technical overview of the subsystems, domain modules, database schemas, API surfaces, continuity verification mechanics, and AI grounding pipelines for **NovWrite**.

---

## 1. System Architecture Overview

NovWrite is designed as a **hybrid multi-service architecture** composed of:

1. **Frontend Layer:** SvelteKit 2 + Svelte 5 (Runes) + Tailwind CSS v4 (Web) with Tauri 2 desktop client and React Native mobile support.
2. **Go API Backend:** Modular monolith housing HTTP routing, authentication, project isolation, prose management, continuity rules execution, and AI orchestration.
3. **TypeScript Data Service:** Prisma-backed domain data service communicating with the Go backend via high-performance internal gRPC.
4. **Storage & Infrastructure:** PostgreSQL 18 with `pgvector`, Redis for queues/caching, S3-compatible Object Storage, and Traefik reverse proxy.

```text
┌────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                       │
│    Web (SvelteKit SSR/SPA) · Desktop (Tauri 2)         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (OpenAPI 3.1) + SSE
                            ▼
┌────────────────────────────────────────────────────────┐
│                   API BACKEND (Go)                     │
│    Chi Router · Auth · Continuity Engine · AI Gateway  │
└───────────────────────────┬────────────────────────────┘
                            │ Coarse-Grained gRPC (data/v1)
                            ▼
┌────────────────────────────────────────────────────────┐
│             DATA SERVICE (TypeScript)                  │
│    Prisma ORM · JSONB Operators · Vector Search        │
└───────────────────────────┬────────────────────────────┘
                            │ PostgreSQL wire protocol / SQL
                            ▼
┌────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                        │
│   PostgreSQL 18 · pgvector · Redis · Object Storage    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Domain Subsystems

### 2.1 Identity & Access Management (`identity`)

- **Multi-Tenant / Project-Level Isolation:** Every novel and world element is scoped to a `ProjectID`.
- **RBAC Roles:** `OWNER`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`.
- **Session Security:** Cryptographically signed JWTs or HTTP-only session cookies with Redis revocation store.

### 2.2 Novel & Prose Management (`novel`)

- **Hierarchy:** `Project` $\rightarrow$ `Novel` $\rightarrow$ `Volume` $\rightarrow$ `Chapter` $\rightarrow$ `Scene`.
- **Prose Representation:** Structured block-based rich text (TipTap/ProseMirror JSON) + raw markdown export.
- **Scene Metadata:** Linked timeline position, participating characters, current location, and scene mood/pov.

### 2.3 User-Defined Universe & Blueprint Engine (`universe`)

NovWrite gives authors total creative freedom to build universes from scratch with a structured blueprint classification:

- **1st-Class Blueprints (Entity Archetypes):**
  - Concrete universe actors and structures instantiated into the timeline (e.g. `Character / Cultivator`, `Sacred Weapon & Relic`, `Sanctuary & Realm`, `Sect & Faction`).
  - Maintain unique entity IDs, causal mutation sequences, and point-in-time snapshots.
- **2nd-Class Blueprints (Sub-Blueprints & Value Objects):**
  - Reusable nested schemas and continuous scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`, `Soul Profile`).
  - Embedded and referenced as dynamic fields in 1st-Class blueprints or other 2nd-Class blueprints.
- **Dynamic Field Types & Custom Enum Categories:**
  - `STRING`, `NUMBER` (with bounds, step, unit), `BOOLEAN`, `ENUM` (user-defined options like `["Male", "Female", "Other"]`), `BLUEPRINT_REF` (target blueprint linking), and `FORMULA` (computed math).
- **Sandboxed Mathematical & Logical Formula Engine (`formulaEngine.ts`):**
  - AST-based expression parser evaluating complex formulas:
    $$\text{Total Combat Power} = (\text{cultivation.major\_realm} \times \text{cultivation.minor\_realm}) \times \text{special\_Physique} + \text{attack} \times \text{attack\_technique\_Mastery} - \text{defence} \times \text{defence\_technique\_mastery}$$
  - Evaluates arithmetic, dot-notation variables, logical conditionals (`IF`), and math functions (`CLAMP`, `MIN`, `MAX`, `SQRT`, `POW`).

### 2.4 Timeline & Event State Engine (`timeline`)

- **Events (`Event`):** Occurrences tied to specific story points (Chapter/Scene indices).
- **Event Effects (`EventEffect`):** Atomic state mutations caused by an event:
  - Property updates (`Li Wei.realm = Core Formation`)
  - Item transfers (`Azure Sword: Li Wei -> Zhang Rui`)
  - Status changes (`Elder Han: alive -> deceased`)
  - Relationship updates (`Trust: Li Wei -> Zhang Rui, 42 -> 67`)
- **Canonical State Reconstruction:** Reconstructs the exact state of any entity or the entire universe at any historical chapter/scene index by applying ordered event effects.

### 2.5 Continuity & Rules Engine (`continuity`)

- **Rule Definitions (`Rule`):** System and author-defined invariants:
  - _Dead Entity Constraint:_ Deceased entities cannot perform actions without a preceding resurrection event.
  - _Inventory Possession Constraint:_ Entities cannot use or gift items they do not possess at the current timeline point.
  - _Progression Boundary Constraint:_ Characters cannot utilize techniques or spells above their active power stage.
  - _Location Proximity Constraint:_ Entities cannot be present at distant locations simultaneously without transit events.
- **Violation Reporting:** Formulates structured violations containing the contradictory text span, current canonical state, historical causal event, and recommended one-click resolutions.

### 2.6 AI Orchestration & Grounding Gateway (`ai`)

- **Context Builder:** Retrieves the active scene's participants, current canonical state, relevant timeline events, and vector-matched lore.
- **Grounding Pipeline:** Embeds strict canonical state constraints into LLM system prompts.
- **Extraction Pipeline:** Analyzes drafted prose to suggest new entities, relationship shifts, and event effects for author approval.

---

## 3. Dedicated Page-Based Routing & UI Standards

To eliminate modal clutter and enhance focus, every major domain is partitioned into a 3-tier dedicated route structure:

| Workbench Route | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| `/world/entities` | Entities Catalog & Inspector | List (`/`) with per-blueprint customizable columns, Create (`/create`), Update/Detail (`/[id]`) with live computed formulas |
| `/world/schemas` | Blueprints & Schemas Architect | List (`/`), Create (`/create`), Update/Detail (`/[id]`) for 1st-Class Archetypes & 2nd-Class Sub-Schemas (Progression Ladders, Affection Gauges, Formulas) |
| `/world/timeline` | Causal Timeline | Narrative vs Chronological sequence visualization and atomic mutation logs |
| `/world/rules` | Rules & Invariants | Predicate builder and violation severity configurations |
| `/world/audit` | Continuity Health | Universe violation tracker and one-click canon reconciler |

- **Zero-Badge Policy:** Strict prohibition of badges/pill tags across all views. Replaced with semantic status icons, action buttons, accessible breadcrumbs, and slide-over drawers.
- **Communication Bridge Separation:** `@novwrite/bridge` messaging diagnostics are restricted to `/dev/communication-hub`.
