# Contract: Task List Search API

Shared by Python, .NET, and Java. Timestamp key casing MAY differ
(`created_at` / `comment_count` vs `createdAt` / `commentCount`). No other JSON
shape divergence.

Error contract (unchanged):

- `404` — missing task id (other task endpoints)
- `422` — unknown `status` on list (or missing title / unknown status on write)

Search does **not** introduce new status codes. Inactive or over-long `q` is
normalized, not rejected.

## Extended endpoint: `GET /api/tasks`

Existing list endpoint gains an optional search parameter.

| Query param | Required | Rules |
|-------------|----------|-------|
| `status` | no | If present, must be `todo`, `in-progress`, or `done`; else `422` |
| `q` | no | Search text; server normalizes per rules below |

### Normalization of `q` (all backends)

1. Trim leading/trailing whitespace.
2. If empty or trimmed length &lt; 3 → treat as **no search** (same as omitting `q`).
3. If trimmed length &gt; 200 → use the first **200** characters.
4. Match is case-insensitive **contains** (substring) against `title`,
   `description`, and `assignee` (OR). Description uses the full stored value.
5. Do not match comments, id, status text, or timestamps.

When both `status` and an active `q` are present, return the **intersection**.

Success: `200` JSON array of tasks (same shape as today, including comment
count). Empty array when nothing matches — not `404`.

### Examples

```http
GET /api/tasks
GET /api/tasks?status=in-progress
GET /api/tasks?q=wire
GET /api/tasks?status=in-progress&q=ana
```

```bash
# Contains match (case-insensitive)
curl -s 'http://localhost:8000/api/tasks?q=wire'

# Compose with status
curl -s 'http://localhost:8000/api/tasks?status=in-progress&q=ana'

# Unknown status still 422
curl -s -o /dev/null -w "%{http_code}\n" \
  'http://localhost:8000/api/tasks?status=archived&q=wire'

# Short / whitespace q → same as unfiltered list (for that status)
curl -s 'http://localhost:8000/api/tasks?q=ab'
curl -s 'http://localhost:8000/api/tasks?q=%20%20%20'
```

### Task representation (unchanged)

```jsonc
{
  "id": 3,
  "title": "Wire up the board UI",
  "description": "Three columns…",
  "status": "in-progress",
  "assignee": "Ana",
  "commentCount": 2,
  "createdAt": "2026-08-31T10:15:00",
  "updatedAt": "2026-08-31T10:15:00"
}
```

## Out of scope for this contract

- `GET /api/tasks/count` — remains status-only unless a later change adds `q`
  for parity (not required by the feature).
- New routes, pagination, fuzzy match, highlight fields, or search analytics.

## Frontend wire usage

`frontend/src/services/taskService.js` — `listTasks(status, q?)` sends
`params.status` when not `all`, and `params.q` only when the **effective**
query is active (trimmed length ≥ 3, truncated to ≤ 200). Components and pages
MUST NOT call Axios/`fetch` directly.
