---
description: "Task list for Board UI Refresh (EYTB-1)"
---

# Tasks: Board UI Refresh

**Input**: Design documents from `/specs/002-board-ui-refresh/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included — FR-018 / FR-019 and plan.md require existing frontend tests to pass and presentation assertions to be updated/extended in the same change. No new API/endpoint tests (no backend changes).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend SPA: `frontend/src/` (components → pages → services)
- Presentation CSS: `frontend/src/index.css`
- Tests: `frontend/src/components/__tests__/`
- Out of scope: `backend-*`, `database/schema.sql`, `frontend/src/services/taskService.js` contract

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm scope and baseline before presentation edits

- [X] T001 Confirm feature branch and scope against `specs/002-board-ui-refresh/plan.md`: edit only `frontend/src/` presentation files listed in the plan; do not change backends, `database/schema.sql`, or `frontend/src/services/taskService.js` API behaviour
- [X] T002 [P] Run baseline `cd frontend && npm test -- --run` and note any pre-existing failures before markup changes
- [X] T003 [P] Confirm `frontend/package.json` has no new CSS/UI kit dependency planned (plain CSS only per frontend rules)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared design tokens and status accent wiring that ALL user stories consume

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define light-mode design tokens as CSS custom properties on `:root` in `frontend/src/index.css` (type: body 1rem/1.5, small 0.875rem, card title 1.05rem semi-bold, column title 0.8rem bold uppercase tracking; spacing `--space-1`…`--space-6` for 4/8/12/16/24/32 px; radius control 6px / card 8px / column 10px; `--shadow-card` and `--shadow-card-elevated`; neutrals `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`; accents `--color-accent-todo` blue, `--color-accent-progress` amber, `--color-accent-done` green; danger/error)
- [X] T005 Add dark-mode token overrides under `@media (prefers-color-scheme: dark)` in `frontend/src/index.css` (inverted neutrals; same accent hues adjusted for WCAG AA on dark surfaces)
- [X] T006 [P] Optionally add a status→accent class map in `frontend/src/constants.js` without hard-coding `todo` / `in-progress` / `done` strings in JSX (keep `STATUSES` / `STATUS_LABELS` as source of truth)
- [X] T007 Wire page/board chrome to consume token variables (no one-off hex in JSX) in `frontend/src/index.css` base rules so later story layouts inherit the shared language

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Scan work by status at a glance (Priority: P1) 🎯 MVP

**Goal**: Always-visible To Do / In Progress / Done columns with live counts, distinct header accents, and ~900px side-by-side vs stacked layout

**Independent Test**: Load a board with tasks in multiple statuses at ≥~900px and &lt;~900px; confirm three labelled columns with live counts, side-by-side vs stacked layout, distinct accents; create/move/delete behaviour unchanged

### Tests for User Story 1

> **NOTE: Write/update these tests FIRST where assertions will change; ensure they FAIL against current column-hiding behaviour before implementing**

- [X] T008 [P] [US1] Update/add column visibility tests so filtered-out columns remain mounted with count `0` in `frontend/src/components/__tests__/TaskCard.test.jsx` and/or new `frontend/src/components/__tests__/TaskList.test.jsx` (match existing Vitest + Testing Library style)
- [X] T009 [P] [US1] Add presentation tests for three always-present columns, labels from `STATUS_LABELS`, and live header counts in `frontend/src/components/__tests__/TaskList.test.jsx`

### Implementation for User Story 1

- [X] T010 [US1] Change `frontend/src/components/TaskList.jsx` to always render all three columns from `STATUSES` in order `todo` → `in-progress` → `done` (stop hiding columns when filter ≠ `all`; filter only limits which tasks appear)
- [X] T011 [US1] Show each column label from `STATUS_LABELS` and a live count `tasks.filter(t => t.status === status).length` (after list filter) in the column header in `frontend/src/components/TaskList.jsx`
- [X] T012 [US1] Apply distinct per-status header accent classes/tokens (To Do blue / In Progress amber / Done green) on column headers in `frontend/src/components/TaskList.jsx` + `frontend/src/index.css`; preserve column `aria-label` (or equivalent) and `h2` heading semantics
- [X] T013 [US1] Implement board grid at `min-width: ~900px` (three columns side by side) and single-column stack with clear separation below that breakpoint in `frontend/src/index.css` (replace prior ~720px breakpoint)
- [X] T014 [US1] Keep `frontend/src/components/StatusFilter.jsx` behaviour available in the toolbar; only add minor class hooks if needed for tokenized chrome
- [X] T015 [US1] Ensure `data-testid={`task-${task.id}`}` and Move/Delete flows still work with always-visible columns; fix any broken assertions from T008–T009

**Checkpoint**: User Story 1 fully functional and independently testable (MVP)

---

## Phase 4: User Story 2 - Read tidy, quiet task cards (Priority: P2)

**Goal**: Uniform card spacing/typography; initials avatar; muted relative “created …” line; Move/Delete quiet until hover/focus, Delete secondary to Move

**Independent Test**: Inspect cards with/without hover/focus; confirm avatar initials (or `?`), relative created phrasing, uniform layout, subdued then usable actions, keyboard focus-visible

### Tests for User Story 2

- [X] T016 [P] [US2] Update assignee assertions in `frontend/src/components/__tests__/TaskCard.test.jsx` for initials chip + accessible name (blank assignee → `?`); keep Move `/Move to …/` and Delete accessible names
- [X] T017 [P] [US2] Add unit cases for relative created phrasing (`created less than an hour ago`, `created today` / `created X hours ago`, `created X days ago`, `created on D MMM YYYY`) covering `formatRelativeCreated` in `frontend/src/components/__tests__/TaskCard.test.jsx`

### Implementation for User Story 2

- [X] T018 [US2] Add `formatRelativeCreated(iso, now)` in `frontend/src/components/TaskCard.jsx` implementing Assumptions phrasing; do **not** change `formatApproximateTime` (comments keep existing wording)
- [X] T019 [US2] Render muted relative “created …” line from `task.createdAt` / `task.created_at` on the card in `frontend/src/components/TaskCard.jsx`
- [X] T020 [US2] Render initials avatar chip from `task.assignee` (1–2 initials from whitespace-split name tokens, uppercased; missing/blank → `?`) with accessible name context in `frontend/src/components/TaskCard.jsx`
- [X] T021 [US2] Apply uniform card spacing/typography via tokens and quiet-action chrome in `frontend/src/index.css`: default subdued Move/Delete/comment controls; strengthen on `:hover` / `:focus-within`; Delete visually secondary to Move; clear `:focus-visible`; keep controls in the DOM for keyboard and tests
- [X] T022 [US2] Ensure long titles wrap without breaking column width or overlapping actions in `frontend/src/components/TaskCard.jsx` + `frontend/src/index.css`; retain `<article>`, `h3` title, and comment toggle behaviour

**Checkpoint**: User Stories 1 AND 2 work independently

---

## Phase 5: User Story 3 - Keep the board primary while creating tasks (Priority: P3)

**Goal**: Collapsible new-task panel (default collapsed), polished header, intentional loading UI, friendly empty-column copy

**Independent Test**: Load with no tasks, with tasks, and while loading; expand/collapse create panel; confirm board primacy, `No tasks yet`, and skeleton/spinner without changing create validation/submit

### Tests for User Story 3

- [X] T023 [P] [US3] Update empty-column copy assertions to exact string `No tasks yet` in `frontend/src/components/__tests__/TaskList.test.jsx` (or existing suite files that assert empty state)
- [X] T024 [P] [US3] Add/adjust tests for collapsible create panel default-collapsed and TaskForm still submitting as today in `frontend/src/components/__tests__/TaskForm.test.jsx` and/or page-level coverage alongside `frontend/src/pages/BoardPage.jsx`

### Implementation for User Story 3

- [X] T025 [US3] When a column count is 0, render friendly empty copy exactly `No tasks yet` inside that column in `frontend/src/components/TaskList.jsx` (no whole-board empty banner; three messages if board fully empty)
- [X] T026 [US3] Polish page header in `frontend/src/pages/BoardPage.jsx` + `frontend/src/index.css`: product name, one-line context string, and refresh in one header group; keep `h1` semantics
- [X] T027 [US3] Wrap existing `TaskForm` in a collapsible panel on `frontend/src/pages/BoardPage.jsx` (`<details>`/`<summary>` or button + `aria-expanded`); default **collapsed**; do not persist open state across visits; no new fields
- [X] T028 [US3] Adjust `frontend/src/components/TaskForm.jsx` markup/classes only as needed for panel styling; keep create fields, validation, and `onCreate` behaviour identical
- [X] T029 [US3] Replace plain loading text with board-shaped skeleton (preferred) or accessible spinner (`role="status"` / `aria-busy`) while loading in `frontend/src/pages/BoardPage.jsx` + `frontend/src/index.css`
- [X] T030 [US3] Confirm create/move/delete/filter/refresh still call existing `taskService` methods only from `frontend/src/pages/BoardPage.jsx` (no new fetch paths in components)

**Checkpoint**: User Stories 1–3 independently functional

---

## Phase 6: User Story 4 - Comfortable light and dark appearance (Priority: P4)

**Goal**: Token-consistent light/dark AA contrast; card enter motion ≤300ms; no column height jump on Move; all decorative motion off under reduced motion

**Independent Test**: Toggle OS light/dark and reduced-motion; add and move cards; confirm contrast, token consistency, motion presence/absence; no behaviour change to create/move/delete/filter

### Tests for User Story 4

- [X] T031 [P] [US4] Add or extend presentation tests documenting that decorative enter animation class/styles are omitted or zeroed under reduced-motion expectations where testable in `frontend/src/components/__tests__/TaskCard.test.jsx` / CSS contract notes; keep behaviour tests green

### Implementation for User Story 4

- [X] T032 [US4] Spot-check and tune light/dark token values in `frontend/src/index.css` so primary text, controls, and column accents meet WCAG AA on adjacent surfaces (adjust accent hues if needed)
- [X] T033 [US4] Add card-enter `@keyframes` (~200ms ease-out fade/slide, cap ≤300ms) applied to new cards in `frontend/src/index.css` + hook in `frontend/src/components/TaskCard.jsx` when motion is allowed
- [X] T034 [US4] Disable decorative motion under `@media (prefers-reduced-motion: reduce)` in `frontend/src/index.css` (animation `none` / duration `0`); ensure status Moves re-render into target columns without column-height jump transitions
- [X] T035 [US4] Audit components for one-off colours outside the token palette in `frontend/src/components/*.jsx` and `frontend/src/pages/BoardPage.jsx`; replace with `var(--…)` usage
- [X] T036 [US4] Verify focus-visible, heading structure, and column semantics still meet FR-019; fix any a11y regressions in the touched frontend files

**Checkpoint**: All user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Suite green, manual validation, EYTB-1 definition-of-done extras

- [X] T037 Run full frontend suite `cd frontend && npm test -- --run` and fix remaining assertion/markup mismatches from the refresh
- [X] T038 [P] Walk `specs/002-board-ui-refresh/quickstart.md` manual scenarios (P1–P4) at desktop and narrow widths in light and dark
- [X] T039 [P] Confirm no CSS/UI kit added to `frontend/package.json`; attach light/dark desktop and narrow screenshots to Jira EYTB-1 when implementation completes
- [X] T040 Final pass: create / move / delete / filter / refresh / comments unchanged vs pre-refresh behaviour (FR-017 / SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Foundational completion
  - Prefer priority order P1 → P2 → P3 → P4 for incremental delivery
  - US2–US4 can proceed in parallel after Foundational if staffed carefully (watch `index.css` / shared file conflicts)
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependency on other stories — **MVP**
- **User Story 2 (P2)**: After Foundational — independently testable; uses same columns from US1 in practice but card chrome alone is the story
- **User Story 3 (P3)**: After Foundational — empty copy/loading/panel; integrates with columns from US1
- **User Story 4 (P4)**: After Foundational — dark AA + motion; tokens from Phase 2; may refine after US1–US3 chrome exists

### Within Each User Story

- Tests (where listed) written/updated before or with implementation; failing against old behaviour first when assertions change
- Markup/behaviour in components before polish CSS that depends on new class hooks
- Story complete before treating the next priority as done for MVP sequencing

### Parallel Opportunities

- T002–T003 (Setup) in parallel
- T005 after T004; T006 parallel with token work once T004 started
- T008–T009 (US1 tests) in parallel
- T016–T017 (US2 tests) in parallel
- T023–T024 (US3 tests) in parallel
- T038–T039 (Polish) in parallel after suite is green
- Different developers can own US1 (`TaskList`) vs US2 (`TaskCard`) vs US3 (`BoardPage`) after Foundational if coordinating `index.css` edits

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Update/add column visibility tests in frontend/src/components/__tests__/TaskList.test.jsx"
Task: "Add presentation tests for three columns, labels, and live counts in frontend/src/components/__tests__/TaskList.test.jsx"

# Then implement TaskList + CSS (sequential on shared files):
Task: "Always render three STATUSES columns in frontend/src/components/TaskList.jsx"
Task: "Live counts and accents in TaskList.jsx + index.css"
Task: "~900px grid breakpoint in frontend/src/index.css"
```

---

## Parallel Example: User Story 2

```bash
# Tests in parallel:
Task: "Update assignee assertions in frontend/src/components/__tests__/TaskCard.test.jsx"
Task: "Add formatRelativeCreated phrasing cases in frontend/src/components/__tests__/TaskCard.test.jsx"

# Implementation (same primary file — sequential):
Task: "Add formatRelativeCreated in frontend/src/components/TaskCard.jsx"
Task: "Avatar chip + created line in TaskCard.jsx"
Task: "Quiet actions CSS in frontend/src/index.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational tokens (CRITICAL)
3. Complete Phase 3: User Story 1 (always-visible columns + counts + accents + breakpoint)
4. **STOP and VALIDATE**: Independent Test for US1 + `npm test -- --run`
5. Demo Kanban scan value (EYTB-1 core)

### Incremental Delivery

1. Setup + Foundational → tokenized base
2. US1 → columns/counts MVP
3. US2 → tidy cards
4. US3 → panel / loading / empty
5. US4 → dark AA + motion
6. Polish → quickstart + screenshots on EYTB-1

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational:
   - Developer A: User Story 1 (`TaskList.jsx`, column CSS)
   - Developer B: User Story 2 (`TaskCard.jsx`, quiet-action CSS)
   - Developer C: User Story 3 (`BoardPage.jsx`, TaskForm panel hooks)
3. US4 and Polish after merging shared `index.css` carefully

---

## Notes

- [P] tasks = different files, no dependencies on incomplete sibling tasks
- [Story] label maps task to US1–US4 for traceability (EYTB-1)
- Frontend only: no backend, schema, or `taskService` contract changes
- Status values/labels only from `frontend/src/constants.js`
- Empty copy must be exactly `No tasks yet`; avatar fallback exactly `?`
- Verify tests fail before implementing behaviour that changes assertions
- Commit after each task or logical group (when asked)
- Stop at any checkpoint to validate a story independently
- Avoid: CSS frameworks, theme switcher UI, drag-and-drop, new task fields
