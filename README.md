# NovWrite

> **A continuity-first novel creation platform with a user-defined story universe engine.**  
> _You define the rules of your universe. NovWrite remembers them._

**Repository:** [https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite](https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite)

---

## 1. Quick Start & Prerequisites

### 1.1. Install System Dependencies (Linux, macOS, Windows)

NovWrite requires **Go 1.23+**, **Node.js 22 LTS & pnpm**, **Docker & Compose**, and **Protocol Buffers (`protoc`)**.

- **Linux (Ubuntu / Debian):**
  ```bash
  sudo apt-get update && sudo apt-get install -y curl wget git build-essential make protobuf-compiler
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
  corepack enable && corepack prepare pnpm@latest --activate
  go install google.golang.org/protobuf/cmd/protoc-gen-go@latest google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
  ```
- **macOS (Homebrew):**
  ```bash
  brew install go node@22 pnpm protobuf bufbuild/buf/buf protoc-gen-go protoc-gen-go-grpc git make
  brew install --cask docker
  ```
- **Windows (Winget in PowerShell as Admin):**
  ```powershell
  winget install --id Git.Git -e; winget install --id GoLang.Go -e; winget install --id OpenJS.NodeJS.LTS -e; winget install --id pnpm.pnpm -e; winget install --id Google.Protobuf -e; winget install --id BufBuild.Buf -e; winget install --id Docker.DockerDesktop -e
  go install google.golang.org/protobuf/cmd/protoc-gen-go@latest google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
  ```

> 📖 For full setup guides (including Fedora, Arch Linux, WSL2, and direct downloads), see the **[Developer Onboarding Guide](docs/ONBOARDING.md)**.

### 1.2. 1-Click Monorepo Launch

```bash
# 1. Clone repository
git clone https://github.com/Yogesh-Kumar-Mallik-dev/NovWrite.git
cd NovWrite

# 2. Install workspace dependencies
pnpm install

# 3. Setup environment configuration
cp .env.example .env

# 4. Launch 1-Click Full Dev Environment (Postgres, Redis, API, Data Service, Web)
./dev.sh
```

---

## 2. Core Features & Capabilities

- **Dynamic Project Isolation & Multi-Novel Scoping**:
  - Full project hierarchy: `Project` $\rightarrow$ `Novel` $\rightarrow$ `Volume` $\rightarrow$ `Chapter` $\rightarrow$ `Scene`.
  - Dynamic Project Switcher with instant switching, freeform genre text input (e.g. `Xianxia / Cultivation`, `Sci-Fi`), pure **Clean Slate** universe creation (zero starter archetypes or dummy entity bloat), and zero-state "No Active Project Selected" guidance cards.
  - Project Settings & Edit modal (`EditProjectDialog`) with title, genre, and synopsis modification.
  - **3-Step Irreversible Project Deletion** (`DeleteProjectDialog`): Sequential confirmation sequence assessing affected asset scope, requiring an irreversibility acknowledgment checkbox, and exact project title verification before deletion.
  - Complete database & Redis reset lifecycle (`./flush_db.sh`) for testing fresh user onboarding.
- **Zero Redundant Close Buttons Standard**:
  - Clean, distraction-free modal dialogs, drawers, and toasts with zero redundant top-right cross `(X)` buttons.
  - Consistent dismissal across all viewports via backdrop click, keyboard `Escape`, and explicit bottom action buttons (`[Cancel]`, `[Close]`).
- **The UPDATE Pipe & Hanging EDIT Trees Dual-Axis Reversible DAG Engine**:
  - **The UPDATE Pipe (Plot Axis / $T_{\text{story}}$)**: Sequential horizontal pipeline representing chronological narrative events (`event0 ---> event1 ---> event2 ---> event3 ---> event4`).
  - **Hanging EDIT Trees (Authorial Revision DAG)**: Every event and entity possesses a vertical tree of immutable revision nodes (`ED0 -> ED1 -> ED2 -> ED3 ...`) with non-destructive checkouts. Reverting to an earlier node does not erase newer drafts—they remain branches of the parent node with infinite branching support.
  - **Bitemporal Coordinate Resolution**: Deterministically resolves exact world state at any dual-axis coordinate $(T_{\text{narrative}}, T_{\text{revision}})$.
  - **Interactive PipeTree Visualizer**: Dedicated UI component (`PipeTreeVisualizer`) rendering the glowing horizontal timeline conduit alongside vertical hanging branch graphs with live EDIT head pointers (`[⚡ ACTIVE EDIT HEAD]`).
- **RESTful API Standardization & Best Practices**:
  - **Versioning & Telemetry**: Explicit `/api/v1/` routes with `API-Version`, `X-Request-ID`, and `X-Response-Time` tracing headers.
  - **Standardized Pagination & Empty Query Guarantees**: Predictable pagination metadata envelopes (`page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`). Empty queries are guaranteed to return HTTP 200 OK with `"data": []` (never `null`).
  - **RFC 7807 Problem Details**: All errors return structured `application/problem+json` envelopes with field-level validation breakdowns.
  - **Container & Orchestration Probes**: Built-in `/healthz`, `/livez`, and `/readyz` endpoints.
