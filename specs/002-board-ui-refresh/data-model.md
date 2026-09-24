# Data Model: Board UI Refresh

Presentation-only feature. **No database or REST payload changes.** Entities
below are UI concepts mapped onto the existing Task JSON the board already
receives.

## Existing persisted entities (unchanged)

### Task (API / DB — read-only for this feature)

| Field | Notes |
|-------|--------|
| `id` | Stable card key / `data-testid` |
| `title` | Required; card heading |
| `description` | Optional body |
| `status` | Exactly `todo` \| `in-progress` \| `done` |
| `assignee` | Optional string; drives avatar initials |
| `created_at` / `createdAt` | DB-owned; drives relative “created …” line |
| `commentCount` / `comment_count` | Existing; comment control unchanged |

Validation and status enums remain backend-owned. Frontend continues to use
`STATUSES` / `STATUS_LABELS` from `frontend/src/constants.js`.

### Comment (unchanged)

Comment thread UI on the card is out of visual-refresh scope except that it
must continue to work and inherit tokenized styles where shared classes apply.

## Presentation entities

### Board column

| Attribute | Rule |
|-----------|------|
| Identity | One of `STATUSES` (fixed three; not user-configurable) |
| Label | `STATUS_LABELS[status]` — To Do / In Progress / Done |
| Accent | Distinct token per status (blue / amber / green family), AA on header surface |
| Count | Live `tasks.filter(t => t.status === status).length` after list filter |
| Empty state | When count is 0: show `No tasks yet` |
| Visibility | Always mounted; filter does not remove the column |

**Relationships**: A column contains zero or more Task cards. Filter narrows
which tasks are listed, not which columns exist.

### Task card (view)

| Attribute | Rule |
|-----------|------|
| Title | Existing `task.title`; wrap without breaking column width |
| Assignee chip | Initials from name; `?` if missing/blank |
| Created line | Muted relative string from Assumptions (see research) |
| Actions | Move (if next status), Delete, comment toggle — quiet until hover/focus-within |
| Test hook | `data-testid={`task-${task.id}`}` retained |

**State transitions (behaviour unchanged)**: Move advances along `STATUSES`;
Delete removes the task; create adds a card that may play enter motion when
motion is allowed.

### New-task panel

| Attribute | Rule |
|-----------|------|
| Contents | Existing create fields (title, description, assignee) |
| Default | Collapsed |
| Persistence | Not remembered across visits |
| Behaviour | Same create validation and `onCreate` outcome as today |

### Design tokens

Logical token groups (implemented as CSS variables):

| Group | Examples |
|-------|----------|
| Colour (light/dark) | `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent-todo`, `--color-accent-progress`, `--color-accent-done`, danger/error |
| Type | `--font-body-size`, `--font-small-size`, `--font-card-title`, `--font-column-title` |
| Space | `--space-1` … `--space-6` (4–32 px steps) |
| Radius | `--radius-control`, `--radius-card`, `--radius-column` |
| Shadow | `--shadow-card`, `--shadow-card-elevated` |
| Motion | `--motion-card-enter-duration` (≈200ms); zeroed under reduced motion |

No component may introduce colours outside this palette for chrome covered by
the refresh.

## Validation rules (UI-only)

- Status labels and values: only from `constants.js`.
- Empty-column copy: exact string `No tasks yet`.
- Relative created phrasing: per Assumptions in `spec.md` (no raw ISO as sole cue).
- Avatar fallback: `?` for blank assignee.
- Breakpoint: ~900px side-by-side vs stack.

## State diagram (column filter)

```text
filter = all  → each column shows its status tasks + live counts
filter = S    → column S shows matching tasks; other columns count 0 + empty copy
```

Create / Move / Delete / Refresh continue to call existing `taskService`
methods; no new client state beyond panel open/closed (ephemeral).
