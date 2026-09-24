# Research: Board UI Refresh

## 1. Always-visible columns with status filter

**Decision**: `TaskList` always renders all three columns from `STATUSES`. When
the status filter is not `all`, non-matching columns still render with count
`0` and empty-state copy; only matching tasks appear in the selected column.
`StatusFilter` stays in the toolbar.

**Rationale**: Spec FR-001, FR-020, and Assumptions resolve the open question
“does the filter stay?” Columns must remain scannable even when filtered.
Today’s `columns = filter === 'all' ? STATUSES : [filter]` hides columns and
must change.

**Alternatives considered**:

- Hide filtered-out columns (current behaviour) — violates always-visible
  columns.
- Remove the filter — rejected by Assumptions; filter remains useful to focus
  one status.

## 2. Design tokens in plain CSS

**Decision**: Define light/dark tokens as CSS custom properties on `:root` and
inside `@media (prefers-color-scheme: dark)` in `frontend/src/index.css`. Use
the Assumed scales (type, spacing 4/8/12/16/24/32, radius 6/8/10, one resting
and one hover/focus shadow; To Do blue / In Progress amber / Done green accents
adjusted for AA). Components consume `var(--…)` only; no one-off hex in JSX.

**Rationale**: Constitution and frontend rules forbid a CSS framework. Spec
FR-011/FR-012 require one shared token set and OS dark mode only (no theme
switcher).

**Alternatives considered**:

- CSS Modules or a new styling library — out of scope; prefer editing
  `index.css`.
- Manual theme toggle — out of scope per Assumptions.

## 3. Relative “created …” on task cards

**Decision**: Add a small presentational helper (e.g. `formatRelativeCreated`)
used by `TaskCard` for `task.createdAt` / `task.created_at`, implementing the
Assumptions phrasing:

- &lt; 60 minutes → `created less than an hour ago`
- same calendar day or &lt; 1 day with hours → `created today` / `created X hours ago`
- 1–30 days → `created X days ago`
- &gt; 30 days → `created on D MMM YYYY`

Keep existing `formatApproximateTime` for **comment** timestamps unchanged
(comments are not part of this presentation brief).

**Rationale**: Spec FR-007. Comment relative text uses different wording
(“just now”, “1 minute ago”); mixing rules would break comment tests and
over-scope the refresh.

**Alternatives considered**:

- Reuse `formatApproximateTime` for tasks — wrong phrasing vs Assumptions.
- Show raw ISO — rejected by edge cases / FR-007.

## 4. Initials avatar chip

**Decision**: Derive 1–2 initials from `task.assignee` in `TaskCard` (split on
whitespace; first letter of first and last token, uppercased). Blank/missing
assignee → `"?"`. Render as a small chip; do not remove accessible name context
(e.g. `aria-label` / visually associated text) so tests and screen readers can
still identify the assignee. Update assertions that currently expect
`Assigned to {name}` in the same change (FR-018).

**Rationale**: FR-006 and Assumptions fallback. No photos or user directory.

**Alternatives considered**: Always show full “Assigned to …” only — fails
avatar requirement. Hash-colour avatars from a palette outside tokens —
unnecessary complexity.

## 5. Quiet card actions

**Decision**: Keep Move / Delete / comment controls in the DOM for keyboard and
tests. Style default (non-hover, non-focus-within) as subdued opacity or muted
chrome; strengthen on `:hover` / `:focus-within`. Style Delete as secondary
(outline/muted) vs Move (primary-ish within the quiet set). Respect
`:focus-visible` for keyboard users.

**Rationale**: FR-008 and edge case for keyboard-only users. Removing buttons
from the DOM until hover would break Testing Library clicks and a11y.

**Alternatives considered**: `visibility: hidden` until hover — harder for
keyboard and screenshot diffs. Separate “⋯” menu — extra UI not in the spec.

## 6. Collapsible new-task panel

