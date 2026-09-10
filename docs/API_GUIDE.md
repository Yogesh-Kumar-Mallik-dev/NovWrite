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

### 2.4 Defensive Security & Rate Limit Telemetry (`429 Too Many Requests`)

All API endpoints are protected by an in-memory token bucket rate limiter (300 req/min default per client IP) and return dynamic rate limit telemetry headers:

- `X-RateLimit-Limit`: Maximum requests permitted per rate window (e.g. `300`).
- `X-RateLimit-Remaining`: Remaining request quota for the current window.
- `X-RateLimit-Reset-Seconds`: Seconds until the quota replenishment window resets.

When rate limits are exceeded, the API returns HTTP 429:

```json
{
  "type": "https://novwrite.io/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please retry in 12 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfterSeconds": 12,
  "timestamp": "2026-09-09T05:00:00.000000Z"
}
```

---

## 3. Endpoints Reference (`/api/v1/...`)

### 3.1 Health & Liveness Probes

- `GET /healthz` — System health summary.
- `GET /livez` — Kubernetes/process liveness probe.
- `GET /readyz` — Database and dependency readiness probe.

### 3.2 Projects & Workspace Scoping

- `GET /api/v1/projects` — List user's active projects with pagination, sorting, and search.
- `POST /api/v1/projects` — Create a new project workspace on a pure **Clean Slate** with title, freeform genre text input (e.g. `Xianxia / Cultivation`, `Dark Fantasy`), and synopsis. Zero boilerplate/starter archetypes seeded. Returns `201 Created` with `Location` header.
- `GET /api/v1/projects/{projectId}` — Retrieve project metadata, novel count, word count velocity, and author roles.
- `PUT /api/v1/projects/{projectId}` / `PATCH /api/v1/projects/{projectId}` — Update project title, synopsis, and freeform genre string.
- `DELETE /api/v1/projects/{projectId}` — Irreversibly delete project workspace and cascade-remove scoped blueprints, entities, scenes, and timeline events (`204 No Content`). Guarded by frontend 3-step confirmation sequence (`DeleteProjectDialog.svelte`).

### 3.2.1 Novel Prose Manuscript & Collaborative Scene Leases

- `GET /api/v1/projects/{projectId}/chapters` — List chapters in order with pagination.
- `POST /api/v1/projects/{projectId}/chapters` — Create a new chapter.
- `GET /api/v1/projects/{projectId}/chapters/{chapterId}` — Get chapter metadata and synopsis.
- `PUT /api/v1/projects/{projectId}/chapters/{chapterId}` — Update chapter title, order, or synopsis.
- `DELETE /api/v1/projects/{projectId}/chapters/{chapterId}` — Delete chapter and cascade delete child scenes.
- `GET /api/v1/projects/{projectId}/scenes` — List scenes for a project or filtered by chapter (`?chapterId=...`).
- `POST /api/v1/projects/{projectId}/scenes` — Create a new scene with target word count and POV character assignment.
- `GET /api/v1/projects/{projectId}/scenes/{sceneId}` — Retrieve scene details and manuscript prose content.
- `PUT /api/v1/projects/{projectId}/scenes/{sceneId}` — Update scene prose text and word counts. Guarded against concurrent edits if held under another author's active distributed lease (`409 Conflict`).
- `DELETE /api/v1/projects/{projectId}/scenes/{sceneId}` — Remove a scene.
- `GET /api/v1/projects/{projectId}/scenes/{sceneId}/lease` — Query distributed Redis lease status and remaining TTL seconds.
- `POST /api/v1/projects/{projectId}/scenes/{sceneId}/lease/acquire` — Atomically acquire a 60-second distributed editing lease in Redis. Returns `409 Conflict` if held by another author.
- `POST /api/v1/projects/{projectId}/scenes/{sceneId}/lease/renew` — Heartbeat renewal extending the active lease by 60 seconds.
- `POST /api/v1/projects/{projectId}/scenes/{sceneId}/lease/release` — Voluntarily release the editing lease and broadcast `SCENE_LEASE_RELEASED` over SSE.

### 3.3 Blueprints (Schemas)

- `GET /api/v1/projects/{projectId}/blueprints` — List blueprints with pagination, search, and category filters.
- `POST /api/v1/projects/{projectId}/blueprints` — Create a new blueprint schema. Machine keys are automatically normalized to lowercase; duplicate keys are rejected with 422. Returns `201 Created` with `Location` header.
- `GET /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Retrieve blueprint schema.
- `PUT /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Update blueprint. Changing a field's type automatically wipes the slate clean for incompatible attributes.
- `DELETE /api/v1/projects/{projectId}/blueprints/{blueprintId}` — Remove blueprint schema (`204 No Content`).

