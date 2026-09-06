# Backend Architecture Specification

**Status:** Locked Baseline (Version 2.0 - Blueprint vs. Entity Paradigm, Relational Entity Graphs, Formula Engine & State Fold Architecture)  
**Primary Application Engine:** Go 1.23+ (`api/`, `backend/`)  
**Data Access Service:** TypeScript Node.js 22+ with Prisma ORM (`services/data/`)  
**Inter-Service Transport:** gRPC over HTTP/2 (`proto/data/v1/`)  
**Client API Transport:** REST HTTP & Server-Sent Events (SSE) via Chi Router

---

## 1. System Topology & Service Boundaries

```mermaid
flowchart TB
    subgraph Clients ["Client Layer"]
        Web["Web Client (SvelteKit 2 + Svelte 5)"]
        Desk["Desktop Client (Tauri 2)"]
        Mobile["Mobile Client (React Native + Expo)"]
    end

    subgraph GoBackend ["Application Core & API Layer (Go)"]
        Router["Chi HTTP Router & Middleware"]
        AuthSvc["Identity & Auth Service"]
        NovelSvc["Novel & Prose Service"]
        UniverseSvc["Universe & Blueprint Engine"]
        TimelineSvc["Timeline & Event Fold Engine"]
        ContinuityEngine["Continuity & Invariant Engine"]
        AIGateway["AI Context Gateway"]
    end

    subgraph DataLayer ["Data Service Layer (TypeScript)"]
        GRPCServer["gRPC Data Server"]
        PrismaClient["Prisma ORM & Migration Engine"]
        QueryCompiler["JSONB Path Query Compiler"]
        FormulaEngine["AST Mathematical Formula Evaluator"]
    end

    subgraph Storage ["Infrastructure & Storage"]
        PG[("PostgreSQL 18 + pgvector")]
        Redis[("Redis 7 (Cache, Leases & PubSub)")]
    end

    Web & Desk & Mobile -->|"REST / SSE"| Router
    Router --> AuthSvc & NovelSvc & UniverseSvc & TimelineSvc & ContinuityEngine & AIGateway

    NovelSvc & TimelineSvc & UniverseSvc & ContinuityEngine & AIGateway -->|"Internal gRPC"| GRPCServer
    GRPCServer --> PrismaClient & FormulaEngine
    PrismaClient --> QueryCompiler
    QueryCompiler --> PG

    AIGateway & TimelineSvc & NovelSvc -->|"Cache & Leases"| Redis
```

---

## 2. Layer Responsibilities & Isolation Rules

### 2.1. Go Application API Layer (`api/`, `backend/`)

- **HTTP Routing & Middleware:** Chi-based routing, JWT/session authentication, project tenancy scoping, rate limiting, and request correlation tracing.
- **Universe & Blueprint Engine (`universe`):**
  - Manages **1st-Class Blueprints** (Entity Archetypes: Characters, Weapons, Sanctuaries, Factions) and **2nd-Class Blueprints** (Sub-Schemas & Gauges: Cultivation Ranks, Affection Scales, Power Matrices).
  - Validates dynamic entity attributes against `BlueprintDef` and `DynamicFieldDef` schemas, including pure categorical enums (`ENUM`), weighted value types (`VALUE_TYPE`: `{ label, value, power }`), and relational `BLUEPRINT_REF` links.
  - Executes AST mathematical formulas server-side during entity persistence and event mutation.
- **Prose & Novel Engine (`novel`):** Managing scene markdown, word count telemetry, chapter hierarchies, entity mentions, and collaborative 60-second heartbeat scene locks (`scene_leases`).
- **Timeline & State Fold Engine (`timeline`):** Pure deterministic event folding, point-in-time state reconstruction, and historical snapshot generation over ordered `EventEffect` sequences.
- **Continuity & Rules Engine (`continuity`):** Invariant rule execution, predicate evaluation against folded state, relational link validation, and explainable violation traceback generation.
- **AI Context Gateway (`ai`):** Assembling grounded prompts from canonical state and `pgvector` similarity, streaming model completions via SSE.

### 2.2. TypeScript Data Service (`services/data/`)

- **Isolation Scope:** Encapsulates direct database queries, migrations, and Prisma ORM client operations.
- **No Business Logic:** The data service does NOT perform continuity validation or narrative logic; it provides high-speed, type-safe persistence, JSONB attribute querying, and vector indexing.
- **Coarse-Grained Domain gRPC API:**
  - `GetProjectState(projectId, sequenceNumber)`
  - `CreateEventWithEffects(projectId, eventData, effects)`
  - `GetEntityTimeline(projectId, entityId)`
  - `EvaluateEntityFormulas(projectId, entityId, propertiesJson)`
  - `SearchVectorGrounding(projectId, queryEmbedding, limit)`

