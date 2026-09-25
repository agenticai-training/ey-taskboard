# Implementation Plan: Search Tasks on the Board

**Branch**: `003-search-tasks-board` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-search-tasks-board/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add board search so engineers can find tasks by title, description, or assignee
without scanning every card. Search is a **server query** on `GET /api/tasks`
via a shared `q` parameter on all three backends: case-insensitive substring
(contains) match on those three fields (full stored description). Trim,
minimum 3 characters, max 200 (truncate); inactive query = status-filter-only.
Frontend adds a presentational search control beside the status filter;
`BoardPage` owns query state (page-only, not restored on full reload) and
passes the active query through `taskService.listTasks`. No-match shows
board-level "No tasks match your search" and hides per-column "No tasks yet".

## Technical Context

**Language/Version**: Python 3.11+, .NET 8, Java 21, JavaScript (React 19 / Vite 8)

**Primary Dependencies**: FastAPI + SQLAlchemy (async); ASP.NET Core + EF Core
(Npgsql); Spring Boot + Spring Data JPA; React 19, Axios, Vitest + Testing Library

**Storage**: PostgreSQL 15+; schema owned by `database/schema.sql` only (no new
tables required for search; optional index only if reviewed)

**Testing**: pytest + httpx; xUnit + WebApplicationFactory; JUnit 5 + MockMvc;
Vitest + Testing Library. In-memory / fakes only — no real database in unit/API
tests. Playwright e2e (separate suite) may hit a real DB later.

**Target Platform**: Local web app (frontend :5173, one backend :8000 / :5088 /
:8080)

**Project Type**: Web application (React SPA + three interchangeable REST
backends)

**Performance Goals**: Interactive filtering on a typical team-sized board
(SC-007); no separate results page; light client debounce so typing still feels
immediate

**Constraints**: Layered architecture; identical REST contract across backends
(timestamp key casing excepted); error codes only `404` / `422` for existing
cases; unknown status still `422`; no CSS framework; no auth; no fuzzy/ranked
search; query not persisted across full page reload; `created_at` /
`updated_at` never client-set

**Scale/Scope**: Training Kanban (seed-scale tasks); extend existing task list
endpoint + board toolbar; three backends + frontend; no new entity tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | How this plan complies |
|------|--------|------------------------|
| I. Layered Architecture | PASS | Controllers/routers map optional `q` only. Service normalizes query (trim, min 3, truncate 200) and validates status. Repository owns SQL/`ILIKE`/`LIKE` contains filters. Frontend: presentational search control; `BoardPage` owns state/fetch; HTTP only in `taskService.js`. |
| II. Shared REST Contract | PASS | Same `GET /api/tasks?status=&q=` semantics, match fields, and JSON task shape on Python/.NET/Java. Only allowed drift: snake_case vs camelCase timestamp/count keys. |
| III. Test-First Endpoints | PASS | List behaviour with `q` is not done until same-layer tests cover match/no-match, composition with `status`, inactive query (omit/`q` ignored), and existing unknown-status `422`. Fakes/fixtures only. Frontend tests for control, inactive rules, and no-match empty state. |
| IV. Single Schema Ownership | PASS | No new tables. Any optional search-related index lands only in `database/schema.sql`. No EF migrations, `create_all()`, or `ddl-auto` other than `none`. Timestamps remain DB-owned. |
| V. Simplicity | PASS | Extend existing list path and board toolbar; prefer editing `taskService`, `BoardPage`, `TaskList`, and existing task repositories/services. No new HTTP status codes, UI frameworks, fuzzy engines, or URL/storage persistence. |
| Error contract | PASS | Unknown `status` → `422`. Missing id → `404`. Inactive or truncated `q` is not an error. |
| Quality gates | PASS | `dotnet test`, `pytest`, `./mvnw -B test`, `npm test -- --run` must pass for touched stacks. |

Post-design re-check: still PASS. [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/tasks-search-api.md](./contracts/tasks-search-api.md),
and [quickstart.md](./quickstart.md) do not skip layers, fork the JSON shape,
or move schema out of `schema.sql`.

## Project Structure

### Documentation (this feature)

```text
specs/003-search-tasks-board/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tasks-search-api.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
database/
├── schema.sql           # NO required change; optional reviewed index only if justified
└── seed.sql             # unchanged (use existing seed for manual checks)

backend-python/
├── routers/tasks.py     # EXTEND list (and optionally document) Query `q`
├── services/task_service.py   # EXTEND normalize `q`; pass effective query to repo
├── repositories/task_repository.py  # EXTEND list filter: OR contains on title/description/assignee
└── tests/               # EXTEND API + service + fake repo for search

backend-dotnet/src/TaskBoard.Api/
├── Controllers/TasksController.cs
├── Services/            # normalize `q`
├── Repositories/        # EF contains / ILIKE-equivalent filter
└── …
backend-dotnet/tests/TaskBoard.Api.Tests/

backend-java/src/main/java/com/honeywell/taskboard/
├── web/TaskController.java
├── service/             # normalize `q`
├── repository/          # JPQL/SQL contains filter
└── …
backend-java/src/test/java/com/honeywell/taskboard/

frontend/src/
├── components/SearchBox.jsx     # ADD presentational search control (or equivalent)
├── components/TaskList.jsx      # EXTEND no-match empty-state behaviour
├── pages/BoardPage.jsx          # ADD query state; refresh with filter + active `q`
├── services/taskService.js      # EXTEND listTasks to send `q` when active
├── index.css                    # ADD search + board-level empty styles
└── **/__tests__/                # service, page, list, search control behaviour
```

**Structure Decision**: Existing web-app layout (three backends + `frontend/` +
`database/`). No new top-level projects. Search extends the current task list
endpoint and board toolbar; no second collection or results page.

## Complexity Tracking

> No constitution violations. Table left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
