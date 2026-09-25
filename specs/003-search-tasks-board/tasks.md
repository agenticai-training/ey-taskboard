---
description: "Task list for Search Tasks on the Board (EYTB-2)"
---

# Tasks: Search Tasks on the Board

**Input**: Design documents from `/specs/003-search-tasks-board/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tasks-search-api.md, quickstart.md

**Tests**: FR-011 requires same-layer tests for new search behaviour. Test tasks are included and MUST fail before implementation.

**Organization**: Tasks grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US5) for story-phase tasks only
- Include exact file paths in descriptions

## Path Conventions

- **Backends**: `backend-python/`, `backend-dotnet/`, `backend-java/` (disjoint trees — parallelize across stacks)
- **Frontend**: `frontend/src/`
- **Schema**: `database/schema.sql` (no change required for v1; optional index only if reviewed)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align implementers with the contract before touching code

- [X] T001 Review search contract and normalization rules in `specs/003-search-tasks-board/contracts/tasks-search-api.md` and `specs/003-search-tasks-board/data-model.md` (trim; inactive when empty/all-whitespace or trimmed length < 3; truncate to max 200 when trimmed length > 200; case-insensitive contains on title OR description OR assignee only)
- [X] T002 Confirm v1 search needs no `database/schema.sql` change per `specs/003-search-tasks-board/research.md` (defer optional index unless measured need)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend list signatures and in-memory fakes so all three backends can accept an optional search query

**⚠️ CRITICAL**: No user story work until this phase completes

- [X] T003 [P] Extend `FakeTaskRepository.list` in `backend-python/tests/conftest.py` to accept an optional normalized search string and filter with case-insensitive OR contains on `title`, `description`, and `assignee` (null/empty description or assignee do not match)
- [X] T004 [P] Extend `TaskRepositoryProtocol.list` signature in `backend-python/services/task_service.py` to accept optional normalized search query
- [X] T005 [P] Extend `ITaskService.ListAsync` and `ITaskRepository` list method signatures in `backend-dotnet/src/TaskBoard.Api/Services/ITaskService.cs` and `backend-dotnet/src/TaskBoard.Api/Repositories/ITaskRepository.cs` for optional search query
- [X] T006 [P] Extend `TaskService.list` and `TaskRepository` list method signatures in `backend-java/src/main/java/com/honeywell/taskboard/service/TaskService.java` and `backend-java/src/main/java/com/honeywell/taskboard/repository/TaskRepository.java` for optional search query

**Checkpoint**: Repository/service interfaces and Python fake accept optional `q`; user story implementation can begin

---

## Phase 3: User Story 1 - Find a task by typing a search query (Priority: P1) 🎯 MVP

**Goal**: Server-side search on `GET /api/tasks?q=` across all three backends; board shows a search control and fetches matching tasks into the correct columns

**Independent Test**: With several tasks differing in title, description, and assignee, enter a partial query (≥ 3 chars after trim) matching one field on one task; only matching tasks remain visible in their columns with correct counts

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Add failing API tests in `backend-python/tests/test_tasks_api.py` for `GET /api/tasks?q=` — case-insensitive contains match (e.g. `wire` matches "Wire up the board UI"), OR match on title/description/assignee, full stored description match, inactive `q` (missing/whitespace/under 3 chars) returns unfiltered list, truncation at 200 chars
- [X] T008 [P] [US1] Add failing service tests in `backend-python/tests/test_task_service.py` for `_normalize`/`list_tasks` query rules (trim; length < 3 → inactive; length > 200 → truncate to 200) and repository delegation with effective query
- [X] T009 [P] [US1] Add failing controller tests in `backend-dotnet/tests/TaskBoard.Api.Tests/TasksControllerTests.cs` for optional `q` query parameter passthrough and `422` preservation for unknown status
- [X] T010 [P] [US1] Add failing service tests in `backend-dotnet/tests/TaskBoard.Api.Tests/TaskServiceTests.cs` for query normalization and contains matching behaviour
- [X] T011 [P] [US1] Add failing controller tests in `backend-java/src/test/java/com/honeywell/taskboard/web/TaskControllerTest.java` for optional `q` parameter and unknown-status `422`
- [X] T012 [P] [US1] Add failing service tests in `backend-java/src/test/java/com/honeywell/taskboard/service/TaskServiceImplTest.java` for query normalization and contains matching behaviour
- [X] T013 [P] [US1] Add failing tests in `frontend/src/services/__tests__/taskService.test.js` that `listTasks(status, q)` sends `params.q` only when effective query is active (trim; ≥ 3 chars; truncate to ≤ 200) and omits `q` when inactive

### Implementation for User Story 1

- [X] T014 [P] [US1] Add query normalization helper in `backend-python/services/task_service.py` — trim leading/trailing whitespace; empty/all-whitespace or trimmed length < 3 → inactive (no search); trimmed length > 200 → truncate to first 200 characters
- [X] T015 [US1] Implement case-insensitive OR contains SQL filter on `title`, `description`, and `assignee` in `backend-python/repositories/task_repository.py` (use full stored description; do not match id, status, comments, or timestamps)
- [X] T016 [US1] Wire optional `q` Query param through `list_tasks` in `backend-python/routers/tasks.py` and `backend-python/services/task_service.py`
- [X] T017 [P] [US1] Add query normalization in `backend-dotnet/src/TaskBoard.Api/Services/TaskService.cs` with the same trim/min-3/max-200-truncate rules
- [X] T018 [US1] Implement EF contains / case-insensitive filter in `backend-dotnet/src/TaskBoard.Api/Repositories/TaskRepository.cs`
- [X] T019 [US1] Add optional `[FromQuery] string? q` to `List` in `backend-dotnet/src/TaskBoard.Api/Controllers/TasksController.cs` and pass through service
- [X] T020 [P] [US1] Add query normalization in `backend-java/src/main/java/com/honeywell/taskboard/service/TaskServiceImpl.java` with the same trim/min-3/max-200-truncate rules
- [X] T021 [US1] Implement JPQL/SQL case-insensitive contains filter in `backend-java/src/main/java/com/honeywell/taskboard/repository/TaskRepository.java`
- [X] T022 [US1] Add optional `@RequestParam(required = false) String q` to list handler in `backend-java/src/main/java/com/honeywell/taskboard/web/TaskController.java`
- [X] T023 [P] [US1] Create presentational `SearchBox` in `frontend/src/components/SearchBox.jsx` with visible label, clear placeholder, controlled value, and one-action clear button (props in, callbacks out; no HTTP)
- [X] T024 [P] [US1] Extend `listTasks(status, q?)` in `frontend/src/services/taskService.js` to mirror server normalization client-side and send `params.q` only when effective query is active
- [X] T025 [US1] Add `query` page state, mount `SearchBox` beside `StatusFilter`, and pass active effective query into `refresh`/`taskService.listTasks` in `frontend/src/pages/BoardPage.jsx`
- [X] T026 [US1] Add search control and toolbar layout styles in `frontend/src/index.css`
- [X] T027 [P] [US1] Add render and clear-action tests in `frontend/src/components/__tests__/SearchBox.test.jsx`
- [X] T028 [US1] Extend `frontend/src/components/__tests__/BoardPage.test.jsx` to assert search control presence and that an active query triggers `listTasks` with `q`

**Checkpoint**: User Story 1 independently testable — search finds tasks by title/description/assignee on all stacks and in the UI

---

## Phase 4: User Story 2 - Combine search with the status filter (Priority: P1)

**Goal**: Status filter and active search apply together (intersection); matching tasks stay in the correct column; column counts reflect the visible set

**Independent Test**: Set status filter to "In Progress" and enter an assignee fragment; only in-progress tasks matching the query appear in the In Progress column with counts matching the visible set

### Tests for User Story 2 ⚠️

- [X] T029 [P] [US2] Add failing API test in `backend-python/tests/test_tasks_api.py` for `GET /api/tasks?status=in-progress&q=…` returning only tasks matching **both** constraints
- [X] T030 [P] [US2] Add failing service test in `backend-dotnet/tests/TaskBoard.Api.Tests/TaskServiceTests.cs` for status + search intersection
- [X] T031 [P] [US2] Add failing service test in `backend-java/src/test/java/com/honeywell/taskboard/service/TaskServiceImplTest.java` for status + search intersection

### Implementation for User Story 2

- [X] T032 [US2] Ensure `backend-python/repositories/task_repository.py` applies status filter **and** search filter together when both are present
- [X] T033 [US2] Ensure `backend-dotnet/src/TaskBoard.Api/Repositories/TaskRepository.cs` applies status filter **and** search filter together when both are present
- [X] T034 [US2] Ensure `backend-java/src/main/java/com/honeywell/taskboard/repository/TaskRepository.java` applies status filter **and** search filter together when both are present
- [X] T035 [US2] Ensure `frontend/src/pages/BoardPage.jsx` always passes both `filter` and active effective query to `taskService.listTasks` on refresh
- [X] T036 [US2] Ensure column counts in `frontend/src/components/TaskList.jsx` reflect tasks returned from the server (no client-only re-filter that drops server search results)

**Checkpoint**: User Stories 1 and 2 both work — search composes with status filter

---

## Phase 5: User Story 3 - Clear search and restore the status-filter view (Priority: P2)

**Goal**: Empty or inactive query (trimmed length < 3) turns search off; board shows status-filter-only results; existing create/move/delete/comments/status-filter behaviour unchanged with empty search

**Independent Test**: With an active query, clear it (or type fewer than 3 characters); board matches status-filter-only view; create/move/delete/comments/status filter still succeed with empty search box

### Tests for User Story 3 ⚠️

- [X] T037 [P] [US3] Add failing API tests in `backend-python/tests/test_tasks_api.py` confirming inactive `q` values (`ab`, whitespace-only) behave like omitting `q` (status-only list, not an error)
- [X] T038 [P] [US3] Add failing tests in `frontend/src/services/__tests__/taskService.test.js` that inactive client query omits `params.q` from the request
- [X] T039 [US3] Add failing test in `frontend/src/components/__tests__/BoardPage.test.jsx` that clearing the query refetches without `q` and restores status-filter-only results

### Implementation for User Story 3

- [X] T040 [US3] Wire `SearchBox` clear control and sub-3-character input in `frontend/src/components/SearchBox.jsx` and `frontend/src/pages/BoardPage.jsx` to reset inactive query and refetch promptly without `q`
- [X] T041 [US3] Extend `frontend/src/components/__tests__/BoardPage.test.jsx` (or add cases) verifying create, move, delete, comments, and status filter still work when search box is empty

**Checkpoint**: Clearing or deactivating search restores prior board behaviour with no regressions

---

## Phase 6: User Story 4 - Understand when nothing matches (Priority: P2)

**Goal**: Active query with zero matches shows board-level **"No tasks match your search"** above columns and hides per-column **"No tasks yet"**; ordinary empty-column copy remains when search is off

**Independent Test**: Enter a query matching no tasks; see board-level no-match message above columns and no per-column "No tasks yet"; with search off, empty columns still show "No tasks yet"

### Tests for User Story 4 ⚠️

- [X] T042 [P] [US4] Add failing API test in `backend-python/tests/test_tasks_api.py` that active `q` with no matches returns `200` and empty JSON array (not `404`)
- [X] T043 [P] [US4] Add failing tests in `frontend/src/components/__tests__/TaskList.test.jsx` for board-level "No tasks match your search" when `searchActive` and no tasks, and per-column "No tasks yet" hidden in that state

### Implementation for User Story 4

- [X] T044 [US4] Render board-level **"No tasks match your search"** above columns in `frontend/src/components/TaskList.jsx` when search is active and the task list is empty
- [X] T045 [US4] Suppress per-column **"No tasks yet"** in `frontend/src/components/TaskList.jsx` while global no-match search is active; keep usual empty-column copy when search is off
- [X] T046 [US4] Add no-match empty-state styles in `frontend/src/index.css`
- [X] T047 [US4] Pass `searchActive` (effective query ≥ 3 after trim) from `frontend/src/pages/BoardPage.jsx` into `TaskList`

**Checkpoint**: No-match state is visually distinct from ordinary empty columns

---

## Phase 7: User Story 5 - Keep the query while using the board (Priority: P3)

**Goal**: Query survives in-session board refresh from create/move/delete; full page reload does not restore query; typing feels immediate via light debounce

**Independent Test**: Enter a query, create/move/delete a task — query stays applied; reload page — search box starts empty; query changes update visible results quickly

### Tests for User Story 5 ⚠️

- [X] T048 [P] [US5] Add failing test in `frontend/src/components/__tests__/BoardPage.test.jsx` that active query remains applied after create/move/delete refresh
- [X] T049 [P] [US5] Add failing test in `frontend/src/components/__tests__/BoardPage.test.jsx` that initial mount after simulated full reload does not restore a previous query (no URL/localStorage persistence)

### Implementation for User Story 5

- [X] T050 [US5] Include active effective query in `refresh` `useCallback` dependencies in `frontend/src/pages/BoardPage.jsx` so create/move/delete re-fetch with the same query (FR-008)
- [X] T051 [US5] Add ~200–300 ms debounce in `frontend/src/pages/BoardPage.jsx` when effective query is active; refetch immediately when query cleared or drops below 3 characters
- [X] T052 [US5] Confirm `frontend/src/pages/BoardPage.jsx` does not read or write query from URL or `localStorage` on mount (FR-017)

**Checkpoint**: Query lifetime and responsiveness match spec across board mutations and reload

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify all stacks, contract parity, and manual quickstart scenarios

- [X] T053 [P] Run `dotnet test` in `backend-dotnet/` and fix any search-related failures
- [X] T054 [P] Run `pytest` in `backend-python/` and fix any search-related failures
- [X] T055 [P] Run `./mvnw -B test` in `backend-java/` and fix any search-related failures
- [X] T056 [P] Run `npm test -- --run` in `frontend/` and fix any search-related failures
- [X] T057 Validate HTTP scenarios in `specs/003-search-tasks-board/quickstart.md` §3 against one running backend (contains match, status+q intersection, inactive q, unknown status `422`)
- [X] T058 Validate board UI scenarios in `specs/003-search-tasks-board/quickstart.md` §4 (control placement, no-match message, clear/restore, query persistence, reload behaviour)
- [X] T059 Confirm no unauthorized schema or migration changes outside `database/schema.sql` and that `created_at`/`updated_at` remain DB-owned

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phases 3–7)**: Depend on Foundational completion
  - **US1 (Phase 3)**: MVP — complete first
  - **US2 (Phase 4)**: Depends on US1 backend list+search existing; independently testable once US1 lands
  - **US3 (Phase 5)**: Depends on US1 frontend search control; can overlap US2 backend work
  - **US4 (Phase 6)**: Depends on US1 fetch-with-`q`; can start once BoardPage passes `searchActive`
  - **US5 (Phase 7)**: Depends on US1 BoardPage query state; extends refresh/debounce behaviour
- **Polish (Phase 8)**: Depends on desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends on | Independent test |
|-------|----------|------------|------------------|
| US1 | P1 | Foundational | Partial query matches one task field; results in correct columns |
| US2 | P1 | US1 list+search | Status + query intersection; counts match visible set |
| US3 | P2 | US1 search UI | Clear/inactive query restores status-only view; no regressions |
| US4 | P2 | US1 fetch | No-match board message; per-column empty copy suppressed |
| US5 | P3 | US1 query state | Query survives mutations; not restored on reload |

### Within Each User Story

- Tests MUST be written and fail before implementation
- Service normalization before repository SQL
- Repository before controller/router wiring
- Backend stacks (`backend-python/`, `backend-dotnet/`, `backend-java/`) are disjoint — parallelize across stacks after Foundational
- Frontend: `taskService.js` before `BoardPage.jsx`; presentational `SearchBox` before page integration

### Parallel Opportunities

- **Phase 2**: T003–T006 across three backends + Python fake (four files, no cross-deps)
- **Phase 3 tests**: T007–T013 in parallel across stacks and frontend service tests
- **Phase 3 implementation**: T014–T022 backend stacks in parallel; T023–T024 frontend in parallel with backends once T025 waits on T023–T024
- **Phase 4–7**: Backend intersection/empty-state tests (T029–T031, T037, T042) parallel across stacks
- **Phase 8**: T053–T056 test suites in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all backend test tasks together:
Task T007: backend-python/tests/test_tasks_api.py
Task T009: backend-dotnet/tests/TaskBoard.Api.Tests/TasksControllerTests.cs
Task T011: backend-java/.../TaskControllerTest.java

# Launch all three backend implementations together (after tests fail):
Task T014–T016: backend-python/
Task T017–T019: backend-dotnet/
Task T020–T022: backend-java/

# Frontend in parallel with backends:
Task T023: frontend/src/components/SearchBox.jsx
Task T024: frontend/src/services/taskService.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (tests → backend ×3 → frontend)
4. **STOP and VALIDATE**: Run stack tests; manually verify search finds tasks on the board
5. Demo MVP before US2–US5

### Incremental Delivery

1. Setup + Foundational → interfaces and fakes ready
2. US1 → server search + search control (MVP)
3. US2 → status + search composition
4. US3 → clear/inactive query + regression safety
5. US4 → no-match empty state
6. US5 → query persistence and debounce
7. Polish → full suite green + quickstart validation

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Python backend (T007–T008, T014–T016)
   - Developer B: .NET backend (T009–T010, T017–T019)
   - Developer C: Java backend (T011–T012, T020–T022)
   - Developer D: Frontend US1 (T013, T023–T028)
3. Merge US1, then split US2–US5 by story ownership

---

## Notes

- Query parameter name is **`q`** on `GET /api/tasks` per `contracts/tasks-search-api.md`
- Normalization rules MUST match on client and all backends: trim; inactive when empty/all-whitespace or trimmed length < 3; truncate to 200 when trimmed length > 200
- Search MUST NOT match comments, id, status text, or timestamps (FR-012)
- Unknown `status` remains `422`; inactive or over-long `q` is never an error
- Layering: HTTP in controller/router; normalization in service; SQL in repository; frontend HTTP only in `taskService.js`
- Playwright e2e is out of scope for this task list; unit/API suites stay in-memory per `.cursor/rules/tests.mdc`
