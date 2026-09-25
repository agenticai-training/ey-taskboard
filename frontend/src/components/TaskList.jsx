import { STATUSES, STATUS_LABELS, STATUS_ACCENT_CLASS } from '../constants'
import TaskCard from './TaskCard'

// Renders the three Kanban columns. Always shows all statuses; the filter only
// limits which tasks appear in each column (filtered-out columns stay at count 0).
// Column counts reflect the server-returned set (no client re-filter of search).
export default function TaskList({
  tasks,
  filter,
  searchActive = false,
  onAdvance,
  onDelete,
  commentsByTask,
  expandedTaskId,
  onToggleComments,
  onPostComment,
  onDeleteComment,
  commentError,
  enteringTaskId = null,
}) {
  const visibleTasks =
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const noMatch = searchActive && visibleTasks.length === 0

  return (
    <div className="board">
      {noMatch && (
        <p className="board-no-match" role="status">
          No tasks match your search
        </p>
      )}
      {STATUSES.map((status) => {
        const columnTasks = visibleTasks.filter((t) => t.status === status)
        return (
          <section
            className={`column ${STATUS_ACCENT_CLASS[status]}`}
            key={status}
            aria-label={STATUS_LABELS[status]}
          >
            <div className="column-header">
              <h2>{STATUS_LABELS[status]}</h2>
              <span className="column-count" aria-label={`${columnTasks.length} tasks`}>
                {columnTasks.length}
              </span>
            </div>
            {columnTasks.length === 0 && !noMatch && (
              <p className="column-empty">No tasks yet</p>
            )}
            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAdvance={onAdvance}
                onDelete={onDelete}
                comments={commentsByTask?.[task.id] ?? []}
                commentsOpen={expandedTaskId === task.id}
                onToggleComments={onToggleComments}
                onPostComment={onPostComment}
                onDeleteComment={onDeleteComment}
                commentError={expandedTaskId === task.id ? commentError : null}
                animateEnter={enteringTaskId != null && task.id === enteringTaskId}
              />
            ))}
          </section>
        )
      })}
    </div>
  )
}
