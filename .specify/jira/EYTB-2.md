# EYTB-2

- **Key:** EYTB-2
- **Summary:** Search tasks on the board by title, description, and assignee
- **Type:** Story
- **Status:** To Do
- **Labels:** search
- **Priority:** Medium

## Description

**As an** engineer or team lead using the task board
**I want** to search tasks by title, description, or assignee
**so that** I can find one task without scanning every card once a column fills up.

Source brief: `docs/feature-task-search.md`. Search composes with the existing status filter. Existing create, move, delete, comments, and status-filter behaviour stays when the search box is empty.

## Acceptance criteria

1. **Search box** — a search control sits with the board controls (near the status filter and refresh). It has a visible label, a clear placeholder, and a one-action way to clear the query.
2. **Match rules** — matching is case-insensitive and partial. A query of "wire" finds "Wire up the board UI".
3. **Fields** — search looks at title, description, and assignee. A match on any one of them is enough.
4. **Status filter** — search composes with the status filter. Choosing "In Progress" and typing a name shows in-progress tasks for that person, still in the right column. Column counts reflect the tasks currently shown.
5. **Empty query** — an empty query means no search. The board shows whatever the status filter alone would show.
6. **No matches** — no matches is an intentional empty state ("No tasks match …"), distinct from a column that simply has no tasks.
7. **Query lifetime** — the query survives a refresh of the board data (create, move, delete) until the user clears it or changes it.
8. **Immediacy** — results appear quickly enough that scanning a typical team board feels immediate. There is no separate results page.
9. **No regression** — create, move, delete, comments, and the status filter keep working when the search box is empty. New behaviour ships with a same-layer test.
10. **Backends** — if search is a server query, .NET, Python, and Java expose it identically: same query parameters, same match rules, same JSON shape (timestamp key casing aside). Unknown status stays `422`. A missing task id stays `404`.

## Out of scope

* Searching comments, or matching on id, status text, or timestamps.
* Fuzzy matching, typo tolerance, synonyms, stemming, or ranked relevance.
* Saved searches, search history, or shareable search links.
* Highlighting the matched substring inside the card.
* Pagination, infinite scroll, or a dedicated search-results page.
* Analytics (counts over time, cycle time, stuck-work reports).
* Authentication, per-user search, or permissions.

## Constraints

* Schema stays owned in `database/schema.sql`. No migrations and no runtime DDL. An index is allowed only as a reviewed change in that file.
* `created_at` / `updated_at` stay database-owned. Search does not accept or write them.
* `status` stays exactly `todo`, `in-progress`, or `done`.
* Layers stay put. HTTP mapping lives in the controller/router, match rules in the service, and all SQL in the repository. On the React side: presentational components, page-owned state and fetching, HTTP only in `services/`.

## Definition of done

Acceptance criteria met; same-layer tests green for the new behaviour; existing board behaviour still passes with an empty search box; the brief stays linked as the source.

## Open questions

* Is search a server query on the task list, or a filter applied to tasks already loaded on the board?
* What is the minimum query length, if any, before a search runs?
* How are leading/trailing spaces and an all-whitespace query treated?
* Does a query match description text that is stored but not fully shown on the card?
* What is the exact empty-state copy, and does it replace the per-column "No tasks yet" message or sit above the columns?
* Is there a maximum query length, and what happens when it is exceeded?
* Should the current query be restored after a full page reload?

## Linked source

Source brief from `docs/feature-task-search.md`:

# Feature Brief — Task Search

## Overview

Currently, the board filters tasks by status only. As columns grow, finding a specific task requires manually scanning each card. This feature adds a search capability to quickly locate tasks on the board.

## Solution Outline

- **Search Placement**: A search box will be placed with the board controls, near the status filter and refresh options. It should include a clear label, an easily understandable placeholder, and an action to clear the query in one step.
- **Matching Logic**: As the user types, only tasks matching the query are shown. The match is **case-insensitive** and finds partial matches (e.g., typing "wire" matches "Wire up the board UI").
- **Fields Searched**: Search scans the following fields: `title`, `description`, and `assignee`. A match in any one of these is sufficient to show the task.
- **Composability with Status Filter**: Search works in combination with the status filter. For example, selecting "In Progress" and entering an assignee's name displays only in-progress tasks for that person, preserving their position in the correct column. Column count indicators reflect the number of tasks matching both criteria.
- **Clearing Search**: An empty query disables search and restores the view to the status filter results.
- **Empty State Handling**: If no tasks match the search, a dedicated message (e.g., "No tasks match …") appears. This is a distinct state from an empty column, which continues to show its standard "No tasks yet" message.
- **Persistence of Query**: The query remains active through board interactions (task creation, status changes, deletion) until manually cleared or changed by the user.
- **Performance Expectation**: Search results update quickly so that users see results almost instantaneously—no extra results page or visible lag.

## Out of Scope

- Searching within comments, or matching on `id`, `status` text, or timestamps.
- Fuzzy or tolerant matching, stemming, ranking, or synonym support.
- Saved searches, search history, or shareable search URLs.
- Highlighting the matched portion within a card.
- Pagination, infinite scrolling, or a dedicated search-results page.
- Analytics or reporting features.
- Authentication or search-specific permissions.

## Team Constraints

- **Database schema** is defined solely in `database/schema.sql`. No new migrations or runtime schema changes. Index additions require prior review.
- `created_at` and `updated_at` fields remain managed by the database, not writable or filterable via search.
- `status` values are limited to `todo`, `in-progress`, or `done`. Unknown status yields HTTP 422; missing IDs yield 404. No additional error codes.
- **Backend contract**: All languages (.NET, Python, Java) must handle search identically with the same HTTP query pattern, matching logic, and JSON response shape (except possible key casing differences).
- **Layered architecture** must be preserved: controllers/routers for HTTP mapping; services for business logic; repositories for database interactions. On the frontend, all HTTP goes through services, with state/fetching managed on the page and UI in presentational components.
- Any new behavior must launch with tests at the same layer.
- The board's other features (create, move, delete, comments, status filter) must remain unaffected when the search field is empty.

## Open Questions

**To be clarified before full implementation (do not answer here):**
- Should searching occur server-side, or filter only the client-loaded tasks?
- Is there a minimum character count before search engages?
- How are queries comprising only whitespace handled?
- Does the search examine the full, untruncated description, even if the UI hides part of it?
- What precise message is displayed for "no matches," and does it replace or sit above the per-column "No tasks yet" message?
- Is there a maximum allowed query length, and how is it managed?
- Should the search query persist across full page reloads?

_(Use `/speckit.clarify` to walk through these questions.)_
