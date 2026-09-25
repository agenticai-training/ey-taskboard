# Quickstart: Search Tasks on the Board

Validate the feature end-to-end against [data-model.md](./data-model.md) and
[contracts/tasks-search-api.md](./contracts/tasks-search-api.md). Use one backend
at a time.

## Prerequisites

- PostgreSQL with database `taskboard`
- Schema already applied (`database/schema.sql`); no new table required for search
- One backend running (Python `:8000`, .NET `:5088`, or Java `:8080`)
- Frontend at `http://localhost:5173` pointed at that backend via a local env
  file copied from `frontend/.env.example` (do not commit secrets)

## 1. Seed data (optional but useful)

```bash
psql "postgresql://postgres:postgres@localhost:5432/taskboard" -f database/seed.sql
```

Ensure at least a few tasks differ in title, description, and assignee so
contains-search is observable.

## 2. Automated suites

After same-layer tests exist for the new list behaviour:

```bash
cd backend-dotnet && dotnet test
cd backend-python && pytest
cd backend-java && ./mvnw -B test
cd frontend && npm test -- --run
```

Backend list/search tests MUST cover: contains match, field OR, composition
with `status`, inactive `q`, and unknown status `422`. Suites MUST NOT use a
real database. Frontend tests MUST cover service params, search control/clear,
and the no-match empty state.

## 3. HTTP checks (replace host/port for the backend you started)

```bash
# Baseline list
curl -s 'http://localhost:8000/api/tasks'

# Partial title match (expect matching tasks only)
curl -s 'http://localhost:8000/api/tasks?q=wire'

# Status + search intersection
curl -s 'http://localhost:8000/api/tasks?status=in-progress&q=ana'

# Inactive q (too short) → full list for that filter (not an error)
curl -s 'http://localhost:8000/api/tasks?q=ab'

# Unknown status → 422
curl -s -o /dev/null -w "%{http_code}\n" \
  'http://localhost:8000/api/tasks?status=nope&q=wire'
```

Expect: `200` arrays; empty array when nothing matches; JSON task shape
unchanged aside from which rows are returned.

## 4. Board UI

1. Open the board. A search control appears near the status filter with a
   visible label, placeholder, and one-action clear.
2. Type an active query (≥ 3 characters after trim). Matching cards remain in
   the correct columns; counts match what is shown.
3. Combine with status filter (e.g. In Progress + assignee fragment). Only the
   intersection remains.
4. Enter a query with no matches → board-level **"No tasks match your search"**
   above the columns; per-column **"No tasks yet"** is hidden.
5. Clear the query (or leave &lt; 3 characters) → status-filter-only view;
   empty columns show **"No tasks yet"** again.
6. With an active query, create/move/delete a task → query remains applied.
7. Full page reload → search box starts empty (query not restored).
8. With an empty search box, create/move/delete, comments, and status filter
   still work as before.

## 5. Definition of done (manual)

Acceptance scenarios in [spec.md](./spec.md) satisfied; suites in §2 green;
brief/Jira link remains the product source
(`.specify/jira/EYTB-2.md` / `docs/feature-task-search.md`).
