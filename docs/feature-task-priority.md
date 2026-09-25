# Feature Brief — Task Priority

## Why this feature (programme note)

Comments, search, and the board UI refresh already cover discussion, findability,
and presentation. The next increment should stay **small**, still touch **every
layer**, and give a reason to **run the stack in containers** and **gate it in
CI**.

**Task priority** does that without new product complexity:

| ADLC step | What this feature forces |
|-----------|--------------------------|
| Specify / clarify | Closed list of values, default when omitted, `422` vs ignore |
| Plan / schema | One reviewed column on `tasks` in `database/schema.sql` (no migrations) |
| Implement | Same field on .NET, Python, and Java; badge + form field on the board |
| Test | Layer tests (happy path, unknown priority → `422`) plus Playwright on a real DB |
| Docker | Compose Postgres + one backend + frontend so schema apply, API, and UI run the same way locally and in CI |
| CI/CD | On every change: unit/API/frontend suites, image builds, compose smoke (`GET /health`, create a task with priority) |

This is **not** a Docker-only story. Docker and CI are how the feature is
proven; priority is the product change they wrap.

## The ask (as a product owner would phrase it)

Engineers scanning the board cannot tell which work is urgent. Add an optional
**priority** on each task.

- Allowed values are exactly **`low`**, **`medium`**, and **`high`**.
- Creating a task **without** a priority is allowed; treat that as **medium**.
- Each card shows a small **priority badge** (not hidden when medium — always
  visible so columns stay comparable).
- The new-task form includes a **priority** control (default medium).
- Moving a task between columns **must not** clear or change its priority.
- Updating a task can change priority the same way it changes title or
  assignee.
- Listing and search keep working. An optional `?priority=` query on
  `GET /api/tasks` returns only tasks with that priority (composable with
  `?status=` and `?q=`). Unknown priority on that query is **`422`**, same
  family as unknown status.

## Out of scope (for this feature)

- Extra statuses, swimlanes, or a fourth column.
- SLA clocks, due dates, or “overdue” colouring.
- Multiple labels/tags, or a many-to-many table.
- Sorting the board by priority (filter only).
- Notifications, auth, or “who set this priority”.
- A CSS framework or new UI library — reuse tokens in `index.css`.
- Deploying to a public cloud. Compose + CI image build/smoke is enough.

## Notes the team already knows (constraints the spec must honour)

- Schema lives only in `database/schema.sql`. Add a column (and a CHECK), not
  migration tooling. `created_at` / `updated_at` stay database-owned.
- All three backends stay behaviourally identical. Same query names, same JSON
  field (`priority`), same `404` / `422` contract. Timestamp key casing may
  still differ.
- Controller → service → repository on the backends; `components` → `pages` →
  `services` on the frontend. No layer-skipping.
- Status remains exactly `todo` | `in-progress` | `done`. Priority is a
  **separate** field — do not overload `status`.
- New behaviour ships with tests in the same layer. Unit/API stay in-memory;
  only Playwright may hit a real database.
- Frontend status/priority labels come from `src/constants.js`, not hardcoded
  strings in components.

## Dockerization and CI/CD (in the same ADLC run)

Ship these as part of **done** for this feature, not as a follow-up project:

1. **Dockerfiles** for the frontend and each backend (or one backend the
   pipeline actually builds, with the others documented as the same pattern).
2. **`docker-compose.yml`** that starts PostgreSQL, applies `schema.sql` /
   `seed.sql`, starts one backend, and starts the frontend pointed at that
   API. `GET /health` must succeed without a local SDK install.
3. **CI pipeline** (GitHub Actions) that on pull request:
   - runs `dotnet test`, `pytest`, `./mvnw -B test`, and `npm test -- --run`
   - builds the compose images
   - smoke-tests the composed stack (health + create/list a high-priority task)
   - does **not** point unit/API suites at the composed Postgres

Keep secrets out of the repo; compose and CI use the same non-secret local
defaults already documented in the README (`postgres`/`taskboard`).

## Open questions the spec should resolve (don't answer them here)

- Is the JSON field always present (`"priority": "medium"`) or omitted when
  the DB value is the default?
- Does `PUT` require priority, or may it be omitted to leave the current value?
- Badge copy: the raw values (`high`) or labels (`High`)? Colour tokens?
- Does the board get a **priority filter** control, or only the API query
  until a later UI story?
- Existing rows after the column is added: backfill to `medium`, or NULL
  meaning medium only in the service layer?
- One compose file with a backend profile (python / dotnet / java), or three
  compose overlays?
- Does CI build all three backend images every PR, or one default plus a
  matrix on main?

`/speckit.clarify` will walk you through these.

---

## Draft JIRA user story

> Paste into JIRA once refined. Keep the brief above as the linked description.

**Summary:** Add task priority (low / medium / high) across API, board, Docker, and CI

**Type:** Story  **Epic:** Task Board  **Components:** backend, frontend, database, devops

**Story**

> **As an** engineer using the task board
> **I want** each task to carry a low / medium / high priority I can set and filter
> **so that** I can see urgent work at a glance, and the same change is proven
> through spec-driven delivery, containers, and CI.

**Acceptance criteria**

1. **Values** — `priority` is exactly `low`, `medium`, or `high`; omitted on
   create defaults to `medium`.
2. **Errors** — unknown priority on create, update, or `?priority=` is `422`;
   missing task id remains `404`. No new status codes.
3. **API** — all three backends expose `priority` on task JSON; `GET /api/tasks`
   accepts optional `?priority=` composable with `status` and `q`.
4. **Board** — create form can set priority; cards show a badge; move/delete
   and comments/search are unchanged when priority is left at default.
5. **Schema** — change is only in `database/schema.sql` (column + CHECK);
   seed data includes at least one of each priority.
6. **Tests** — layer tests exist before the change is done; Playwright covers
   create-with-priority and filter (or visible badge) against a real DB.
7. **Docker** — `docker compose up` yields a healthy API and board with schema
   applied; no SDK required on the host beyond Docker.
8. **CI** — pull requests run the four unit/API/frontend suites, build images,
   and smoke the composed stack.

**Out of scope:** due dates, tags, sort-by-priority, extra task statuses,
cloud deploy, CSS frameworks.

**Definition of done:** AC met; constitution layers honoured; compose smoke
green in CI; brief linked as the ticket description.
