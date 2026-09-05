# NovWrite

> **A continuity-first novel creation platform with a user-defined story universe engine.**  
> _You define the rules of your universe. NovWrite remembers them._

**Repository:** [https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite](https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite)

---

## 1. Overview

**NovWrite** is a novel-creation platform designed to solve one of the hardest problems in long-form AI-assisted fiction: **maintaining reliable continuity as a story grows**.

Instead of treating a novel as a sequence of unstructured text documents, NovWrite models the novel as an evolving fictional world containing characters, events, timelines, items, locations, factions, relationships, powers, techniques, and user-defined entities.

The central design principle: **The author's world state—not an AI model's memory—is the canonical source of truth.**

---

## 2. Core Features

- **User-Defined Universe System**: No genre lock-in. Define arbitrary entity types, custom properties, power/progression ladders (e.g. Cultivation realms, Magic tiers, Tech levels), and numeric or categorical relationship scales (-100 to +100 loyalty, 0 to 100 devotion).
- **Canonical State Tracking**: At any scene or chapter, NovWrite reconstructs the exact world state (who is alive, who owns what item, current power tiers, faction standings, known secrets).
- **Event & State-Change Engine**: Events are modeled as explicit state mutations with causal history.
- **Evidence-Based Continuity Warnings**: When new prose contradicts established canon (e.g. dead character appearing, item in wrong inventory, realm violation), NovWrite highlights the contradiction, cites the historical events responsible, and provides one-click resolutions.
- **Grounded AI Assistant**: AI operations (drafting, scene analysis, entity extraction) operate on structured story state and retrieval context rather than ungrounded hallucination.

---

## 3. Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   FRONTEND CLIENTS                     │
│    Web (SvelteKit + Tailwind CSS + shadcn-svelte)      │
│    Future: Desktop (Tauri) · Mobile (Expo / RN)        │
└───────────────────────────┬────────────────────────────┘
                            │ REST / HTTP JSON (OpenAPI 3.1)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   GO API BACKEND                       │
│    Chi Router · Auth · Continuity Engine · AI Gateway  │
└───────────────────────────┬────────────────────────────┘
                            │ Internal gRPC
                            ▼
┌────────────────────────────────────────────────────────┐
│             TYPESCRIPT DATA SERVICE                    │
│    Prisma ORM · Domain Query Services · Schemas        │
└───────────────────────────┬────────────────────────────┘
                            │ SQL Queries / pgvector
                            ▼
┌────────────────────────────────────────────────────────┐
│                  DATABASE & STORAGE                    │
│    PostgreSQL 18 (Canonical) · Redis · Object Storage  │
└────────────────────────────────────────────────────────┘
```

- **API Backend**: Go (Modular Monolith with `go-chi/chi`, Dependency Injection).
- **Data Service**: TypeScript + Prisma ORM via coarse-grained gRPC contracts.
- **Database**: PostgreSQL 18 with JSONB for dynamic entity properties and `pgvector` for semantic context retrieval.
- **Caching & Ephemeral State**: Redis.
- **Deployment**: Docker Compose behind Traefik reverse proxy with automated TLS.

---

## 4. Documentation Index

- **Academic & Formal Specifications:**
  - **[NovWrite B.Tech Capstone Project Report (`Novwrite.docx`)](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)** — Comprehensive up-to-date professional project report and system architecture document for submission.
- **Core Architecture Specifications:**
  - [Database Architecture Specification](file:///home/yogesh/Projects/NovWrite/docs/DATABASE_ARCHITECTURE.md)
  - [Backend Architecture Specification](file:///home/yogesh/Projects/NovWrite/docs/BACKEND_ARCHITECTURE.md)
  - [Frontend Architecture Specification](file:///home/yogesh/Projects/NovWrite/docs/FRONTEND_ARCHITECTURE.md)
  - [Cache Architecture Specification](file:///home/yogesh/Projects/NovWrite/docs/CACHE_ARCHITECTURE.md)
- **Guides & Context:**
  - [Agent Instructions & Rules](file:///home/yogesh/Projects/NovWrite/agents.md)
  - [Frontend Design Decisions](file:///home/yogesh/Projects/NovWrite/frontend_design_descisions.md)
  - [Current Context & Progress](file:///home/yogesh/Projects/NovWrite/current_context.md)
  - [Monorepo Architecture Specification](file:///home/yogesh/Projects/NovWrite/NOVWRITE_ARCHITECTURE.md)
  - [API & gRPC Guide](file:///home/yogesh/Projects/NovWrite/docs/API_GUIDE.md)
  - [Developer Onboarding Guide](file:///home/yogesh/Projects/NovWrite/docs/ONBOARDING.md)
  - [Design Decisions Log](file:///home/yogesh/Projects/NovWrite/docs/design_decisions.md)

---

## 5. Development Workflow & Rules

All contributors and AI agents must strictly adhere to the repository rules defined in [agents.md](file:///home/yogesh/Projects/NovWrite/agents.md):

1. **Single-Change Policy**: Execute strictly one change at a time (one feature, one refactor, or one fix). Reject multi-change requests.
2. **Commit Format**: All commit messages must follow `<type>(<domain>): <expression>` (e.g. `feat(continuity): add possession violation check`).
3. **Signed Commits**: Always commit changes using `git commit -S -m "..."`.
4. **Block-Based Code Standard**: Code must be written in modular blocks featuring comment headers, early returns (guard clauses), and unique block IDs in all error handling.
