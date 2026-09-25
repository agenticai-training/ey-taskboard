# Data Model: Search Tasks on the Board

## Entity: Task (existing, unchanged columns)

Search does not add columns or tables. Matching uses existing stored fields.

| Field | Type | Searched? | Notes |
|-------|------|-----------|-------|
| `id` | integer | no | Not matched (FR-012) |
| `title` | VARCHAR(255) | yes | Case-insensitive contains |
| `description` | TEXT (nullable) | yes | Full stored value, including text not shown on the card |
| `status` | VARCHAR(50) | no (filter only) | Exact filter via `status` param; values `todo`, `in-progress`, `done` |
| `assignee` | VARCHAR(100) (nullable) | yes | Case-insensitive contains |
| `created_at` / `updated_at` | timestamp | no | DB-owned; never accepted or written by search |
| `commentCount` | derived | no | Unchanged list representation |

Null or empty `description` / `assignee` do not satisfy a contains match.

## Concept: Search query (client + API)

Not a persisted entity. Page-state only on the frontend.

| Rule | Behaviour |
|------|-----------|
| Trim | Leading/trailing whitespace removed before evaluation |
| Inactive | Empty, all-whitespace, or trimmed length &lt; 3 → search off |
| Max length | Trimmed length &gt; 200 → truncate to 200; still active if ≥ 3 |
| Match | Case-insensitive substring (contains) on title **OR** description **OR** assignee |
| Lifetime | Survives in-session board refresh (create/move/delete); **not** restored after full page reload |
| Composition | Intersection with optional status filter |

## Concept: Status filter (existing)

Unchanged. Values: `all` (frontend; omit `status` on the wire) or one of
`todo` | `in-progress` | `done`. When both status and an active search query
apply, only tasks matching **both** are returned and shown; column placement
and counts follow the visible set.

## Relationships

```text
Status filter ──intersects──> visible Task set <──intersects── Search query
```

No new FK or join tables. Comments remain unrelated to search.

## Validation / normalization (service layer)

| Rule | Failure / result |
|------|------------------|
| `status` present and not in `{todo, in-progress, done}` | `422` (existing) |
| `q` missing, blank after trim, or trimmed length &lt; 3 | Search off (not an error) |
| `q` trimmed length &gt; 200 | Truncate to 200 (not an error) |
| Client `created_at` / `updated_at` on search | N/A — list is GET-only |

## Ordering

Unchanged: task list ordered by `id` ascending (existing repository behaviour).
Search does not introduce relevance ranking.

## State transitions

Search has no server-side state machine. Effective query is computed per
request from `q`. Frontend query string resets on full page load.
