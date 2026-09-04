# ADR 0001: Initial Technical Architecture Baseline

- **Status:** Accepted
- **Date:** 2026-09-03
- **Deciders:** Core Engineering Team

---

## Context

NovWrite requires a backend architecture capable of handling:

1. High-throughput prose drafting, real-time typing state, and AI grounding queries.
2. Highly customizable fictional universe schemas (characters, power realms, custom entities, relationship scales) without rigid database schema migrations per genre.
3. Event-sourced historical state queries to evaluate complex continuity rules across hundreds of chapters.
4. Single-node VPS deployment with future horizontal scaling capabilities.

---

## Decision

1. **Modular Monolith in Go:** The primary API and continuity rules engine will be authored in Go (`go-chi/chi`), enforcing Dependency Injection for testability and high-performance in-memory state evaluation.
2. **TypeScript + Prisma Data Service:** Database persistence operations, schema migrations, and JSONB mapping will be encapsulated in a TypeScript micro-service communicating with the Go application via coarse-grained gRPC.
3. **PostgreSQL 18 + JSONB + pgvector:** PostgreSQL is the canonical source of truth, utilizing JSONB for author-defined dynamic schemas and `pgvector` for semantic context retrieval.
4. **Event-Sourced State Mutations:** Universe states are derived through sequential `EventEffect` applications over timeline events.
5. **Traefik + Docker Compose:** Local and production environments are containerized and routed via Traefik with automated TLS.

---

## Consequences

### Positive

- **Deterministic Continuity:** World rules and state transitions are decoupled from LLM hallucinations.
- **Genre Agnostic:** Authors have full freedom to define custom power systems, properties, and relationship metrics.
- **Fast Test Execution:** Domain services and continuity verification can be tested in milliseconds using mock repositories.

### Negative / Trade-offs

- Two language runtimes (Go and TypeScript) in the backend require dual toolchains and gRPC contract maintenance.
- Event sourcing state reconstruction requires snapshotting strategies for novels exceeding thousands of scenes.
