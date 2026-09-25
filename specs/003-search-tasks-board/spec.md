# Feature Specification: Search Tasks on the Board

**Feature Branch**: `003-search-tasks-board`

**Created**: 2026-09-24

**Status**: Draft

**Input**: Jira EYTB-2 — "Search tasks on the board by title, description, and assignee". Source brief: `.specify/jira/EYTB-2.md` (from `docs/feature-task-search.md`). As an engineer or team lead using the task board, I want to search tasks by title, description, or assignee so that I can find one task without scanning every card once a column fills up. Search composes with the existing status filter. Existing create, move, delete, comments, and status-filter behaviour stays when the search box is empty.

## Clarifications

### Session 2026-09-24

- Q: Should search run as a server query on the task list, or filter tasks already loaded on the board? → A: Server query — backends accept a search parameter on the task list; match rules live in the service/repository on all three stacks.
- Q: What match semantics should search use (user clarification during description-visibility question)? → A: Keyword or contains search (substring/contains match; not fuzzy, ranked, or synonym-based).
- Q: When the card truncates or hides part of the description, should search still match against the full description stored on the task? → A: Yes — match the full stored description (including text not shown on the card).
- Q: How should leading/trailing spaces and an all-whitespace query be treated? → A: Trim leading/trailing spaces; all-whitespace counts as empty (search off).
- Q: What is the minimum query length, if any, before a search runs? → A: Minimum 3 characters after trim; shorter effective queries mean search is off.
- Q: What exact no-match empty-state copy should appear, and how should it relate to the per-column "No tasks yet" message? → A: Board-level "No tasks match your search" above the columns; hide per-column "No tasks yet" while no-match search is active.
- Q: Is there a maximum query length, and what happens when it is exceeded? → A: **Default (clarify quota)** — maximum 200 characters after trim; longer input is truncated to 200 before matching (same rule on client and all backends).
- Q: Should the current query be restored after a full page reload? → A: **Default (clarify quota)** — No; the query is not restored after a full page reload (page state only). It still survives in-session board data refresh from create, move, or delete per FR-008.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a task by typing a search query (Priority: P1)

An engineer or team lead opens the board, sees a search control with the other board controls (near the status filter and refresh), types part of a title, description, or assignee name, and only matching cards remain visible—still in the correct status columns. Matching is case-insensitive keyword / contains search (for example, "wire" finds "Wire up the board UI"). A match on any of title, description, or assignee is enough. Results update on the same board via a server query; there is no separate results page.

**Why this priority**: Locating a specific task without scanning every card is the core value of the story.

**Independent Test**: With several tasks that differ in title, description, and assignee, enter a partial query that matches one field on one task and confirm only matching tasks remain visible in their columns, with column counts reflecting what is shown.

**Acceptance Scenarios**:

1. **Given** the board is showing tasks, **When** the user looks at the board controls, **Then** a search control is present near the status filter and refresh, with a visible label, a clear placeholder, and a one-action way to clear the query.
2. **Given** a task titled "Wire up the board UI", **When** the user types "wire", **Then** that task is among the visible matches (case-insensitive, contains match).
3. **Given** tasks that match on title, description, or assignee respectively, **When** the user enters a query that matches only one of those fields on a given task, **Then** that task is shown; a match on any one field is enough.
4. **Given** an active search query (trimmed length at least 3), **When** results update, **Then** matching tasks stay in the correct status columns on the same board (no separate results page).

---

### User Story 2 - Combine search with the status filter (Priority: P1)

The user selects a status (for example "In Progress") and types a search query (for example an assignee name). The board shows only tasks that satisfy both the status filter and the search. Matching tasks remain in the right column. Column counts reflect the tasks currently shown.

**Why this priority**: The brief requires search to compose with the existing status filter; without that, search fights the current board model.

**Independent Test**: Apply a status filter and a query that further narrows the set; confirm only tasks matching both appear, in the correct column, with counts matching the visible set.

