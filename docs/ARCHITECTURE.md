# NovWrite Subsystem Architecture & Implementation Guide

This document provides a comprehensive technical overview of the subsystems, domain modules, database schemas, API surfaces, continuity verification mechanics, and AI grounding pipelines for **NovWrite**.

---

## 1. System Architecture Overview

NovWrite is designed as a **hybrid multi-service architecture** composed of:

1. **Frontend Layer:** SvelteKit 2 + Svelte 5 (Runes) + Tailwind CSS v4 (Web) with Tauri 2 desktop client and React Native (Expo + NativeWind v4) mobile support.
2. **Go API Backend:** Modular monolith housing HTTP routing, authentication, project isolation, prose management, continuity rules execution, and AI orchestration.
3. **TypeScript Data Service:** Prisma-backed domain data service communicating with the Go backend via high-performance internal gRPC.
4. **Storage & Infrastructure:** PostgreSQL 18 with `pgvector`, Redis for queues/caching/leases, S3-compatible Object Storage, and Traefik reverse proxy.

```text
┌────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                       │
│    Web (SvelteKit SSR/SPA) · Desktop (Tauri 2)         │
│    Mobile (React Native + Expo SDK 52)                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (OpenAPI 3.1) + SSE
                            ▼
┌────────────────────────────────────────────────────────┐
│                   API BACKEND (Go)                     │
│    Chi Router · Auth · Continuity Engine · AI Gateway  │
│    Universe & Blueprint Engine · Timeline Fold Engine  │
└───────────────────────────┬────────────────────────────┘
                            │ Coarse-Grained gRPC (data/v1)
                            ▼
┌────────────────────────────────────────────────────────┐
│             DATA SERVICE (TypeScript)                  │
│    Prisma ORM · JSONB Operators · Vector Search        │
│    AST Mathematical Formula Evaluator Engine           │
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
- **RBAC Roles:** `LEAD_AUTHOR`, `CO_AUTHOR`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`.
- **Session Security:** Cryptographically signed JWTs or HTTP-only session cookies with Redis revocation store and Platform Admin MFA assistance.

### 2.2 Novel & Prose Management (`novel`)

- **Hierarchy:** `Project` $\rightarrow$ `Novel` $\rightarrow$ `Volume` $\rightarrow$ `Chapter` $\rightarrow$ `Scene`.
- **Prose Representation:** Structured block-based rich text (TipTap/ProseMirror JSON) + raw markdown export + `@entity` inline mention tags.
- **Collaborative Concurrency:** 60-second heartbeat scene lease locks (`scene_leases`) preventing simultaneous editing overwrites.

### 2.3 Blueprint (Class) vs. Entity (Object) Universe Engine (`universe`)

NovWrite cleanly separates world-building archetypes from concrete instantiated objects:

- **1st-Class Blueprints (`FIRST_CLASS` - Entity Archetypes):**
  - Concrete universe actors and structures instantiated into the timeline (e.g. `Cultivator / Protagonist`, `Sacred Weapon & Relic`, `Sanctuary & Realm`, `Ancient Faction & Sect`).
  - Maintain unique entity IDs, causal mutation sequences, and point-in-time snapshots.
  - Can reference other 1st-Class Blueprints via `BLUEPRINT_REF` targeting entity IDs (relational entity graph: Character $\rightarrow$ Faction, Weapon $\rightarrow$ Realm).
- **2nd-Class Blueprints (`SECOND_CLASS` - Sub-Schemas & Continuous Scales):**
  - Reusable nested schemas and continuous scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`, `Soul Profile`).
  - Embedded inside 1st-Class blueprints or other 2nd-Class blueprints; cannot instantiate standalone entities.
- **Dual-Valued Enums (`{ label, value, power }`):**
  - Bridges qualitative categorization (e.g. `gender`, `physique`, `element`) with quantitative power weights for formulas.
- **Sandboxed Mathematical & Logical Formula Engine (`formulaEngine.ts`):**
  - Safe AST expression parser evaluating arithmetic, nested dot-notation variables (`cultivation.major_realm`), logical conditionals (`IF`), and math functions (`CLAMP`, `MIN`, `MAX`, `SQRT`, `POW`).
  - Re-evaluates formulas reactively in real-time as attributes change.

### 2.4 Timeline & Event State Engine (`timeline`)

- **Events (`Event`):** Occurrences tied to narrative sequence points (Chapter/Scene indices).
- **Event Effects (`EventEffect`):** Atomic state mutations caused by an event:
  - Property updates (e.g. `Li Wei.cultivation.major_realm = 4`)
  - Relational transfers (e.g. `Dawnbreaker Blade: Li Wei -> Zhang Rui`)
  - Status changes (e.g. `Elder Han: active -> deceased`)
- **Canonical State Reconstruction:** Reconstructs the exact state of any entity or the entire universe at any historical chapter/scene index by folding ordered event effects over the nearest base snapshot.

### 2.5 Continuity & Rules Engine (`continuity`)

- **Rule Definitions (`ContinuityRule`):** System and author-defined invariants:
  - _Dead Entity Constraint:_ Deceased entities cannot perform actions without a preceding resurrection event.
  - _Inventory Possession Constraint:_ Entities cannot use or gift items they do not possess at the current timeline point.
  - _Progression Boundary Constraint:_ Characters cannot utilize techniques or spells above their active power stage.
  - _Location Proximity Constraint:_ Entities cannot be present at distant locations simultaneously without transit events.
- **Violation Reporting:** Formulates structured violations containing the contradictory prose span, canonical baseline state, historical causal event, and recommended one-click resolutions.

### 2.6 AI Orchestration & Grounding Gateway (`ai`)

- **Context Builder:** Retrieves the active scene's participants, folded canonical state, relevant timeline events, and `pgvector`-matched lore.
- **Grounding Pipeline:** Embeds strict canonical state constraints into LLM system prompts.
- **Extraction Pipeline:** Analyzes drafted prose to suggest new entities, relationship shifts, and event effects for author approval.

---

## 3. Dedicated Page-Based Routing & UI Standards

Every major domain is partitioned into a dedicated 3-tier route structure:

| Workbench Route | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| `/world/entities` | Entities Catalog & Inspector | List (`/`) with per-blueprint customizable columns, Create (`/create`) with Archetype Carousel & live formulas, Update/Detail (`/[id]`) |
| `/world/schemas` | Blueprints & Schemas Architect | List (`/`), Create (`/create`), Update/Detail (`/[id]`) for 1st-Class Archetypes & 2nd-Class Sub-Schemas (Progression Ladders, Affection Gauges, Formulas) |
| `/world/timeline` | Causal Timeline | Narrative vs Chronological sequence visualization and atomic mutation logs |
| `/world/rules` | Rules & Invariants | Predicate builder and violation severity configurations |
| `/world/audit` | Continuity Health | Universe violation tracker and one-click canon reconciler |

- **Zero-Badge Policy:** Strict prohibition of badges/pill tags across all views. Replaced with semantic status icons, action buttons, accessible breadcrumbs, and slide-over drawers.
- **Archetype Carousel:** Horizontal scroll deck on `/world/entities/create` with always-visible side navigation buttons (disabled, hover, active states), single-card stepping, no cutoffs, and hidden scrollbars.
- **Communication Bridge Separation:** `@novwrite/bridge` messaging diagnostics are restricted to `/dev/communication-hub`.