---

## 3. Go Domain Module Architecture

Each domain module in `backend/` follows strict Dependency Injection (DI) with interfaces:

```text
backend/
├── shared/                       # Shared error types, logger, ID generators
├── identity/                     # Users, auth tokens, workspace tenancy, MFA
├── novel/                        # Novel, chapter, scene, prose operations, scene leases
├── universe/                     # Blueprints (1st/2nd Class), fields, entities, formulas, relations
├── timeline/                     # Events, event effects, state snapshots, fold engine
├── continuity/                   # Invariant rules, predicate evaluator, violation generator
└── ai/                           # Prompt builder, model clients (Gemini/Anthropic/OpenAI), SSE streamer
```

### 3.1. Block-Based Construction Standard

Every logical function or block in the Go codebase follows the mandatory structure:

```go
// Block: BLOCK_TIMELINE_FOLD_STATE_001
// Description: Reconstructs the universe entity state at a given chapter sequence number by folding historical event effects over the nearest base snapshot.
// Inputs: ctx context.Context, projectID uuid.UUID, targetSeq int
// Output: (*UniverseStateSnapshot, error)
func (e *TimelineFoldEngine) FoldStateAtSequence(ctx context.Context, projectID uuid.UUID, targetSeq int) (*UniverseStateSnapshot, error) {
    if targetSeq < 0 {
        return nil, fmt.Errorf("BLOCK_TIMELINE_FOLD_STATE_001: invalid negative sequence number: %d", targetSeq)
    }

    baseSnapshot, err := e.snapshotRepo.GetNearestSnapshot(ctx, projectID, targetSeq)
    if err != nil {
        return nil, fmt.Errorf("BLOCK_TIMELINE_FOLD_STATE_001: failed to retrieve base snapshot: %w", err)
    }

    // Flat execution flow with early returns and deterministic state folding...
    return foldedState, nil
}
```

---

## 4. Universe Blueprint & Entity Domain Mechanics

### 4.1. Blueprint (Class) vs Entity (Object) Service Model

```mermaid
flowchart TD
    subgraph BlueprintService ["Blueprint Domain Service (universe/blueprint.go)"]
        BP1["1st-Class Archetypes<br/>(Characters, Weapons, Realms, Factions)"]
        BP2["2nd-Class Sub-Schemas<br/>(Cultivation Ranks, Affection Scales, Matrices)"]
        BP3["Dynamic Field Validator<br/>(Types: String, Number, Boolean, Enum, ValueType, Ref, Formula)"]
    end

    subgraph EntityService ["Entity Domain Service (universe/entity.go)"]
        E1["Concrete Entity Instantiation<br/>(Only 1st-Class Blueprints)"]
        E2["Relational Graph Builder<br/>(Character -> Faction, Weapon -> Realm)"]
        E3["JSONB Property Store<br/>(Dynamic attributes + nested 2nd-class objects)"]
        E4["Formula Evaluator<br/>(AST math execution & computed cache)"]
    end

    BP1 --> E1
    BP2 --> E3
    BP3 --> E3
    E3 --> E4
    E1 --> E2
```

### 4.2. Relational Entity Graph Traversal & Reference Integrity
- 1st-Class Blueprints can define fields of type `BLUEPRINT_REF` targeting other 1st-Class Blueprints (e.g. `cultivator.sect_id -> Ancient Faction & Sect`, `cultivator.equipped_weapon -> Sacred Weapon & Relic`).
- The backend validates reference integrity during instantiation and mutation, preventing dangling entity references.
- Circular references in formula dependencies are detected via cycle-detection algorithms before expression execution.

---

## 5. Continuity Verification Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Writer as Author / Frontend
    participant API as Go Novel / Editor API
    participant Fold as State Fold Engine
    participant Rules as Continuity Rules Engine
    participant Data as TS Data Service (gRPC)
    participant Redis as Redis Pub/Sub

    Writer->>API: PATCH /api/v1/projects/:id/scenes/:sceneId (Draft Prose / Entity Claims)
    API->>Data: Persist scene draft
    API->>Fold: Compute active universe state at scene sequence
    Fold->>Data: Fetch base snapshot & delta event effects
    Data-->>Fold: Base state + ordered effects
    Fold-->>API: Authoritative folded entity state
    API->>Rules: Evaluate continuity invariants against prose & metadata
    Rules->>Rules: Run status, possession, power tier, relationship & custom predicates
    alt Violation Detected
        Rules-->>API: Return ContinuityViolation (claim, baseline, causal event, actions)
        API->>Redis: Publish continuity alert to scene SSE channel
        API-->>Writer: Return 200 OK with scene + continuity warnings
    else No Violations
        Rules-->>API: Verified clean
        API-->>Writer: Return 200 OK (Clean continuity status)
    end
