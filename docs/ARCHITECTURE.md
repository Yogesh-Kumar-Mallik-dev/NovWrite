# NovWrite Subsystem Architecture & Implementation Guide

This document provides a comprehensive technical overview of the subsystems, domain modules, database schemas, API surfaces, continuity verification mechanics, and AI grounding pipelines for **NovWrite**.

---

## 1. System Architecture Overview

NovWrite is designed as a **hybrid multi-service architecture** composed of:

1. **Frontend Layer:** SvelteKit + Tailwind CSS + Vite (Web) with future Tauri desktop client support.
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

### 2.3 User-Defined Universe Engine (`universe`)

- **Entity Types (`EntityType`):** Configurable schemas (e.g. `Character`, `Item`, `Weapon`, `Technique`, `Spell`, `Species`, `Faction`, `Location`, `Artifact`).
- **Dynamic Property Definitions (`PropertyDefinition`):** Typed schema attributes attached to entity types (e.g., `string`, `number`, `boolean`, `enum`, `entity_reference`, `range`, `jsonb`).
- **Entities (`Entity`):** Specific instances in the universe (e.g., Character "Li Wei", Item "Azure Dragon Sword") storing dynamic property values in JSONB.
- **Custom Progression & Power Systems:** Configurable stage hierarchies (e.g., `Body Tempering` $\rightarrow$ `Qi Condensation` $\rightarrow$ `Foundation` $\rightarrow$ `Core Formation` $\rightarrow$ `Nascent Soul`).
- **Custom Relationship Types:** Directional or bidirectional links between entities with author-configured measurement scales (e.g., Loyalty: $-100$ to $+100$, Affection: $0$ to $1000$).

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

## 3. Database Schema (Prisma Data Model Outline)

```prisma
model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  novels      Novel[]
  entityTypes EntityType[]
  entities    Entity[]
  events      Event[]
  rules       Rule[]
}

model Novel {
  id          String    @id @default(uuid())
  projectId   String
  title       String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  chapters    Chapter[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Chapter {
  id          String   @id @default(uuid())
  novelId     String
  orderIndex  Int
  title       String
  novel       Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  scenes      Scene[]
  events      Event[]
}

model Scene {
  id          String   @id @default(uuid())
  chapterId   String
  orderIndex  Int
  title       String
  content     String   // Prose or structured JSON
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
}

model EntityType {
  id          String               @id @default(uuid())
  projectId   String
  name        String               // "Character", "Item", "Technique"
  properties  PropertyDefinition[]
  entities    Entity[]
  project     Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model PropertyDefinition {
  id           String     @id @default(uuid())
  entityTypeId String
  name         String     // "Cultivation Realm", "Karma", "Weight"
  type         String     // "string", "number", "enum", "entity_ref"
  config       Json?      // Enum choices, valid ranges
  entityType   EntityType @relation(fields: [entityTypeId], references: [id], onDelete: Cascade)
}

model Entity {
  id           String      @id @default(uuid())
  projectId    String
  entityTypeId String
  name         String
  properties   Json        // Dynamic property values map
  entityType   EntityType  @relation(fields: [entityTypeId], references: [id])
  project      Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Event {
  id          String        @id @default(uuid())
  projectId   String
  chapterId   String?
  sceneId     String?
  name        String
  orderIndex  Int
  effects     EventEffect[]
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  chapter     Chapter?      @relation(fields: [chapterId], references: [id])
}

model EventEffect {
  id          String   @id @default(uuid())
  eventId     String
  targetType  String   // "entity_property", "possession", "relationship", "status"
  targetId    String   // Entity ID or Relationship ID
  mutation    Json     // Previous value, new value, operation details
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Rule {
  id          String   @id @default(uuid())
  projectId   String
  name        String
  ruleType    String   // "POSSESSION", "POWER_TIER", "STATUS", "CUSTOM"
  definition  Json     // Rule parameters & invariant conditions
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

---

## 4. Deployment & Infrastructure

- **Traefik Reverse Proxy:** Automatically secures HTTP/HTTPS traffic with Let's Encrypt TLS certificates.
- **Docker Compose:** Encapsulates Go API, TypeScript Data Service, PostgreSQL with `pgvector`, and Redis.
- **Monitoring & Health Checks:** Continuous health probing on `/healthz` endpoints for both Go and TypeScript services.
