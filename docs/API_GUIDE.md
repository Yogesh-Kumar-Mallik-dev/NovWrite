# NovWrite API & Integration Guide

This guide describes the external HTTP REST API exposed by the Go backend and the internal gRPC / RPC interface exposed by the TypeScript Data Service and Bridge.

---

## 1. REST API Architecture & Industry Best Practices

The NovWrite API implements industry-standard REST best practices:

- **Explicit Versioning**: All production routes are prefixed with `/api/v1/...` and include the response header `API-Version: 1.0`.
- **Standard Envelopes**: Single entity queries return `{ "data": {...}, "meta": {...} }`.
- **Paginated Envelopes**: Collection queries return `{ "data": [...], "meta": {...}, "pagination": {...} }`.
- **Empty Query Guarantees**: A search or query returning 0 results will **always return HTTP 200 OK with `"data": []` and `"totalCount": 0`** (never `null` or 404).
- **RFC 7807 Problem Details**: All errors return `application/problem+json` with structured error schemas.
- **Zero-Trust Backend Validation Parity**: The backend enforces all constraints independently of the client (lowercase machine keys, slate wiping on field type change, server-side formula evaluation).
- **Observability Headers**: Every response returns `X-Request-ID` and `X-Response-Time`.

---

## 2. Standard Response Envelopes & Error Formats

### 2.1 Single Resource Envelope (`200 OK` / `201 Created`)

```json
{
  "data": {
    "id": "bp-character",
    "name": "Character Template",
    "category": "Character",
    "blueprintClass": "FIRST_CLASS",
    "fields": [
      {
        "id": "f-mana",
        "name": "mana_pool",
        "label": "Mana Pool",
        "type": "NUMBER",
        "defaultValue": 100,
        "attributes": { "min": 0, "max": 10000 }
      }
    ]
  },
  "meta": {
    "requestId": "c62b9a71-0814-48ee-a6a9-e0b04a99d45e",
    "timestamp": "2026-09-07T05:00:00.000000Z",
    "apiVersion": "v1",
    "executionTimeMs": 1.42
  }
}
```

### 2.2 Paginated Resource Envelope (`200 OK`)

Supported Query Parameters:
- `page`: Page number (1-indexed, default `1`).
- `pageSize` or `limit`: Items per page (clamped between `1` and `100`, default `20`).
- `search`: Case-insensitive substring search filter.
- `sort`: Sorting field with optional direction prefix (e.g. `name`, `-created_at`, `sequence_number`).
- `category`: Domain category filter (e.g. `Character`, `Location`, `Artifact`).
- `blueprintId`: Target schema ID filter for entities.

```json
{
  "data": [
    {
      "id": "ent-eldrin",
      "blueprintId": "bp-character",
      "name": "Eldrin",
      "category": "Character",
      "properties": {
        "mana_pool": 100
      }
    }
  ],
  "meta": {
    "requestId": "a821dc70-4f32-4e92-9388-75e11bbdf95a",
    "timestamp": "2026-09-07T05:00:00.000000Z",
    "apiVersion": "v1",
    "executionTimeMs": 2.15
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### 2.3 RFC 7807 Problem Details (`application/problem+json`)

Errors return machine-readable problem details. Example validation error (`422 Unprocessable Content`):

```json
{
  "type": "https://novwrite.io/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Blueprint contains 1 validation error(s)",
  "instance": "/api/v1/projects/p-1/blueprints",
  "code": "SCHEMA_VALIDATION_ERROR",
  "timestamp": "2026-09-07T05:00:00.000000Z",
  "invalidParams": [
    {
      "name": "fields[1].name",
      "reason": "Duplicate field machine key 'mana_pool'. Field machine keys must be unique within a blueprint."
    }
  ]
}
```

---

## 3. Endpoints Reference (`/api/v1/...`)

### 3.1 Health & Liveness Probes
- `GET /healthz` — System health summary.
- `GET /livez` — Kubernetes/process liveness probe.
- `GET /readyz` — Database and dependency readiness probe.

### 3.2 Blueprints (Schemas)
- `GET /api/v1/projects/{projectId}/blueprints` — List blueprints with pagination, search, and category filters.
- `POST /api/v1/projects/{projectId}/blueprints` — Create a new blueprint schema. Machine keys are automatically normalized to lowercase; duplicate keys are rejected with 422. Returns `201 Created` with `Location` header.
- `GET /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Retrieve blueprint schema.
- `PUT /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Update blueprint. Changing a field's type automatically wipes the slate clean for incompatible attributes.
- `DELETE /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Remove blueprint schema (`204 No Content`).