**Acceptance Scenarios**:

1. **Given** the status filter is set to "In Progress" and the user types an assignee name, **When** results update, **Then** only in-progress tasks for that person (matching the query) are shown, still in the In Progress column.
2. **Given** both a status filter and a search query are active, **When** the user views column counts, **Then** the counts reflect the tasks currently shown (both criteria applied).

---

### User Story 3 - Clear search and restore the status-filter view (Priority: P2)

When the search query is empty (or inactive after trim / under 3 characters), search is off: the board shows whatever the status filter alone would show. Create, move, delete, comments, and the status filter continue to work as before. The user can clear the query in one action.

**Why this priority**: Empty-query behaviour and no regression of existing board features are explicit acceptance criteria; they define safe default use.

**Independent Test**: With a query active, clear it (or leave it empty / under 3 characters) and confirm the board matches status-filter-only behaviour; exercise create/move/delete/comments/status filter with an empty search box.

**Acceptance Scenarios**:

1. **Given** an active search query, **When** the user clears the query with the one-action clear control (or the effective query is inactive), **Then** the board shows whatever the status filter alone would show.
2. **Given** an empty search box, **When** the user creates, moves, or deletes a task, uses comments, or changes the status filter, **Then** those behaviours work as they did before this feature.

---

### User Story 4 - Understand when nothing matches (Priority: P2)

When an active query yields no matching tasks, the board shows a board-level message **"No tasks match your search"** above the columns. While that no-match state is active, columns do not show their usual "No tasks yet" empty-column copy. When search is off or some columns have matches while others do not under an active filter, columns with no tasks continue to use their usual empty-column message.

**Why this priority**: The brief requires a dedicated no-match state so users do not confuse "no matches" with "empty column."

**Independent Test**: Enter a query that matches no tasks and confirm the board-level "No tasks match your search" message appears above the columns and per-column "No tasks yet" is hidden; with search off, empty columns still show "No tasks yet".

**Acceptance Scenarios**:

1. **Given** an active search query that matches no tasks, **When** results update, **Then** the user sees "No tasks match your search" above the columns, and per-column "No tasks yet" messages are not shown.
2. **Given** search is off (or not in the global no-match case) and a column has no tasks under the current status filter, **When** the user views that column, **Then** the usual empty-column message ("No tasks yet") remains available as today.

---

### User Story 5 - Keep the query while using the board (Priority: P3)

After the user enters a query, refreshing board data through create, move, or delete does not clear the query; it stays until the user clears or changes it. A full page reload does not restore the query. Results feel immediate for a typical team board.

**Why this priority**: Query lifetime across board mutations and immediacy are acceptance criteria; they improve usability once search exists.

**Independent Test**: Enter a query, create/move/delete a task, and confirm the query is still applied; reload the page and confirm the query is not restored; confirm updates feel immediate with no separate results navigation.

**Acceptance Scenarios**:

1. **Given** an active search query, **When** the user creates, moves, or deletes a task (board data refreshes), **Then** the query remains applied until the user clears or changes it.
2. **Given** a typical team board and an active query, **When** the user types or changes the query, **Then** visible results update quickly enough that finding a task feels immediate (no separate results page).
3. **Given** an active search query, **When** the user performs a full page reload, **Then** the query is not restored (search starts inactive).

---

### Edge Cases