```

---

## 6. gRPC Protobuf Contracts (`proto/data/v1/`)

```protobuf
syntax = "proto3";

package novwrite.data.v1;
option go_package = "github.com/Yogesh-Kumar-Mallik-dev/NovWrite/proto/data/v1;datav1";

service DataService {
  rpc GetProjectState(GetProjectStateRequest) returns (GetProjectStateResponse);
  rpc CreateEventWithEffects(CreateEventRequest) returns (CreateEventResponse);
  rpc QueryEntityHistory(QueryEntityHistoryRequest) returns (QueryEntityHistoryResponse);
  rpc EvaluateFormulas(EvaluateFormulasRequest) returns (EvaluateFormulasResponse);
  rpc FindSimilarContext(FindSimilarContextRequest) returns (FindSimilarContextResponse);
  rpc SaveStateSnapshot(SaveStateSnapshotRequest) returns (SaveStateSnapshotResponse);
}

enum BlueprintClass {
  BLUEPRINT_CLASS_UNSPECIFIED = 0;
  FIRST_CLASS = 1;
  SECOND_CLASS = 2;
}

enum BlueprintFieldType {
  FIELD_TYPE_UNSPECIFIED = 0;
  STRING = 1;
  NUMBER = 2;
  BOOLEAN = 3;
  ENUM = 4;
  BLUEPRINT_REF = 5;
  FORMULA = 6;
}

message EnumOption {
  string label = 1;
  string value = 2;
  double power = 3;
}

message DynamicFieldDef {
  string id = 1;
  string name = 2;
  string label = 3;
  BlueprintFieldType field_type = 4;
  repeated EnumOption options = 5;
  string target_blueprint_id = 6;
  double min_val = 7;
  double max_val = 8;
  double step_val = 9;
  string unit = 10;
  string formula_expression = 11;
  bool is_required = 12;
}

message BlueprintDef {
  string id = 1;
  string project_id = 2;
  string name = 3;
  BlueprintClass blueprint_class = 4;
  string category = 5;
  string description = 6;
  repeated DynamicFieldDef fields = 7;
}

message EntityItem {
  string id = 1;
  string project_id = 2;
  string blueprint_id = 3;
  string name = 4;
  repeated string aliases = 5;
  string description = 6;
  bytes properties_json = 7;
  bytes computed_formulas_json = 8;
  string status = 9;
  int32 last_mutated_seq = 10;
}

message GetProjectStateRequest {
  string project_id = 1;
  int32 sequence_number = 2;
}

message GetProjectStateResponse {
  string project_id = 1;
  int32 sequence_number = 2;
  repeated EntityItem entities = 3;
  string checksum = 4;
}

message CreateEventRequest {
  string project_id = 1;
  string anchor_scene_id = 2;
  string name = 3;
  string description = 4;
  int32 narrative_sequence = 5;
  repeated EventEffect effects = 6;
}

message EventEffect {
  string entity_id = 1;
  string property_key = 2;
  string operation = 3;
  string previous_value_json = 4;
  string new_value_json = 5;
  string explanation = 6;
}

message CreateEventResponse {
  string event_id = 1;
  bool success = 2;
}

message EvaluateFormulasRequest {
  string project_id = 1;
  string blueprint_id = 2;
  bytes properties_json = 3;
}

