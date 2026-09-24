# Feature Specification: Board UI Refresh

**Feature Branch**: `002-board-ui-refresh`

**Created**: 2026-09-23

**Status**: Draft

**Input**: Jira EYTB-1 — "Refresh the task board UI — Kanban layout, design system, dark mode". Engineers using the task board want a clean Kanban layout with always-visible status columns and a consistent visual design so they can see at a glance where work sits and where it is piling up, without the board feeling like a prototype. Frontend presentation only: no API, data-model, or component-data-flow changes. Source brief: `docs/feature-ui-refresh.md` / `.specify/jira/EYTB-1.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan work by status at a glance (Priority: P1)

An engineer opens the board and immediately sees three status columns — To Do, In Progress, and Done — laid out side by side on a desktop-width viewport. Each column shows its label and how many cards it currently holds. Distinct header accents help the eye land on the right column. On a narrow viewport the columns stack vertically but remain clearly separated so status grouping is still obvious.

**Why this priority**: The core complaint is that work distribution is hard to see. Always-visible columns with counts are the primary value of this refresh.

**Independent Test**: Load a board with tasks in multiple statuses at a wide viewport and at a narrow viewport. Confirm three labelled columns with live counts, side-by-side vs stacked layout, and distinct column identity without changing create/move/delete behaviour.

**Acceptance Scenarios**:

1. **Given** a desktop-width viewport (≥ ~900px) and tasks in more than one status, **When** the engineer views the board, **Then** To Do, In Progress, and Done appear side by side, each with its label and a live count of cards in that column.
2. **Given** a narrow viewport (below ~900px), **When** the engineer views the board, **Then** the same three columns stack vertically, remain clearly separated, and still show labels and counts.
3. **Given** tasks move between statuses (via existing Move), **When** the board updates, **Then** each column count matches the cards visible in that column.
4. **Given** any viewport, **When** the engineer looks at column headers, **Then** each header has a distinct accent and text/background contrast meets WCAG AA.

---

### User Story 2 - Read tidy, quiet task cards (Priority: P2)

An engineer scanning cards sees consistent spacing and typography. Each card shows the assignee as a small initials avatar chip and a muted relative created line (for example "created 3 days ago"). Move and Delete stay available but visually quiet until the card is hovered or focused; Delete remains visually secondary to Move.

**Why this priority**: Cards are the unit of attention after columns. Tidier cards and quieter actions reduce prototype feel without changing what the app does.

**Independent Test**: Inspect cards with and without hover/focus; confirm avatar initials, relative created text, uniform layout, and that actions are subdued until interaction while still keyboard-reachable.

**Acceptance Scenarios**:

1. **Given** a task with an assignee name, **When** the engineer views the card, **Then** they see an initials avatar chip derived from that name.
2. **Given** a task with a known created time, **When** the engineer views the card, **Then** a muted relative "created …" line is visible (phrasing per Assumptions).
3. **Given** a card that is neither hovered nor focused, **When** the engineer views it, **Then** Move/Delete do not dominate the card visually.
4. **Given** a card under hover or keyboard focus, **When** the engineer looks at actions, **Then** Move and Delete are clearly usable, and Delete appears secondary to Move.

---

### User Story 3 - Keep the board primary while creating tasks (Priority: P3)

An engineer can open a collapsible new-task panel when they need to add work. By default the board (columns and cards) is the primary content on the page. The page header presents the product name, a short context line, and refresh grouped sensibly. Loading shows an intentional skeleton or spinner; each empty column shows a friendly empty message.

**Why this priority**: Layout hierarchy and intentional empty/loading states finish the "real board" feel after columns and cards are in place.

**Independent Test**: Load with no tasks, with tasks, and while loading; expand/collapse the new-task panel; confirm board primacy, empty copy, and loading treatment without changing create validation or submit behaviour.

**Acceptance Scenarios**:

1. **Given** the board page on first visit, **When** the engineer views it, **Then** columns/cards are the primary content and the new-task form lives in a collapsible panel (default collapsed per Assumptions).
2. **Given** the panel is collapsed, **When** the engineer expands it, **Then** they can create a task with the same fields and outcome as today; collapsing again returns focus to the board.
3. **Given** tasks are still loading, **When** the engineer views the page, **Then** they see a skeleton or spinner rather than a blank or broken layout.
4. **Given** a column with zero tasks, **When** the engineer views that column, **Then** they see a friendly empty message for that column.

---

### User Story 4 - Comfortable light and dark appearance (Priority: P4)

An engineer whose OS prefers dark mode (or light mode) gets a board that is fully usable with WCAG AA contrast. Visual design uses one shared language: type scale, spacing, palette, radius, and shadow — applied consistently so nothing looks ad-hoc. Subtle motion greets new cards and avoids column height jumps on status change; all motion stops when the user prefers reduced motion.

**Why this priority**: Design consistency and dark mode are required for polish but the board already delivers scan value from P1–P3 without them.

**Independent Test**: Toggle OS light/dark and reduced-motion preferences; add and move cards; confirm contrast, token consistency, motion presence/absence, and no behaviour change to create/move/delete/filter.

**Acceptance Scenarios**:

1. **Given** `prefers-color-scheme: dark`, **When** the engineer uses the board, **Then** all primary text, controls, and column accents remain readable at WCAG AA contrast.
2. **Given** `prefers-color-scheme: light`, **When** the engineer uses the board, **Then** the same AA contrast bar is met and the layout matches the Kanban structure above.
3. **Given** a newly created card and no reduced-motion preference, **When** the card appears, **Then** it animates in briefly without making column heights jump when cards change status.
4. **Given** `prefers-reduced-motion: reduce`, **When** the engineer creates or moves cards, **Then** those animations do not run.

---

### Edge Cases

- All three columns empty: each column shows its own empty message; no separate "whole board empty" banner is required.
- One column full and others empty: full column shows cards and count; empty columns show empty messages and count 0.
- Very long task titles: title remains readable without breaking column width or overlapping actions.
- Missing or blank assignee: avatar chip shows a neutral fallback (e.g. "?") rather than breaking the card layout.
- Created time less than a day or older than 30 days: relative phrasing follows Assumptions; never shows a raw timestamp dump as the only cue.
- Status filter set to one status: filtered-out columns can show empty (count 0) while remaining behaviour of filter and Move/Delete is unchanged.
- Rapid Move between columns: counts and card placement stay correct; column heights do not visibly jump.
- Keyboard-only user: focus-visible styles remain clear; card actions become available on focus even without hover.
- Reduced motion plus dark mode: both preferences apply together with no conflicting chrome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The board MUST present three always-visible status columns labelled To Do, In Progress, and Done.
- **FR-002**: On viewports ≥ ~900px wide, columns MUST appear side by side; below that width they MUST stack vertically while remaining clearly separated.
- **FR-003**: Each column MUST show its label and a live count of cards currently in that column.
- **FR-004**: Each column header MUST use a distinct accent treatment; accent and text contrast MUST meet WCAG AA against adjacent surfaces.
- **FR-005**: Task cards MUST use uniform spacing and typography within the shared visual language.
- **FR-006**: Each card MUST show the assignee as an initials avatar chip (no photos or user directory).
- **FR-007**: Each card MUST show a muted relative "created …" line using the phrasing rules in Assumptions.
- **FR-008**: Move and Delete MUST remain available but visually quiet until the card is hovered or focused; Delete MUST appear visually secondary to Move.
- **FR-009**: The new-task form MUST live in a collapsible panel so board content is the primary page element; default expanded/collapsed behaviour MUST follow Assumptions.
- **FR-010**: The page header MUST present the product name, a one-line context string, and the refresh control in a clear grouping.
- **FR-011**: Visual design MUST use one shared set of design tokens (type scale, spacing scale, colour palette, radius, shadow) applied consistently; components MUST NOT introduce one-off colours outside that palette.
- **FR-012**: The board MUST be fully usable under the OS dark-mode preference with WCAG AA contrast for text and interactive elements.
- **FR-013**: While tasks are loading, the page MUST show a skeleton or spinner.
- **FR-014**: Each empty column MUST show a friendly empty message (copy per Assumptions).
- **FR-015**: New cards MUST animate in when motion is allowed; column heights MUST NOT jump when a card changes status.
- **FR-016**: All decorative motion MUST be disabled when the user prefers reduced motion.
- **FR-017**: Creating, moving, deleting, filtering, and refreshing tasks MUST behave as they do today — presentation and layout only; no API, data-model, or data-flow behaviour changes.
- **FR-018**: Existing automated frontend tests MUST continue to pass; any assertions tied to moved markup or stable test hooks MUST be updated in the same change.
- **FR-019**: Accessibility MUST NOT regress: semantic headings, focus-visible states, WCAG AA contrast, and reduced-motion respect remain in place; automated accessibility results MUST NOT worsen versus the pre-change baseline.
- **FR-020**: The status filter control remains available so engineers can narrow visible tasks; column structure stays visible even when a filter yields empty columns.

### Key Entities

- **Board column**: One of the three fixed statuses (To Do, In Progress, Done), with a label, accent identity, live card count, and optional empty state.
- **Task card**: Existing task presented with title, status, assignee initials, relative created time, and quiet Move/Delete actions.
- **New-task panel**: Collapsible container for the existing create-task form; does not introduce new fields.
- **Design tokens**: Shared visual decisions (type, spacing, colour, radius, shadow) that define light and dark appearance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a desktop-width board with mixed-status tasks, an engineer can correctly identify which status has the most work within 3 seconds without opening filters or individual cards.
- **SC-002**: At a narrow width, all three statuses remain recognizable as separate columns (stacked) with correct counts 100% of the time in manual checks.
- **SC-003**: In both light and dark OS appearance settings, primary text and interactive controls meet WCAG AA contrast on spot-checked column headers, cards, and form controls.
- **SC-004**: Create, move, delete, filter, and refresh flows complete with the same outcomes as before this change (no new fields, no new statuses, no changed validation messages beyond markup/test-hook updates).
- **SC-005**: With reduced motion enabled, card enter/status-change animations do not run; with it disabled, a new card’s enter animation completes in ≤ 300ms and columns do not visibly jump height on Move.
- **SC-006**: All existing board behaviour checks still pass after the refresh; accessibility automated checks do not regress versus the pre-change baseline; the delivered experience stays light (no added third-party UI kit, no noticeable load-time regression on a typical engineer laptop).

## Assumptions

- **Jira traceability**: This specification implements story **EYTB-1**.
- **Status filter**: The filter stays. Columns remain always visible; a selected status continues to limit which tasks appear (empty columns show empty state and count 0). No drag-and-drop; Move remains a button.
- **Count placement**: Counts appear in column headers only — no separate board-total summary.
- **New-task panel default**: Collapsed by default so the board is primary; expand/collapse is not remembered across visits.
- **Relative created phrasing**:
  - Under 1 day: "created today" when calendar-day matches, otherwise "created X hours ago" (minimum 1 hour) or "created less than an hour ago" under 60 minutes.
  - 1–30 days: "created X days ago".
  - Over 30 days: "created on D MMM YYYY" (e.g. "created on 12 Aug 2025").
- **Empty-column copy**: Each empty column shows "No tasks yet" (same copy for a fully empty board — three empty messages, no special whole-board empty state).
- **Assignee fallback**: If assignee is missing or blank, the avatar chip shows "?".
- **Design tokens (defaults for planning)**:
  - Type: body 1rem / 1.5; small 0.875rem; card title 1.05rem semi-bold; column title 0.8rem bold uppercase tracking.
  - Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 px steps.
  - Radius: 6px controls, 8px cards, 10px columns.
  - Shadow: one resting card shadow and one slightly stronger focus/hover elevation.
  - Light palette: neutral page background, elevated surface, strong text, muted text, border; column accents — To Do blue, In Progress amber, Done green — AA against header surfaces.
  - Dark palette: inverted neutrals with the same accent hues adjusted for AA on dark surfaces.
- **Motion budget**: Card enter ~200ms ease-out fade/slide; status changes use layout-stable updates (no height jump); no other decorative motion required.
- **Theme switcher**: Out of scope — follow OS `prefers-color-scheme` only.
- **Scope**: Frontend presentation only; no backend, schema, or new task fields. No new CSS framework or component library.
- **Definition of done extras**: Manual check in light and dark at desktop and narrow widths; screenshots attached to EYTB-1 when implementation completes.
- **Out of scope**: Drag-and-drop; theme switcher UI; real avatars/user directory; board customisation; mobile-app gestures beyond column stacking; any API or data-model change.

## Out of Scope

- Drag-and-drop between columns (Move stays a button).
- Theme switcher UI (OS dark-mode setting only).
- Real avatars, profile pictures, or a user directory.
- Board customisation (adding, renaming, or reordering columns).
- Any new data, fields, or API/schema changes.
- Mobile-app-grade gestures or a separate mobile layout beyond columns stacking.