- Empty / inactive query: search is off; board follows the status filter alone. Leading/trailing spaces are trimmed before evaluation; empty, only whitespace, or fewer than 3 characters after trim means search off.
- Maximum length: after trim, the effective query is capped at 200 characters; longer input is truncated to 200 before matching (client and backends).
- Query with no matches: board-level "No tasks match your search" above the columns; per-column "No tasks yet" is hidden while that state is active.
- Keyword / contains match (case-insensitive substring): "wire" matches "Wire up the board UI".
- Match on only one of title, description, or assignee is sufficient.
- Description matching uses the full stored description value, even when the card truncates or hides part of that text.
- Status filter and search both active: intersection of both; column placement and counts follow what is shown.
- Search does not use comments, id, status text, or timestamps.
- Fuzzy matching, typo tolerance, synonyms, stemming, and ranked relevance are out of scope.
- Search is a server query on the task list (not a client-only filter of already-loaded tasks); all three backends expose the same search parameter and match rules.
- Full page reload does not restore the query; in-session create/move/delete refresh does not clear it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The board MUST provide a search control with the board controls (near the status filter and refresh), including a visible label, a clear placeholder, and a one-action way to clear the query.
- **FR-002**: When the effective query is active (trimmed length at least 3 and at most 200 characters after truncation), the board MUST show only tasks that match the query.
- **FR-003**: Matching MUST be case-insensitive keyword / contains (substring) search, such that a query of "wire" finds a title "Wire up the board UI". Matching MUST NOT use fuzzy matching, typo tolerance, synonyms, stemming, or ranked relevance.
- **FR-004**: Search MUST consider title, description, and assignee; a match on any one of those fields is enough to include the task. For description, matching MUST use the full stored description value, including text that is truncated or not shown on the card.
- **FR-005**: Search MUST compose with the status filter: both constraints apply together; matching tasks remain in the correct status column; column counts MUST reflect the tasks currently shown.
- **FR-006**: The effective query MUST be evaluated after trimming leading and trailing spaces. An empty string, all-whitespace input, or a trimmed query shorter than 3 characters MUST mean no search is applied; the board MUST show whatever the status filter alone would show. After trim, the effective query MUST be truncated to a maximum of 200 characters before matching.
- **FR-007**: When an active query matches no tasks, the board MUST show the board-level message "No tasks match your search" above the columns and MUST NOT show per-column "No tasks yet" messages while that no-match state is active. When search is not in that no-match state, columns with no tasks under the current filters MUST continue to use their usual empty-column message.
- **FR-008**: The current query MUST survive a refresh of board data caused by create, move, or delete until the user clears it or changes it.
- **FR-009**: Search results MUST appear on the same board quickly enough that scanning a typical team board feels immediate; there MUST NOT be a separate results page.
- **FR-010**: With an empty search box, create, move, delete, comments, and the status filter MUST continue to work as they do today.
- **FR-011**: New search behaviour MUST ship with a same-layer test for that behaviour.
- **FR-012**: Search MUST NOT match on comments, task id, status text, or timestamps.
- **FR-013**: Search MUST NOT include fuzzy matching, typo tolerance, synonyms, stemming, ranked relevance, saved searches, search history, shareable search links, match highlighting inside cards, pagination, infinite scroll, a dedicated search-results page, analytics, authentication, per-user search, or permissions.
- **FR-014**: Search MUST be implemented as a server query on the task list. All three backends MUST expose it identically: same query parameters, same match rules, same JSON shape (timestamp key casing aside). Unknown status remains `422`. A missing task id remains `404`. The frontend MUST send the active query to the API (via services) rather than filtering only the already-loaded client list.
- **FR-015**: Schema ownership remains `database/schema.sql` only (no migrations, no runtime DDL); an index is allowed only as a reviewed change in that file. Search MUST NOT accept or write `created_at` / `updated_at`. Status values remain exactly `todo`, `in-progress`, or `done`.
- **FR-016**: Layering MUST be preserved: HTTP mapping in the controller/router, match rules in the service, all SQL in the repository; on the React side, presentational components, page-owned state and fetching, HTTP only in services.
- **FR-017**: The search query MUST NOT be restored after a full page reload (page state only).

### Key Entities

