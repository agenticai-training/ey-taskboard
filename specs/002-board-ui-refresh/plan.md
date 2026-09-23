# Implementation Plan: Board UI Refresh

**Branch**: `002-board-ui-refresh` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-board-ui-refresh/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refresh the React task board so engineers get a real Kanban scan: always-visible
To Do / In Progress / Done columns with live counts and accents, tidier cards
(initials avatar, relative created line, quiet actions), a collapsible create
panel, tokenized light/dark styling, intentional loading/empty states, and
subtle motion that respects reduced motion — without changing APIs, schema, or
create/move/delete/filter behaviour (Jira EYTB-1).

Technical approach: restyle and lightly restructure markup in existing
`BoardPage`, `TaskList`, `TaskCard`, and `TaskForm` under plain CSS variables in
`index.css`; keep HTTP in `taskService.js` and status strings in `constants.js`.
Details in [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES modules), React 19, Vite 8

**Primary Dependencies**: React 19, React DOM, React Router, Axios; Vitest +
Testing Library + jsdom (dev). No new UI/CSS libraries.

**Storage**: N/A for this feature (existing PostgreSQL task rows unchanged;
client already receives `created_at` / `createdAt`)

**Testing**: Vitest + Testing Library (`npm test -- --run` in `frontend/`)

**Target Platform**: Modern evergreen browsers; local SPA at `:5173` against
any one backend

**Project Type**: Web application frontend (presentation slice of the existing
React + three-backend monorepo)

**Performance Goals**: Card enter ≤ 300ms when motion allowed (SC-005); no
noticeable load-time or bundle regression (SC-006); column height stable on Move

**Constraints**: Frontend layers (`components` → `pages` → `services`); no
CSS framework; no API/schema/data-flow changes; status values only from
`constants.js`; OS `prefers-color-scheme` only (no theme switcher); WCAG AA;
`prefers-reduced-motion` disables decorative motion

**Scale/Scope**: One board page; five existing UI components + `index.css` +
tests; three fixed columns; design-token surface for light/dark

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | How this plan complies |
|------|--------|------------------------|
| I. Layered Architecture | PASS | No fetch in components; `BoardPage` keeps state/fetch; HTTP stays in `taskService.js`. Markup/CSS only in presentational components. |
| II. Shared REST Contract | PASS | No endpoint or JSON shape changes; backends untouched. |
| III. Test-First Endpoints | PASS | No new/changed endpoints. Frontend tests updated/extended for presentation behaviour before considering the UI done. |
| IV. Single Schema Ownership | PASS | No `schema.sql` or ORM migration work. |
| V. Simplicity | PASS | Edit existing frontend files and `index.css`; no new framework, drag-and-drop, or theme switcher. |
| Error contract | PASS | Unchanged (`404` / `422` remain backend concerns). |
| Frontend CSS rule | PASS | Tokens and layout in plain `index.css` CSS variables only. |
| Quality gates | PASS | `cd frontend && npm test -- --run` must pass; backend suites not in scope unless accidentally touched. |

Post-design re-check: still PASS. [data-model.md](./data-model.md),
[contracts/ui-presentation.md](./contracts/ui-presentation.md), and
[quickstart.md](./quickstart.md) describe presentation entities and UI
contracts only — no layer skips, no REST fork, no schema edits.

## Project Structure

### Documentation (this feature)

```text
specs/002-board-ui-refresh/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-presentation.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/src/
├── index.css                    # EDIT: design tokens, light/dark, layout, motion, quiet actions
├── constants.js                 # KEEP status enums/labels; optional accent class map only if needed
├── pages/BoardPage.jsx          # EDIT: header polish, collapsible create panel, loading UI
├── components/TaskList.jsx      # EDIT: always three columns, counts, empty copy, accents
├── components/TaskCard.jsx      # EDIT: avatar chip, relative created, action chrome hooks
├── components/TaskForm.jsx      # EDIT: markup/classes for panel if needed; behaviour unchanged
├── components/StatusFilter.jsx  # KEEP behaviour; minor class hooks optional
├── services/taskService.js      # UNCHANGED (no API changes)
└── components/__tests__/        # EDIT: assignee/empty/column assertions; add presentation cases

# Out of scope for this feature
backend-dotnet/                  # unchanged
backend-python/                  # unchanged
backend-java/                    # unchanged
database/schema.sql              # unchanged
```

**Structure Decision**: Existing `frontend/` SPA only. Prefer editing the listed
files over adding a design-system package or new page. Comments feature
behaviour remains; shared styles may inherit tokens.

## Complexity Tracking

> No constitution violations. Table left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
