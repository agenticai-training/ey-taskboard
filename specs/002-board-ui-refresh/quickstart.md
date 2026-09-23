# Quickstart: Board UI Refresh

Validate the EYTB-1 presentation refresh against [data-model.md](./data-model.md)
and [contracts/ui-presentation.md](./contracts/ui-presentation.md). No schema
or backend changes are required.

## Prerequisites

- One backend already runnable (any of the three) with existing seeded tasks
- Frontend: Node deps installed in `frontend/`
- Ability to toggle OS (or DevTools) `prefers-color-scheme` and
  `prefers-reduced-motion`

Do not read or commit real `.env` secrets; use `frontend/.env.example` as the
template for local API base URL configuration.

## 1. Automated suite

```bash
cd frontend && npm test -- --run
```

Expect: existing board behaviour tests green after any markup/copy assertion
updates required by the refresh. No backend test reruns are required for this
feature unless unrelated files were touched.

## 2. Run the board

```bash
# terminal A — one backend (example: Python)
cd backend-python && /* start per project README */

# terminal B
cd frontend && npm run dev
```

Open `http://localhost:5173`.

## 3. Manual validation scenarios

### P1 — Columns and counts

1. Viewport ≥ ~900px, filter **All**, mixed statuses → three side-by-side
   columns with labels, distinct accents, and correct counts.
2. Viewport &lt; ~900px → same three columns stacked and separated.
3. Move a card → source/target counts update; no column height jump.
4. Filter to one status → other columns visible at count `0` with
   `No tasks yet`.

### P2 — Cards

1. Assignee present → initials chip; blank assignee → `?`.
2. Created line matches Assumptions phrasing (spot-check &lt;1h, days, &gt;30d).
3. Default: Move/Delete do not dominate; hover/focus: usable; Delete secondary.

### P3 — Chrome

1. First visit: create panel collapsed; board is primary.
2. Expand → create works as today; collapse again.
3. Slow network / reload: skeleton or spinner while loading.
4. Empty column(s): `No tasks yet` (three messages if board empty).

### P4 — Theme and motion

1. OS dark and light: AA contrast on headers, cards, controls.
2. Create a task with motion allowed → brief enter animation (≤ 300ms).
3. Enable reduced motion → enter animation does not run.

## 4. Definition-of-done extras

- Attach light/dark desktop and narrow screenshots to Jira **EYTB-1**.
- Confirm no new dependency on a CSS/UI kit in `frontend/package.json`.

## Expected outcomes

| Check | Pass criteria |
|-------|----------------|
| Tests | `npm test -- --run` exits 0 |
| Behaviour | Create / Move / Delete / filter / refresh / comments unchanged |
| Layout | Always three columns; ~900px breakpoint; live counts |
| A11y | Focus-visible, reduced motion, AA spot-checks |