- **First-Class & Second-Class Blueprint System**: Complete freedom to create universes from scratch.
  - **1st-Class Blueprints (Entity Archetypes)**: Instantiate tangible universe actors in the timeline (Characters, Sacred Relics, Realms, Factions, Sects) with full causal mutation history.
  - **2nd-Class Blueprints (Sub-Blueprints & Value Objects)**: Reusable embedded data structures and scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`) referenced across entities.
- **Dynamic Enums, Value Types, Arrays & Blueprint References**: Define options for enum fields, power-weighted value types, freeform item arrays (`ARRAY`), and entity reference arrays (`ARRAY_REF`).
- **Zero-Trust Backend Validation Parity**: Strict lowercase machine key coercion (`.toLowerCase()`, `strings.ToLower`), duplicate key rejection, field type slate wipe, and normalized property lookup across both Go and TypeScript backends.
- **Deterministic Server-Side AST Formula Engine**: Write complex mathematical formulas for computed properties (e.g. `Total Combat Power = (cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery`) that recalculate in real-time on frontend and are validated and computed deterministically on the backend.
- **Mobile-First Responsive Architecture & Motion System**:
  - 2-tier sub-header control strip, auto-fit container-safe cards, top pagination bar to eliminate layout jumps, and isolated table/DAG scrolling.
  - Svelte 5 native bidirectional transitions (`transition:fade`, `transition:scale`, `transition:fly`, 150–220ms) with physics-based cubic easing and full `@media (prefers-reduced-motion: reduce)` accessibility.
  - Single-icon purple theme toggle (`#7c3aed`) rendering exactly one icon at a time matching both light and dark themes.
- **Dedicated Page-Based Routing Architecture**: Deep-linkable 3-tier route architecture for every domain (List `/`, Create `/create`, Update/Inspect `/[id]`) adhering to the modern Zero-Badge UI standard, clean slate dynamic fields, 100% Bits UI Select dropdowns, and automatic post-save redirection.
- **Canonical State Tracking & Evidence-Based Continuity Warnings**: At any scene, reconstructs exact world state and flags prose contradictions citing historical causal events.
- **Graceful Lifecycle Orchestration & 5-Phase Test Runner**: 1-click dev server (`./dev.sh`), build (`./build.sh`), typecheck (`./check.sh`), unified 5-phase test runner (`./test.sh`), and database flusher (`./flush_db.sh`).

---

## 3. Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   FRONTEND CLIENTS                     │
│    Web (SvelteKit 2 + Svelte 5 Runes + Tailwind v4)    │
│    Desktop (Tauri 2) · Mobile (React Native + Expo)    │
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

- **API Backend**: Go 1.23+ (Modular Monolith with `go-chi/chi`, Dependency Injection).
- **Data Service**: TypeScript + Prisma ORM via coarse-grained gRPC contracts.
- **Formula Engine**: Sandboxed AST-based mathematical expression evaluator supporting arithmetic, dot-notation variables, logical conditionals, and math functions.
- **Database**: PostgreSQL 18 with JSONB for dynamic entity properties and `pgvector` for semantic context retrieval.
- **Caching & Ephemeral State**: Redis 7.2+.
- **Deployment**: Docker Compose behind Traefik reverse proxy with automated TLS.

---

## 4. Documentation Index

- **Academic & Formal Specifications:**
  - **[NovWrite B.Tech Capstone Project Report (`Novwrite.docx`)](file:///home/yogesh/Projects/NovWrite/Novwrite.docx)** — Comprehensive up-to-date professional project report and system architecture document for submission.
  - **[Documentation & Specification Changelog (`changes.md`)](file:///home/yogesh/Projects/NovWrite/changes.md)** — Chronological timeline of specification and report revisions.
- **Core Architecture Specifications:**
  - [Frontend Architecture Specification](docs/FRONTEND_ARCHITECTURE.md)
  - [Database Architecture Specification](docs/DATABASE_ARCHITECTURE.md)
  - [Backend Architecture Specification](docs/BACKEND_ARCHITECTURE.md)
  - [Cache Architecture Specification](docs/CACHE_ARCHITECTURE.md)
  - [Communication Layer Specification](docs/COMMUNICATION_LAYER.md)
  - [MVP Phased Implementation Plan](docs/MVP_PHASED_PLAN.md)
- **Guides & Quick References:**
  - [Developer Onboarding & Multi-OS Setup Guide](docs/ONBOARDING.md)
  - [Recommended Development Commands Cheat Sheet](docs/recommended_commands.md)
  - [API & Integration Guide](docs/API_GUIDE.md)
  - [Monorepo Architecture Specification](NOVWRITE_ARCHITECTURE.md)
  - [Agent Instructions & Rules](.agent/agents.md)
  - [Design Decisions Log](docs/design_decisions.md)

---

## 5. Development Workflow & Rules

All contributors and AI agents must strictly adhere to the repository rules defined in [.agent/agents.md](.agent/agents.md):

1. **Single-Change Policy**: Execute strictly one change at a time (one feature, one refactor, or one fix). Reject multi-change requests.
2. **Commit Format**: All commit messages must follow `<type>(<domain>): <expression>` (e.g. `feat(world): add formula parser for combat powers`).
3. **Signed Commits**: Always commit changes using GPG: `git commit -S -m "..."`.
4. **Block-Based Code Standard**: Code must be written in modular blocks featuring comment headers, early returns (guard clauses), and unique block IDs in all error handling.
5. **Zero-Badge UI Policy**: Badges and pill tags are prohibited on the frontend. Use semantic icons, action buttons, accessible breadcrumbs, and slide drawers instead.
