# NovWrite

A backend-first world-building platform for cultivation novels, fantasy worlds, and RPGs.

NovWrite provides a scalable database architecture for managing complex fictional universes, including characters, cultivation systems, organizations, locations, techniques, items, historical events, wars, battles, and custom calendars.

The project is designed around modularity, strong validation, and long-term maintainability.

---

## Features

- 📚 Character management
- 🌱 Cultivation progression
- ⚡ Spirit Roots, Bloodlines & Physiques
- 🏛 Organizations & Occupations
- 🗺 Locations & Regions
- ⚔ Techniques & Combat
- 🎒 Inventory & Items
- 📜 Historical Events
- ⚔ Wars & Battles
- 👑 Titles
- 📅 Custom cultivation calendar
- 🧩 Modular Prisma schema
- ✅ Runtime validation with Zod

---

## Tech Stack

- Next.js
- TypeScript
- Prisma ORM
- MongoDB
- Zod
- React
- TanStack Query
- shadcn/ui

---

## Architecture

```text
           Prisma Schema
                 │
                 ▼
         Zod Validation Layer
                 │
                 ▼
          REST API Endpoints
                 │
                 ▼
          React Frontend
                 │
                 ▼
              MongoDB
```

---

## Development Workflow

```text
Prisma Models
      ↓
Zod Validation
      ↓
REST API
      ↓
Frontend
```

Each layer acts as the contract for the next, minimizing duplication and making refactoring easier.

---

## Validation

Every Prisma model has dedicated validation schemas.

```text
create<Model>Schema
update<Model>Schema
```

Shared validators live in:

```text
src/validation/common
```

including:

- ObjectId
- Pagination
- World Date
- Calendar
- Number Validators
- String Validators
- Cultivation Validators

---

## Database Domains

- Characters
- Cultivation
- Realms
- Species
- Organizations
- Occupations
- Titles
- Locations
- Techniques
- Items
- Crafting
- Historical Events
- Wars
- Battles
- Relationships

---

## Roadmap

### Database

- [x] Modular Prisma schema
- [x] Unified cultivation realm architecture
- [ ] Complete database implementation

### Validation

- [x] Shared validation infrastructure
- [x] Complete model validation

### API

- [ ] Generic CRUD framework
- [ ] REST API
- [ ] Search
- [ ] Pagination
- [ ] Filtering

### Frontend

- [ ] Dashboard
- [ ] Character Management
- [ ] Organization Management
- [ ] World Explorer
- [ ] Timeline Viewer

---

## Goals

- Strong type safety
- Runtime validation
- Modular architecture
- Maintainable codebase
- Scalable world-building backend
- Minimal code duplication

