# Contract: Board UI Presentation

**Scope**: Frontend presentation only. No HTTP path, method, or JSON field
changes. Backends and `database/schema.sql` are untouched.

**Consumers**: Engineers using the React board; Vitest + Testing Library suite;
manual a11y / contrast checks for EYTB-1.

## Layout contract

| Requirement | Contract |
|-------------|----------|
| Columns | Exactly three sections, always present, order `todo` → `in-progress` → `done` |
| Labels | `To Do`, `In Progress`, `Done` from `STATUS_LABELS` |
| Desktop | Viewport ≥ ~900px: columns side by side |
| Narrow | Below ~900px: columns stack vertically, clearly separated |
| Counts | Header shows live count of cards in that column |
| Filter | `StatusFilter` remains; filtered-out columns stay visible with count `0` |

## Card contract

| Element | Contract |
|---------|----------|
| Root | `<article>` with `data-testid={`task-${id}`}` |
| Title | Heading level consistent with today (`h3`) |
| Avatar | Initials chip; `?` if no assignee |
| Created | Muted relative “created …” line (Assumptions phrasing) |
| Move | Present when a next status exists; accessible name still matches `/Move to …/` |
| Delete | Accessible name `Delete`; visually secondary to Move |
| Quiet actions | Subdued until card `:hover` or `:focus-within`; keyboard focus-visible remains clear |
| Comments | Existing toggle / thread / composer behaviour preserved |

## Chrome contract

| Element | Contract |
|---------|----------|
| Header | Product name, one-line context, refresh grouped with toolbar sensibly |
| New-task panel | Collapsible; default collapsed; same fields and submit rules as today |
| Loading | Skeleton or spinner (not a blank board) while `loading` |
| Empty column | Text `No tasks yet` |

## Visual / a11y contract

| Topic | Contract |
|-------|----------|
| Tokens | CSS variables for type, space, colour, radius, shadow; light + `prefers-color-scheme: dark` |
| Contrast | WCAG AA for primary text, controls, and column accents on adjacent surfaces |
| Motion | Card enter ≤ 300ms when motion allowed; no decorative motion under `prefers-reduced-motion: reduce` |
| Semantics | Column `aria-label` (or equivalent) retained; no regress on heading structure |

## Non-goals (explicit non-contract)

- Drag-and-drop
- Theme switcher control
- New task fields or API shapes
- CSS frameworks / component libraries
- Changing comment relative-time wording

## Stability for tests

Existing behaviour assertions (Move, Delete, comment open/post/delete, form
submit) MUST keep passing. Assertions tied to assignee copy, empty-column
copy, or column visibility under filter MUST be updated in the same change to
match this contract.
