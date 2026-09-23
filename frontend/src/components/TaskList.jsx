import { STATUSES, STATUS_LABELS, STATUS_ACCENT_CLASS } from '../constants'
import TaskCard from './TaskCard'

// Renders the three Kanban columns. Always shows all statuses; the filter only
// limits which tasks appear in each column (filtered-out columns stay at count 0).
export default function TaskList({
  tasks,
  filter,
  onAdvance,
  onDelete,
  commentsByTask,
  expandedTaskId,
  onToggleComments,
  onPostComment,
  onDeleteComment,
  commentError,
}) {
  const visibleTasks =
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="board">
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
            {columnTasks.length === 0 && (
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
              />
            ))}
          </section>
        )
      })}
    </div>
  )
}
