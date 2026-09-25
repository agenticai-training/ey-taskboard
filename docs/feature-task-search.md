# Feature Brief — Task Search

## Overview

Currently, the board filters tasks by status only. As columns grow, finding a specific task requires manually scanning each card. This feature adds a search capability to quickly locate tasks on the board.

## Solution Outline

- **Search Placement**: A search box will be placed with the board controls, near the status filter and refresh options. It should include a clear label, an easily understandable placeholder, and an action to clear the query in one step.
- **Matching Logic**: As the user types, only tasks matching the query are shown. The match is **case-insensitive** and finds partial matches (e.g., typing "wire" matches “Wire up the board UI”).
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