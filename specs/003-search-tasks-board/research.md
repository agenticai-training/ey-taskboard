# Research: Search Tasks on the Board

## 1. Server query vs client-only filter

**Decision**: Server query — extend `GET /api/tasks` with optional `q` on all
three backends. The frontend sends the active query via `taskService.listTasks`
and does not implement a client-only filter of an already-loaded full list as
the source of truth.

**Rationale**: Spec Clarifications and FR-014. Match rules stay in
service/repository so stacks stay interchangeable and description matching
uses the full stored value even when the card truncates UI text.

**Alternatives considered**:

- Client-only filter of loaded tasks — rejected by clarify session; would miss
  server-side consistency and could diverge across refreshes.
- Dedicated `/api/tasks/search` resource — extra surface; list already supports
  `status` filtering.

## 2. Query parameter name and composition

**Decision**: Optional query string parameter **`q`** on `GET /api/tasks`,
composable with existing optional **`status`**.

| Param | Meaning when present |
|-------|----------------------|
| `status` | Exact status filter (`todo` \| `in-progress` \| `done`); unknown → `422` |
| `q` | Search text after server-side normalization (see §3) |

Both apply as an intersection when both are active. Omit `q` (or send an
inactive value that normalizes to no-search) for status-only behaviour.

**Rationale**: Spec left the HTTP name to planning; `q` is short, conventional,
and does not collide with task fields. Matches "same query parameters" across
stacks (FR-014).

**Alternatives considered**:

- `search` / `query` — clearer but longer; no behavioural gain.
- Extending `GET /api/tasks/count` with `q` — board column counts come from the
  visible list payload, not `/count`. Leave `/count` status-only for simplicity
  (constitution V). Implementers MAY add `q` later for parity if needed; not
  required by this feature.

## 3. Query normalization (client and server)

**Decision**: Shared effective-query rules on frontend (before sending) and
backend service (before repository):

1. Trim leading/trailing whitespace.
2. If empty, all-whitespace, or length **&lt; 3** after trim → search **off**
   (treat as no `q`; do not error).
3. If length **&gt; 200** after trim → **truncate** to 200 characters (do not
   `422`).
4. Active effective query is used for case-insensitive contains matching.

**Rationale**: Spec Clarifications / FR-006. Truncate (not reject) avoids a new
error code and matches the clarify default. Dual normalization keeps a
misbehaving client from bypassing min/max rules.

**Alternatives considered**:

- `422` on over-length — invents a new failure mode for search; rejected.
- Client-only trim — backends could diverge if another client appears.

## 4. Match semantics and SQL placement

**Decision**: Case-insensitive **substring / contains** on `title`,
`description`, and `assignee` (OR). Match the full stored description.
Repository applies the SQL/`ILIKE` (or equivalent) filter; service only
normalizes and decides whether to pass a query. Null or empty field values do
not match. Do not search comments, id, status text, or timestamps.

**Rationale**: FR-003, FR-004, FR-012, FR-016. Constitution I — SQL stays in
the repository; service owns validation/normalization.

**Alternatives considered**:

- Fuzzy / ranked / stemming — out of scope (FR-013).
- Filtering in the controller — layer violation.
- Loading all rows then filtering in the service — skips repository SQL and
  scales poorly; rejected for the server-query design.

## 5. Schema and indexes

**Decision**: No schema change required. Do **not** add a trigram/GIN index in
v1; training/seed-scale boards are small enough for `ILIKE '%…%'` / equivalent.
An index is allowed only as a later reviewed edit to `database/schema.sql` if
measured need appears.

**Rationale**: Constitution IV and V. Leading-wildcard substring search does
not use a plain btree on those columns; adding `pg_trgm` increases ops surface
without a stated scale requirement.

**Alternatives considered**: `pg_trgm` GIN indexes — useful at larger scale;
deferred.

## 6. Frontend state, debounce, and empty UI

**Decision**:

- Presentational search control in the toolbar near `StatusFilter` (label,
  placeholder, one-action clear). Prefer a small new `SearchBox` component over
  bloating `StatusFilter`.
- `BoardPage` owns `query` string state (page state only). Full page reload
  does **not** restore it (no URL sync, no `localStorage`).
- `refresh` / `listTasks` dependencies include filter **and** the **active**
  effective query so create/move/delete keep the query applied (FR-008).
- Light debounce (~200–300 ms) when the effective query is active to avoid a
  request per keystroke while still feeling immediate (SC-007). Clearing or
  dropping below 3 characters should refetch promptly (search off).
- When search is active and the returned list is empty: show board-level
  **"No tasks match your search"** above the columns; hide per-column
  **"No tasks yet"** for that state. Otherwise keep today's empty-column copy.

**Rationale**: Spec user stories 1, 4, 5 and FR-001, FR-007, FR-017.
Constitution frontend layering and plain CSS only.

**Alternatives considered**:

- URL query persistence — rejected by clarify default (no restore on reload).
- Zero debounce — more load while typing; still acceptable at seed scale, but
  light debounce better matches "immediate" without thrashing.
- Replacing column empty copy with the no-match string inside each column —
  rejected; copy must sit above columns.

## 7. Testing approach

**Decision**: Same-layer tests before done (FR-011):

- Backend API/service: contains match (case-insensitive), OR across fields,
  composition with `status`, inactive `q` (missing / whitespace / &lt;3 chars),
  truncation behaviour or equivalent fixture, unknown status still `422`.
- In-memory fakes must accept the new list signature.
- Frontend: `listTasks` sends `q` only when active; board shows control + clear;
  no-match empty state; empty query preserves existing board behaviour.

**Rationale**: Constitution III and `.cursor/rules/tests.mdc`. Playwright remains
a later e2e step, not part of this plan’s unit/API gate.

**Alternatives considered**: E2e-only coverage — too late and violates
test-first endpoint rule for the list change.
