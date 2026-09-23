import { STATUSES, STATUS_LABELS } from '../constants'

function commentCountOf(task) {
  if (typeof task.commentCount === 'number') return task.commentCount
  if (typeof task.comment_count === 'number') return task.comment_count
  return 0
}

function createdAtOf(comment) {
  return comment.createdAt || comment.created_at
}

function taskCreatedAt(task) {
  return task.createdAt || task.created_at
}

export function formatApproximateTime(iso, now = new Date()) {
  if (!iso) return ''
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const deltaMs = now.getTime() - then.getTime()
  const deltaSec = Math.max(0, Math.round(deltaMs / 1000))
  if (deltaSec < 60) return 'just now'
  const deltaMin = Math.round(deltaSec / 60)
  if (deltaMin < 60) return deltaMin === 1 ? '1 minute ago' : `${deltaMin} minutes ago`
  const deltaHours = Math.round(deltaMin / 60)
  if (deltaHours < 24) return deltaHours === 1 ? '1 hour ago' : `${deltaHours} hours ago`
  return then.toLocaleDateString()
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Relative “created …” phrasing for task cards (comments keep formatApproximateTime). */
export function formatRelativeCreated(iso, now = new Date()) {
  if (!iso) return ''
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const deltaMs = Math.max(0, now.getTime() - then.getTime())
  const deltaMin = Math.floor(deltaMs / 60000)

  if (deltaMin < 60) return 'created less than an hour ago'

  const sameCalendarDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()

  const deltaHours = Math.floor(deltaMs / 3600000)
  const deltaDays = Math.floor(deltaMs / 86400000)

  if (deltaDays < 1) {
    if (sameCalendarDay) return 'created today'
    const hours = Math.max(1, deltaHours)
    return hours === 1 ? 'created 1 hour ago' : `created ${hours} hours ago`
  }

  if (deltaDays <= 30) {
    return deltaDays === 1 ? 'created 1 day ago' : `created ${deltaDays} days ago`
  }

  const d = then.getDate()
  const mon = MONTHS[then.getMonth()]
  const y = then.getFullYear()
  return `created on ${d} ${mon} ${y}`
}

export function assigneeInitials(assignee) {
  const name = typeof assignee === 'string' ? assignee.trim() : ''
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1][0] ?? ''
  return `${first}${last}`.toUpperCase() || '?'
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Presentational card for one task. All mutations are delegated upward via
// callbacks so this component stays easy to test in isolation.
export default function TaskCard({
  task,
  onAdvance,
  onDelete,
  comments = [],
  commentsOpen = false,
  onToggleComments,
  onPostComment,
  onDeleteComment,
  commentError,
}) {
  const currentIndex = STATUSES.indexOf(task.status)
  const nextStatus = STATUSES[currentIndex + 1]
  const count = commentCountOf(task)
  const initials = assigneeInitials(task.assignee)
  const createdLabel = formatRelativeCreated(taskCreatedAt(task))
  const assigneeLabel = task.assignee?.trim()
    ? `Assigned to ${task.assignee.trim()}`
    : 'Unassigned'
  const enterClass = prefersReducedMotion() ? 'card' : 'card card-enter'

  function handlePost(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const author = String(data.get('author') ?? '').trim()
    const body = String(data.get('body') ?? '').trim()
    if (!author || !body) return
    onPostComment?.(task, { author, body })
    form.reset()
  }

  return (
    <article className={enterClass} data-testid={`task-${task.id}`}>
      <div className="card-top">
        <span className="avatar" aria-label={assigneeLabel} title={assigneeLabel}>
          {initials}
        </span>
        <div className="card-body">
          <h3>{task.title}</h3>
          {task.description && <p className="card-description">{task.description}</p>}
          {createdLabel && <time className="card-created">{createdLabel}</time>}
        </div>
      </div>
      <div className="card-actions">
        {nextStatus && (
          <button className="btn-move" onClick={() => onAdvance(task, nextStatus)}>
            Move to {STATUS_LABELS[nextStatus]}
          </button>
        )}
        <button className="btn-delete" onClick={() => onDelete(task)}>Delete</button>
        <button
          className="comment-toggle"
          aria-expanded={commentsOpen}
          onClick={() => onToggleComments?.(task)}
        >
          💬{count > 0 ? ` ${count}` : ''}
        </button>
      </div>

      {commentsOpen && (
        <div className="comment-thread">
          {comments.length === 0 && (
            <p className="column-empty">No comments yet</p>
          )}
          <ol className="comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="comment-item">
                <div className="comment-meta">
                  <strong>{comment.author}</strong>
                  <time dateTime={createdAtOf(comment)}>
                    {formatApproximateTime(createdAtOf(comment))}
                  </time>
                </div>
                <p>{comment.body}</p>
                <button
                  className="comment-delete"
                  onClick={() => onDeleteComment?.(task, comment)}
                >
                  Delete comment
                </button>
              </li>
            ))}
          </ol>
          <form className="comment-form" onSubmit={handlePost}>
            <label>
              Author
              <input name="author" maxLength={100} required />
            </label>
            <label>
              Comment
              <textarea name="body" maxLength={500} rows={2} required />
            </label>
            {commentError && <p className="error">{commentError}</p>}
            <button type="submit" className="primary">Post</button>
          </form>
        </div>
      )}
    </article>
  )
}
