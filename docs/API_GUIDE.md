# NovWrite API & Integration Guide

This guide describes the external HTTP REST API exposed by the Go backend and the internal gRPC interface exposed by the TypeScript Data Service.

---

## 1. External HTTP REST API (Go Backend)

All external API endpoints are versioned under `/api/v1` and use JSON request/response bodies. Error responses conform strictly to **RFC 7807 (Problem Details for HTTP APIs)**.

### 1.1 Authentication & Projects

- `POST /api/v1/auth/login` — Authenticate user and issue session token.
- `POST /api/v1/auth/register` — Create new user account.
- `GET /api/v1/projects` — List accessible projects.
- `POST /api/v1/projects` — Create a new project universe.
- `GET /api/v1/projects/{projectId}` — Get project metadata and settings.

### 1.2 Novels & Chapters

- `GET /api/v1/projects/{projectId}/novels` — List novels in project.
- `POST /api/v1/projects/{projectId}/novels` — Create a new novel.
- `GET /api/v1/novels/{novelId}/chapters` — List chapters in order.
- `POST /api/v1/novels/{novelId}/chapters` — Create a chapter.
- `GET /api/v1/chapters/{chapterId}/scenes` — List scenes for chapter.
- `PUT /api/v1/scenes/{sceneId}/content` — Save prose content for scene.

### 1.3 Universe Entities & Schemas

- `GET /api/v1/projects/{projectId}/entity-types` — Get custom entity schemas.
- `POST /api/v1/projects/{projectId}/entity-types` — Define custom entity type (e.g., Character, Cultivation Realm).
- `GET /api/v1/projects/{projectId}/entities` — List entities with filtering by type.
- `POST /api/v1/projects/{projectId}/entities` — Create an entity instance with dynamic properties.
- `PUT /api/v1/entities/{entityId}` — Update entity properties.

### 1.4 Timeline & Events

- `GET /api/v1/projects/{projectId}/timeline` — Retrieve timeline of events.
- `POST /api/v1/projects/{projectId}/events` — Record an event and its state mutations (`EventEffect`).
- `GET /api/v1/projects/{projectId}/state?chapterId={id}&sceneId={id}` — Compute and return canonical universe state at a given chapter/scene.

### 1.5 Continuity Verification

- `POST /api/v1/scenes/{sceneId}/verify-continuity` — Run the rules engine against a scene's drafted prose and metadata.
- **Sample Response:**
  ```json
  {
    "sceneId": "scn_82910",
    "passed": false,
    "violations": [
      {
        "id": "viol_102",
        "ruleType": "POWER_TIER",
        "severity": "ERROR",
        "message": "Zhang Rui uses Heavenly Flame (Sovereign Stage), but current canonical stage is Mature Stage.",
        "contradictionText": "Zhang Rui unleashed the Sovereign Stage Heavenly Flame",
        "canonicalState": {
          "entityId": "ent_zhang_rui",
          "property": "cultivation_realm",
          "value": "Mature Stage",
          "establishedByEventId": "evt_breakthrough_ch74"
        },
        "suggestedActions": [
          {
            "action": "ACCEPT_NEW_CANON",
            "label": "Accept Sovereign Stage as new canon"
          },
          {
            "action": "INSERT_EVENT",
            "label": "Insert missing breakthrough event between Ch 74 and 82"
          },
          {
            "action": "EDIT_PROSE",
            "label": "Edit scene text to match Mature Stage"
          }
        ]
      }
    ]
  }
  ```

### 1.6 AI Operations Gateway

- `POST /api/v1/ai/extract-events` — Extract proposed entities, relationship shifts, and events from prose.
- `POST /api/v1/ai/generate-scene` — Generate scene continuation grounded in active canonical state.

---

## 2. Internal gRPC Interface (TypeScript Data Service)

The Go backend communicates with the TypeScript Prisma Data Service over internal gRPC defined in `proto/data/v1/data_service.proto`.

### Coarse-Grained RPC Methods:

- `rpc GetNovelState(GetNovelStateRequest) returns (GetNovelStateResponse)`
- `rpc CreateEvent(CreateEventRequest) returns (CreateEventResponse)`
- `rpc GetTimeline(GetTimelineRequest) returns (GetTimelineResponse)`
- `rpc GetEntity(GetEntityRequest) returns (GetEntityResponse)`
- `rpc UpsertEntity(UpsertEntityRequest) returns (UpsertEntityResponse)`
- `rpc QueryStoryContext(QueryStoryContextRequest) returns (QueryStoryContextResponse)`

_Generic arbitrary table CRUD is strictly prohibited over gRPC to protect domain consistency._