**Decision**: Wrap `TaskForm` in a collapsible region on `BoardPage` (e.g.
`<details>`/`<summary>` or a button + `aria-expanded` panel). Default
**collapsed**; do not persist across visits. Form fields, validation, and
`onCreate` behaviour stay identical.

**Rationale**: FR-009 and Assumptions. Prefer minimal markup change over a new
component file unless readability suffers (constitution V: prefer editing
existing files).

**Alternatives considered**: Always-expanded form (current) — board not
primary. `localStorage` remembered state — out of Assumptions.

## 7. Breakpoint and column layout

**Decision**: Board CSS grid is three columns at `min-width: ~900px`; below
that, single column stack with clear column separation. Replace today’s
`720px` breakpoint to match FR-002.

**Rationale**: Spec explicitly uses ~900px. Accents and counts stay in headers
in both layouts.

**Alternatives considered**: Keep 720px — fails FR-002. Horizontal scroll on
narrow viewports — not requested; stacking is.

## 8. Loading and empty states

**Decision**: Replace plain `Loading…` text with a board-shaped skeleton (three
column placeholders) or a single accessible spinner with `aria-busy` /
`role="status"`. Prefer skeleton aligned to Kanban for intentional loading
(FR-013). Empty columns use exact copy `No tasks yet` (FR-014).

**Rationale**: Spec assumes friendly empty copy and intentional loading. Same
copy for a fully empty board (three messages, no whole-board banner).

**Alternatives considered**: Keep `Loading…` only — weaker vs FR-013. Distinct
whole-board empty banner — rejected by Assumptions.

## 9. Motion budget

**Decision**: CSS `@keyframes` for new-card enter (~200ms ease-out fade/slide,
cap ≤ 300ms per SC-005). Status moves rely on React re-render into the target
column without height-jarring transitions on columns. Disable decorative
animation under `@media (prefers-reduced-motion: reduce)` (set animation to
`none` / duration `0`).

**Rationale**: FR-015, FR-016, Assumptions motion budget. Pure CSS avoids new
animation libraries.

**Alternatives considered**: Framer Motion / JS animation libs — forbidden
complexity and bundle risk (SC-006). Animate column heights — causes the jump
the spec forbids.

## 10. Layering and file touch list

**Decision**: Presentation-only edits under `frontend/src/`:

| Area | Approach |
|------|----------|
| `index.css` | Tokens, layout, dark mode, motion, quiet actions |
| `BoardPage.jsx` | Header polish, collapsible create panel, loading UI; **no** new fetch paths |
| `TaskList.jsx` | Always three columns; counts; empty copy; accents via class from status |
| `TaskCard.jsx` | Avatar, relative created, quiet actions markup hooks |
| `TaskForm.jsx` | Markup/class only if needed for panel; behaviour unchanged |
| `StatusFilter.jsx` | Stay; minor class hooks if needed |
| `constants.js` | Status values/labels unchanged; optional accent class map if kept out of JSX hard-codes |
| Tests | Update assignee/empty/column assertions; add focused presentation tests as needed |

No backend, schema, or `taskService` contract changes (FR-017).

**Rationale**: Constitution I (frontend layers) and V (edit existing files).
Status strings remain from `constants.js` (frontend rule).

**Alternatives considered**: New `designSystem/` package — overkill. Changing
API timestamps — unnecessary; client already receives `created_at` /
`createdAt`.

## 11. Accessibility and test stability

**Decision**: Preserve semantic headings (`h1` page, `h2` columns, `h3` cards),
`aria-label` on columns, `data-testid={`task-${id}`}`, Move/Delete accessible
names, and comment control behaviour. Spot-check WCAG AA for text and accents
in light and dark. Update tests in the same change when visible copy or
structure required by the refresh moves (FR-018, FR-019).

**Rationale**: Spec success criteria and existing Vitest suite. No axe CI
gate exists today; manual + existing tests are the quality bar unless the
repo already runs an a11y script (it does not).

**Alternatives considered**: Snapshot-only UI tests — brittle. Skip test
updates — would fail the suite and FR-018.
