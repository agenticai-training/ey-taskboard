// The three board columns. These strings must match the CHECK constraint in
// database/schema.sql and the validation in both backends.
export const STATUSES = ['todo', 'in-progress', 'done']

export const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}

// CSS class names for per-status column header accents (tokens live in index.css).
export const STATUS_ACCENT_CLASS = {
  todo: 'column-accent-todo',
  'in-progress': 'column-accent-progress',
  done: 'column-accent-done',
}