### 3.3 Entities & Bitemporal Revisions (The Feather & Web Model)
- `GET /api/v1/projects/{projectId}/entities` — List entities with pagination, `blueprintId`, and `category` filters.
- `POST /api/v1/projects/{projectId}/entities` — Create an entity. Formulas are deterministically evaluated and populated on the backend. Automatically records Revision #0 (`BASELINE_EDIT`). Returns `201 Created` with `Location` header.
- `GET /api/v1/projects/{projectId}/entities/{entityId}` — Retrieve entity instance.
- `PUT /api/v1/projects/{projectId}/entities/{entityId}` — Update entity properties with zero-trust validation and automatic revision tracking.
- `DELETE /api/v1/projects/{projectId}/entities/{entityId}` — Remove entity (`204 No Content`).
- `GET /api/v1/projects/{projectId}/entities/{entityId}/revisions` — List immutable authorial revision history with pagination and granular delta patches (`name`, `description`, `propertiesChanged`, `formulasChanged`).
- `POST /api/v1/projects/{projectId}/entities/{entityId}/revisions` — Explicitly record an authorial revision with revision type (`TYPO_FIX`, `BASELINE_EDIT`, `RETROACTIVE_PLOT_FIX`) and author note.
- `POST /api/v1/projects/{projectId}/entities/{entityId}/revisions/{revisionId}/revert` — Revert entity to a historical revision state (creates an immutable `REVERT` revision preserving full audit history).
- `GET /api/v1/projects/{projectId}/entities/{entityId}/coordinate?sequenceNumber={seq}&revisionId={rev}` — Resolve exact deterministic state at any 2D coordinate: $(T_{\text{narrative}}, T_{\text{revision}})$. Returns base revision snapshot folded with all story event mutations up to `sequenceNumber`.
- `GET /api/v1/projects/{projectId}/entities/{entityId}/tree` — Retrieve the non-destructive hanging Edit Tree for an entity.
- `POST /api/v1/projects/{projectId}/entities/{entityId}/edits` — Branch a new edit node on the entity tree.
- `POST /api/v1/projects/{projectId}/entities/{entityId}/edits/{editId}/checkout` — Non-destructively switch the active EDIT head to `editId` (child branches are preserved).

### 3.4 Formulas Engine
- `POST /api/v1/formulas/evaluate` — Test and evaluate mathematical and logical formulas with sample context.
  - Supported functions: `IF(cond, t, f)`, `CLAMP(val, min, max)`, `MIN(a, b)`, `MAX(a, b)`, `ABS(x)`, `ROUND(x)`, `FLOOR(x)`, `CEIL(x)`, `SQRT(x)`, `POW(x, y)`.
  - Supported operators: `+`, `-`, `*`, `/`, `%`, `>`, `<`, `>=`, `<=`, `==`, `!=`, `&&`, `||`, `!`.
  - Context keys are case-insensitive.
- `POST /api/v1/formulas/validate` — Validate formula syntax and extract referenced variables.

### 3.5 Timeline, UPDATE Pipe & Hanging EDIT Trees
- `GET /api/v1/projects/{projectId}/timeline/pipe` — Retrieve the full UPDATE horizontal pipeline containing all chronological narrative events alongside their hanging EDIT trees, active EDIT head pointers, and resolved snapshots.
- `GET /api/v1/projects/{projectId}/timeline/events` — Retrieve chronological events with pagination.
- `POST /api/v1/projects/{projectId}/timeline/events` — Append an event with structured mutation effects (`SET`, `INCREMENT`, `DECREMENT`, `APPEND`, `REMOVE`, `TRANSFER`). Automatically initializes root edit node `ED0`.
- `GET /api/v1/projects/{projectId}/timeline/events/{eventId}` — Retrieve individual timeline event.
- `PUT /api/v1/projects/{projectId}/timeline/events/{eventId}` — Update timeline event.
- `DELETE /api/v1/projects/{projectId}/timeline/events/{eventId}` — Remove timeline event.
- `GET /api/v1/projects/{projectId}/timeline/events/{eventId}/tree` — Retrieve the event's hanging EDIT tree DAG.
- `POST /api/v1/projects/{projectId}/timeline/events/{eventId}/edits` — Branch a new edit node onto the event tree (moves active EDIT head to the new node).
- `POST /api/v1/projects/{projectId}/timeline/events/{eventId}/edits/{editId}/checkout` — Non-destructively checkout an edit node as active EDIT head (preserves all child branches).
- `GET /api/v1/projects/{projectId}/timeline/state?seq={seq}` — Fold and compute canonical entity state at a given sequence number.

### 3.6 World Domain Bridge
- `POST /api/v1/bridge/ground` — Ground a scene with folded canonical state for referenced entities.
- `POST /api/v1/bridge/audit` — Audit draft prose actions against invariant rules (e.g. deceased entity taking actions, numeric bounds underflow).
- `POST /api/v1/bridge/mentions` — Fast autocomplete query for universe entities with category filtering.

---

## 4. Internal gRPC Interface (TypeScript Data Service)

The Go backend communicates with the TypeScript Prisma Data Service over internal gRPC defined in `proto/data/v1/data_service.proto`.

### Coarse-Grained RPC Methods:
- `rpc GetNovelState(GetNovelStateRequest) returns (GetNovelStateResponse)`
- `rpc CreateEvent(CreateEventRequest) returns (CreateEventResponse)`
- `rpc GetTimeline(GetTimelineRequest) returns (GetTimelineResponse)`
- `rpc GetEntity(GetEntityRequest) returns (GetEntityResponse)`
- `rpc UpsertEntity(UpsertEntityRequest) returns (UpsertEntityResponse)`
- `rpc QueryStoryContext(QueryStoryContextRequest) returns (QueryStoryContextResponse)`

_Generic arbitrary table CRUD is strictly prohibited over gRPC to protect domain consistency._