message EvaluateFormulasResponse {
  bytes computed_formulas_json = 1;
  bool success = 2;
  string error_message = 3;
}
```

---

## 7. Error Handling Standard (RFC 7807 Problem Details)

All HTTP error responses adhere to `application/problem+json`:

```json
{
  "type": "https://novwrite.app/errors/continuity-violation",
  "title": "Continuity Invariant Violation",
  "status": 422,
  "detail": "BLOCK_CONTINUITY_EVAL_004: Character 'Elder Han' is claimed alive in Scene 42, but was marked deceased in Event 'Fall of Cloud Sect' (Seq: 18).",
  "instance": "/api/v1/projects/proj-123/scenes/scene-42/validate",
  "block_id": "BLOCK_CONTINUITY_EVAL_004",
  "invalid_params": [
    {
      "name": "character_status",
      "reason": "Entity status deceased cannot invoke martial art techniques"
    }
  ]
}
```

---

## 8. Multi-User Collaboration & Concurrency Engine

### 8.1. Scene Lock & Heartbeat Lease Protocol

To prevent concurrent overwrite conflicts when multiple co-authors work on a shared novel:

1. **Acquire Lease:** When an author opens a scene for editing, the client issues `POST /api/v1/projects/{id}/scenes/{sceneId}/lock`. The Go backend records an entry in `scene_leases` and returns a 60-second heartbeat lease token.
2. **Heartbeat Renewal:** The client pings `POST /api/v1/projects/{id}/scenes/{sceneId}/heartbeat` every 20 seconds to extend the lease.
3. **Read-Only Peer View:** Other authors attempting to edit the same scene receive an active editor indicator with the current writer's identity, placing their editor in synchronized read-only mode.
4. **Lock Breaking:** If a writer disconnects without releasing the lease, a `CO_AUTHOR` or `LEAD_AUTHOR` can break the lock via `DELETE /api/v1/projects/{id}/scenes/{sceneId}/lock` (logged to `admin_override_logs`).

---

## 9. In-App Author Override Engine & Project Governance

### 9.1. Block-Based Override Execution Standard

Every in-app canon override in Go must execute through the audited override pipeline with unique block IDs:

```go
// Block: BLOCK_AUTHOR_OVERRIDE_VIOLATION_001
// Description: Allows Lead Authors and Co-Authors to force-approve an intentional canon invariant exception (e.g. resurrection miracle) with mandatory justification.
// Inputs: ctx context.Context, projectID uuid.UUID, authorID uuid.UUID, req *ForceApproveViolationRequest
// Output: (*AuditLogEntry, error)
func (s *AuthorOverrideService) ForceApproveViolation(ctx context.Context, projectID uuid.UUID, authorID uuid.UUID, req *ForceApproveViolationRequest) (*AuditLogEntry, error) {
    if strings.TrimSpace(req.Justification) == "" {
        return nil, fmt.Errorf("BLOCK_AUTHOR_OVERRIDE_VIOLATION_001: override justification is mandatory and cannot be empty")
    }

    role, err := s.membershipRepo.GetUserRole(ctx, projectID, authorID)
    if err != nil || (role != RoleLeadAuthor && role != RoleCoAuthor) {
        return nil, fmt.Errorf("BLOCK_AUTHOR_OVERRIDE_VIOLATION_001: unauthorized; requires LEAD_AUTHOR or CO_AUTHOR role")
    }

    // Execute state override & log immutable audit trail...
    return auditEntry, nil
}
```

### 9.2. Project Author Override Decision Matrix

| Target Operation                        | Permitted for CO_AUTHOR? | Permitted for LEAD_AUTHOR? | Audit Requirement                                               | Immutable Safety Rail                                             |
| :-------------------------------------- | :----------------------- | :------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Force-Approve Invariant Violation**   | Yes                      | Yes                        | Mandatory textual justification logged to `admin_override_logs` | Cannot erase violation history; marks resolved with override flag |
| **Break Stale Scene Lock**              | Yes                      | Yes                        | Lease expiration verification or reason logged                  | Cannot overwrite uncommitted client drafts                        |
| **Merge Conflicting Timeline Branches** | Yes                      | Yes                        | Conflict resolution rationale recorded                          | Replays new branch; past effects remain append-only               |
| **Modify Project Blueprints**           | Yes                      | Yes                        | Blueprint version bump logged                                   | Legacy entity data preserved with deprecation flags               |
| **Transfer / Delete Project**           | **NO**                   | **YES**                    | Multi-factor confirmation + Owner password check                | Project deletion is strictly restricted to LEAD_AUTHOR            |
| **Cross-Tenant Project Access**         | **NO**                   | **NO**                     | Blocked at SQL & JWT middleware level                           | Absolute tenant isolation between different fictional universes   |
| **Impersonate Author Attribution**      | **NO**                   | **NO**                     | Blocked by cryptographic user ID binding                        | Edits always record the executing user's true ID                  |

---

## 10. Platform Administration API & Support Operations

Platform Administrators (`is_platform_admin = true`) access a dedicated operational subsystem:

- `GET /api/v1/platform/users` — Search and view user account metadata, subscription status, and auth history.
- `POST /api/v1/platform/users/{userId}/mfa/reset` — Reset user 2FA after verified identity check (logs support ticket ID).
- `POST /api/v1/platform/users/{userId}/unlock` — Clear brute-force account lockout.
- `POST /api/v1/platform/billing/refunds` — Issue partial/full Stripe refunds and adjust customer subscription tiers.
- `POST /api/v1/platform/support/repair-project-snapshots` — Trigger deterministic snapshot rebuild for corrupted universes upon user support request.
