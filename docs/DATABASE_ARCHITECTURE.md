# Database Architecture Specification

**Status:** Locked Baseline (Version 2.0 - First & Second Class Blueprints, Relational Entity Graph, Formula Evaluation & State Sourcing)  
**Engine:** PostgreSQL 18 with `pgvector` extension  
**ORM / Data Access:** TypeScript Data Service (`services/data/`) using Prisma ORM & Coarse-Grained gRPC

---

## 1. Architectural Principles & Data Philosophy

1. **Canon Over AI Memory:** Canonical world state is stored exclusively in PostgreSQL relational tables and dynamic JSONB attributes. AI models never act as the system of record.
2. **Relational Backbone with Dynamic Blueprint Schemas:** Rigid relational models govern structural hierarchies (Projects, Novels, Chapters, Scenes, Events, Rules), while user-defined entities (Characters, Items, Locations, Factions) instantiate 1st-Class Blueprints with JSONB columns validated against `blueprint_fields` schemas.
3. **Class vs. Object Paradigm in Storage:**
   - `blueprints` & `blueprint_fields`: Defines classes/templates (1st-Class Archetypes vs. 2nd-Class Sub-Schemas), dynamic validation rules, pure categorical enums (`ENUM`: string arrays), weighted value types (`VALUE_TYPE`: `{ label, value, power }`), and AST formula expressions.
   - `entities`: Stores concrete instantiated objects with author values in `properties` JSONB and cached math outcomes in `computed_formulas` JSONB.