### 3.4 Entities & Bitemporal Revisions (The Feather & Web Model)

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

### 3.5 Formulas Engine

- `POST /api/v1/formulas/evaluate` — Test and evaluate mathematical and logical formulas with sample context.
  - Supported functions: `IF(cond, t, f)`, `CLAMP(val, min, max)`, `MIN(a, b)`, `MAX(a, b)`, `ABS(x)`, `ROUND(x)`, `FLOOR(x)`, `CEIL(x)`, `SQRT(x)`, `POW(x, y)`.
  - Supported operators: `+`, `-`, `*`, `/`, `%`, `>`, `<`, `>=`, `<=`, `==`, `!=`, `&&`, `||`, `!`.
  - Context keys are case-insensitive.
- `POST /api/v1/formulas/validate` — Validate formula syntax and extract referenced variables.

### 3.6 Timeline, UPDATE Pipe & Hanging EDIT Trees

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

### 3.7 World Domain Bridge

- `POST /api/v1/bridge/ground` — Ground a scene with folded canonical state for referenced entities.
- `POST /api/v1/bridge/audit` — Audit draft prose actions against invariant rules (e.g. deceased entity taking actions, numeric bounds underflow).
- `POST /api/v1/bridge/mentions` — Fast autocomplete query for universe entities with category filtering.

### 3.8 Authentication & User Identity (`/api/v1/auth`)

- `POST /api/v1/auth/register` — Register a new author account (`USER`). Elevated role self-assignment (`ADMIN`, `SUPER_ADMIN`) is strictly prohibited and returns `403 Forbidden`.
  - Body: `{ "email": "author@novwrite.dev", "username": "author_pen", "password": "SecurePassword123" }`
  - Returns: `201 Created` with User object envelope.
- `POST /api/v1/auth/login` — Authenticate via email or username and password.
  - Body: `{ "emailOrUsername": "author@novwrite.dev", "password": "SecurePassword123" }`
  - Returns: `200 OK` with JWT bearer token and user profile.
- `GET /api/v1/auth/me` — Retrieve active profile and system role of authenticated caller. Guarded by `JWTAuthMiddleware`.

### 3.9 Platform Administration (`/api/v1/admin`)

- `GET /api/v1/admin/users` — Paginated user directory with search and role filters (`page`, `pageSize`, `search`, `role`). Guarded by `RequireAdmin()`.
- `PUT /api/v1/admin/users/{userId}/role` — Promote or demote user system roles. Guarded by `RequireAdmin()` (promoting to `ADMIN` or `SUPER_ADMIN` requires `RequireSuperAdmin()`).
- `DELETE /api/v1/admin/users/{userId}` — Irreversibly delete a user account. Guarded by `RequireSuperAdmin()`.

### 3.10 Singleton Super Admin Control Plane (`/api/v1/superadmin`)

- `POST /api/v1/superadmin/login` — Authenticate the designated Singleton Super Admin (`novwrite_ops` / `sysadmin@novwrite.dev`). Requests by non-superadmin users are rejected with `403 Forbidden` (`SUPER_ADMIN_CREDENTIALS_REQUIRED`). Returns 24-hour signed JWT token.
- `GET /api/v1/superadmin/dashboard` — High-security system telemetry: active goroutines, Go runtime version, host platform, user tier distributions, and rate limiter status. Guarded by `RequireSuperAdmin()`.

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

---

## 5. Frontend API Client & Standardized 10-Item Pagination Standard

The Web and Desktop frontends (`apps/web`) consume and paginate API resources through a unified TypeScript client layer (`apps/web/src/lib/api/apiClient.ts`):

- **Client Class**: `NovWriteApiClient` with typed methods `getPaginated<T>(endpoint, params)` and `getSingle<T>(endpoint)`.
- **Pure Client Paginator**: `paginateArray<T>(items, params)` providing RFC 7807 metadata and envelope structures for client-side stores.
- **Frontend Page Size Standard**: Set to **10 items per page** across all list tables and workbench grids.
- **Reusable Component**: `<Pagination />` (`apps/web/src/lib/components/ui/pagination.svelte`) with item range telemetry (`Showing X–Y of Z items`), zero-badge indicator (`Page X / Y`), and Previous / Next navigation buttons.