- **Task**: Work item on the board with title, description, assignee, and status (`todo`, `in-progress`, `done`). Search may match title, description, and assignee only; description matching uses the full stored value.
- **Search query**: The text the user enters in the search control; leading/trailing spaces are trimmed; empty, all-whitespace, or fewer than 3 characters after trim means search is inactive; active queries are truncated to at most 200 characters before matching and narrow visible tasks together with the status filter. Not restored on full page reload.
- **Status filter**: Existing board control that limits tasks by status; composes with the search query when both are active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate a known task on a typical populated board by typing a partial title, description, or assignee without scanning every card, and see the match on the same board.
- **SC-002**: Given a known partial string that appears in only one task's title (case differing), that task appears among visible results after the user enters an active query (trimmed length ≥ 3).
- **SC-003**: With a status filter and a search query both set, every visible task satisfies both; column counts equal the number of tasks shown in each column under those constraints.
- **SC-004**: Clearing the search query (or leaving it inactive) restores the view to status-filter-only results; create, move, delete, comments, and status filter still succeed in that state.
- **SC-005**: A query with no matches shows "No tasks match your search" above the columns and does not show per-column "No tasks yet" while that state is active; a tester can distinguish this from ordinary empty-column messaging when search is off.
- **SC-006**: After create, move, or delete with an active query, the same query is still applied without the user re-entering it.
- **SC-007**: For a typical team board, updating the query yields visible filtering quickly enough that finding a task feels immediate (no navigation to a separate results page).
- **SC-008**: After a full page reload, the search query is not restored (search starts inactive).

## Assumptions

- Actors are engineers or team leads already using the existing task board (no new authentication or roles for search).
- The existing status filter, columns, and board controls remain the primary layout; search is an addition beside them.
- "Immediate" means interactive filtering on a typical team-sized board, not a separate results experience; exact latency budgets are not specified beyond the brief.
- Search is a server query on the task list; the three backends stay contract-identical per FR-014. Queries are trimmed; under 3 characters after trim means search off; over 200 characters after trim is truncated to 200. Exact HTTP parameter names may be decided in planning.
- Max query length (200, truncate) and no restore after full page reload were set as clarify-session defaults after the five-question ask cap.
- Definition of done follows the brief: acceptance criteria met, same-layer tests green for new behaviour, existing board behaviour still passes with an empty search box, and the Jira/source brief stays linked.

## Out of Scope

- Searching comments, or matching on id, status text, or timestamps.
- Fuzzy matching, typo tolerance, synonyms, stemming, or ranked relevance.
- Saved searches, search history, or shareable search links.
- Highlighting the matched substring inside the card.
- Pagination, infinite scroll, or a dedicated search-results page.
- Analytics (counts over time, cycle time, stuck-work reports).
- Authentication, per-user search, or permissions.
- Restoring the search query after a full page reload (URL or storage persistence).

## Open Questions

All brief open questions are resolved (user answers or clarify-session defaults):

1. ~~Is search a server query on the task list, or a filter applied to tasks already loaded on the board?~~ **Resolved** — server query on all three backends (see Clarifications).
2. ~~What is the minimum query length, if any, before a search runs?~~ **Resolved** — minimum 3 characters after trim; shorter = search off (see Clarifications).
3. ~~How are leading/trailing spaces and an all-whitespace query treated?~~ **Resolved** — trim; all-whitespace is empty / search off (see Clarifications).
4. ~~Does a query match description text that is stored but not fully shown on the card?~~ **Resolved** — match the full stored description (see Clarifications).
5. ~~What is the exact empty-state copy, and does it replace the per-column "No tasks yet" message or sit above the columns?~~ **Resolved** — "No tasks match your search" above columns; hide per-column "No tasks yet" in no-match state (see Clarifications).
6. ~~Is there a maximum query length, and what happens when it is exceeded?~~ **Resolved (default)** — max 200 after trim; truncate longer input (see Clarifications).
7. ~~Should the current query be restored after a full page reload?~~ **Resolved (default)** — No; page state only (see Clarifications).