4. **Event-Sourced State Transitions:** Historical truth is never overwritten. Changes to entity attributes over narrative time are recorded as immutable `event_effects` rows attached to sequential `events` records.
5. **Strict Project Isolation (Multi-Tenancy):** Every database query and index is partitioned by `project_id` to guarantee tenant isolation and performance predictability.
6. **Vector Knowledge Grounding:** Semantic prose and entity embeddings use the `pgvector` extension with HNSW indexing for rapid continuity retrieval.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ ProjectMember : has
    Project ||--o{ Novel : contains
    Project ||--o{ Blueprint : defines
    Project ||--o{ BlueprintField : defines
    Project ||--o{ Entity : contains
    Project ||--o{ Event : logs
    Project ||--o{ ContinuityRule : configures
    Project ||--o{ UserBlueprintColumnPref : persists

    Novel ||--o{ Chapter : contains
    Chapter ||--o{ Scene : contains
    Scene ||--o{ SceneEmbedding : generates
    Scene ||--o{ SceneLease : locks

    Blueprint ||--o{ BlueprintField : contains
    Blueprint ||--o{ Entity : instantiates
    Blueprint ||--o{ UserBlueprintColumnPref : scopes
    BlueprintField }o--o| Blueprint : "targets (ref)"

    Entity ||--o{ EntityRelationship : participates
    Entity ||--o{ EventEffect : mutates
    Entity ||--o{ EntityEmbedding : generates

    Event ||--o{ EventEffect : causes
    Scene ||--o{ Event : anchors

    ContinuityRule ||--o{ RuleViolation : detects
    Scene ||--o{ RuleViolation : flags
```

---

## 3. Detailed Table Schema Definitions

### 3.1. Identity, Tenancy & Prose Hierarchy

```sql
-- Users and authentication (with Platform Admin & MFA support)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    stripe_customer_id VARCHAR(100),
    account_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, pending_mfa_reset
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (author workspaces / fictional universes)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_owner_slug UNIQUE (owner_id, slug)
);

-- Multi-User Project Memberships & Author Roles
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- LEAD_AUTHOR, CO_AUTHOR, EDITOR, CONTRIBUTOR, VIEWER
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

-- Platform-Level Admin Audit Log (User Management, MFA Resets, Billing & Support Assistance)
CREATE TABLE platform_admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- MFA_RESET, PASSWORD_RESET_TRIGGERED, ACCOUNT_UNLOCKED, REFUND_ISSUED, SUBSCRIPTION_ADJUSTED, SUPPORT_DATA_REPAIR
    justification TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Novels within a project
CREATE TABLE novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chapters within a novel
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL,
    global_sequence_number INT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chapter_order UNIQUE (novel_id, order_index)
);

-- Scenes (individual writing units with author attribution)
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL DEFAULT '',
    word_count INT NOT NULL DEFAULT 0,
    order_index INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, in_review, canon
    last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scene_order UNIQUE (chapter_id, order_index)
);

-- Collaborative Scene Active Locks & Heartbeat Leases
CREATE TABLE scene_leases (
    scene_id UUID PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    locked_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    heartbeat_token VARCHAR(64) NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Immutable Admin Override & Canon Exception Audit Log
CREATE TABLE admin_override_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    target_type VARCHAR(50) NOT NULL, -- CONTINUITY_VIOLATION, TIMELINE_BRANCH, SCENE_LOCK, SCHEMA_MUTATION
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- FORCE_APPROVE_VIOLATION, BREAK_SCENE_LOCK, MERGE_BRANCH_OVERRIDE, SCHEMA_FORCE_MIGRATE
    justification TEXT NOT NULL,
    previous_state JSONB NOT NULL,
    new_state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2. World Building, Blueprints & Dynamic Schemas

```sql
-- Blueprints: Defines 1st-Class Entity Archetypes and 2nd-Class Sub-Schemas
CREATE TABLE blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    blueprint_class VARCHAR(50) NOT NULL DEFAULT 'FIRST_CLASS', -- FIRST_CLASS, SECOND_CLASS
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Sparkles',
    is_built_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_blueprint_slug UNIQUE (project_id, slug)
);

-- Blueprint Fields: Dynamic fields, dual-valued enums, sub-schemas & formulas
CREATE TABLE blueprint_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    label VARCHAR(150) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- STRING, NUMBER, BOOLEAN, ENUM, VALUE_TYPE, BLUEPRINT_REF, FORMULA
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["Sword", "Saber"] for ENUM, or [{"label": "Divine", "value": "divine", "power": 1000}] for VALUE_TYPE
    target_blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
    min_val DOUBLE PRECISION,
    max_val DOUBLE PRECISION,
    step_val DOUBLE PRECISION,
    unit VARCHAR(50),
    formula_expression TEXT, -- e.g. "(cultivation.major_realm * 10) + attack"
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_blueprint_field_key UNIQUE (blueprint_id, key)
);

-- Author Per-Blueprint Table Column Preferences
CREATE TABLE user_blueprint_column_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    visible_columns JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["gender", "cultivation.major_realm", "total_combat_power"]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_blueprint_columns UNIQUE (user_id, blueprint_id)
);

-- Concrete Universe Entities (Instantiated from 1st-Class Blueprints)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(100),
    description TEXT,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dynamic values, 2nd-class objects & 1st-class entity IDs
    computed_formulas JSONB NOT NULL DEFAULT '{}'::jsonb, -- Evaluated math formula cache
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, deceased, destroyed, sealed
    last_mutated_seq INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inter-Entity Relational Graph (e.g. Master -> Disciple, Wielder -> Weapon, Member -> Sect)
CREATE TABLE entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- master, apprentice, rival, ally, wielder, member, sovereign
    is_bidirectional BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_relationship UNIQUE (project_id, source_entity_id, target_entity_id, relationship_type)
);
```

### 3.3. Event Sourcing & Timeline Mutations

```sql
-- Causal timeline events anchored to narrative or world milestones
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    anchor_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    narrative_sequence INT NOT NULL, -- order in author's storytelling
    chronological_timestamp BIGINT, -- in-universe timeline order (if applicable)
    importance_tier VARCHAR(20) NOT NULL DEFAULT 'standard', -- minor, standard, major, epoch
    causal_predecessors UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable state effects applied by an event
CREATE TABLE event_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    property_key VARCHAR(100) NOT NULL, -- e.g. 'cultivation.major_realm', 'status', 'equipped_weapon'
    operation VARCHAR(20) NOT NULL, -- SET, INCREMENT, APPEND, REMOVE, TRANSFER
    previous_value JSONB,
    new_value JSONB NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Point-in-time universe state snapshots (for O(1) state reconstruction)
CREATE TABLE state_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    snapshot_data JSONB NOT NULL, -- full folded entity state at this sequence
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_chapter_snapshot UNIQUE (project_id, chapter_id)
);
```

### 3.4. Continuity Rules & Invariant Validation

```sql
-- User-defined & system continuity rules
CREATE TABLE continuity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- status_invariant, possession_exclusive, power_tier_ladder, custom_predicate
    target_blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    predicate_expression JSONB NOT NULL, -- e.g. {"field": "status", "op": "NEQ", "value": "deceased"}
    severity VARCHAR(20) NOT NULL DEFAULT 'error', -- error, warning, info
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Detected continuity rule violations
CREATE TABLE rule_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES continuity_rules(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    violating_claim TEXT NOT NULL,
    canonical_baseline TEXT NOT NULL,
    causal_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    suggested_resolutions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_action VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

### 3.5. Vector Embeddings (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Semantic embeddings for scenes (prose chunks)
CREATE TABLE scene_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scene_chunk UNIQUE (scene_id, chunk_index)
);

-- Semantic embeddings for canonical entities
CREATE TABLE entity_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    profile_summary TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_entity_embedding UNIQUE (entity_id)
);
```

---

## 4. Indexing Strategy & Performance Optimizations

```sql
-- Multi-tenant compound indexes
CREATE INDEX idx_chapters_project_seq ON chapters(project_id, global_sequence_number);
CREATE INDEX idx_scenes_chapter_order ON scenes(chapter_id, order_index);
CREATE INDEX idx_blueprints_project_class ON blueprints(project_id, blueprint_class);
CREATE INDEX idx_blueprint_fields_bp ON blueprint_fields(blueprint_id, order_index);
CREATE INDEX idx_entities_project_bp ON entities(project_id, blueprint_id);
CREATE INDEX idx_events_project_narrative ON events(project_id, narrative_sequence);
CREATE INDEX idx_event_effects_entity_event ON event_effects(entity_id, event_id);
CREATE INDEX idx_rule_violations_scene_resolved ON rule_violations(scene_id, is_resolved);

-- JSONB GIN Indexes for high-speed dynamic attribute filtering
CREATE INDEX idx_entities_properties_gin ON entities USING gin (properties jsonb_path_ops);
CREATE INDEX idx_entities_computed_gin ON entities USING gin (computed_formulas jsonb_path_ops);
CREATE INDEX idx_event_effects_new_val_gin ON event_effects USING gin (new_value jsonb_path_ops);

-- HNSW Vector Indexes for cosine similarity search
CREATE INDEX idx_scene_embeddings_hnsw ON scene_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_entity_embeddings_hnsw ON entity_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 5. Event Sourcing State Folding Mechanics

To compute the authoritative state of an entity at chapter sequence $N$:

1. Retrieve the nearest state snapshot where `sequence_number <= N`.
2. Retrieve all `event_effects` from events between `snapshot.sequence_number` and $N$ ordered by `events.narrative_sequence ASC`.
3. Fold `event_effects` into the snapshot baseline:
   - `SET`: Overwrite target attribute (supports dot-notation path into `properties` JSONB).
   - `INCREMENT`: Add numeric `new_value` to current value.
   - `APPEND`: Append item to array attribute.
   - `REMOVE`: Remove item from array or nullify attribute.
   - `TRANSFER`: Change ownership or location reference.
4. Trigger AST formula engine recalculation to update `computed_formulas` JSONB cache.
5. Output the deterministic, explainable point-in-time universe state.
