import { useCallback, useEffect, useState } from 'react'
import SearchBox from '../components/SearchBox'
import StatusFilter from '../components/StatusFilter'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import { STATUS_LABELS } from '../constants'
import * as taskService from '../services/taskService'
import { normalizeSearchQuery } from '../services/taskService'

const SEARCH_DEBOUNCE_MS = 250

function countOf(task) {
  if (typeof task.commentCount === 'number') return task.commentCount
  if (typeof task.comment_count === 'number') return task.comment_count
  return 0
}

function withCount(task, count) {
  return { ...task, commentCount: count, comment_count: count }
}

function BoardSkeleton() {
  return (
    <div
      className="board-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      {[0, 1, 2].map((i) => (
        <div className="skeleton-column" key={i}>
          <div className="skeleton-bar short" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ))}
      <span className="visually-hidden">Loading…</span>
    </div>
  )
}

// Container component: owns the task list state and all data fetching.
export default function BoardPage() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [commentsByTask, setCommentsByTask] = useState({})
  const [commentError, setCommentError] = useState(null)
  const [enteringTaskId, setEnteringTaskId] = useState(null)

  useEffect(() => {
    if (loading || enteringTaskId == null) return undefined
    const timer = setTimeout(() => setEnteringTaskId(null), 300)
    return () => clearTimeout(timer)
  }, [loading, enteringTaskId])

  // Debounce active search; clear immediately when query becomes inactive.
  useEffect(() => {
    const effective = normalizeSearchQuery(query)
    if (!effective) {
      setActiveQuery(null)
      return undefined
    }
    const timer = setTimeout(() => setActiveQuery(effective), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const searchActive = activeQuery != null

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTasks(await taskService.listTasks(filter, activeQuery))
    } catch {
      setError('Could not load tasks. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [filter, activeQuery])

  useEffect(() => {
    refresh()
  }, [refresh])

  function handleClearSearch() {
    setQuery('')
  }

  async function handleCreate(task) {
    const created = await taskService.createTask(task)
    setEnteringTaskId(created?.id ?? null)
    await refresh()
  }

  async function handleAdvance(task, nextStatus) {
    await taskService.updateTask(task.id, { ...task, status: nextStatus })
    await refresh()
  }

  async function handleDelete(task) {
    await taskService.deleteTask(task.id)
    setCommentsByTask((prev) => {
      const next = { ...prev }
      delete next[task.id]
      return next
    })
    if (expandedTaskId === task.id) setExpandedTaskId(null)
    await refresh()
  }

  async function handleToggleComments(task) {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null)
      setCommentError(null)
      return
    }
    setCommentError(null)
    setExpandedTaskId(task.id)
    try {
      const comments = await taskService.listComments(task.id)
      setCommentsByTask((prev) => ({ ...prev, [task.id]: comments }))
    } catch {
      setCommentError('Could not load comments.')
      setCommentsByTask((prev) => ({ ...prev, [task.id]: [] }))
    }
  }

  async function handlePostComment(task, payload) {
    setCommentError(null)
    try {
      const created = await taskService.createComment(task.id, payload)
      setCommentsByTask((prev) => ({
        ...prev,
        [task.id]: [...(prev[task.id] ?? []), created],
      }))
      setTasks((prev) => prev.map((t) => (
        t.id === task.id ? withCount(t, countOf(t) + 1) : t
      )))
    } catch {
      setCommentError('Author and comment are required.')
    }
  }

  async function handleDeleteComment(task, comment) {
    setCommentError(null)
    try {
      await taskService.deleteComment(task.id, comment.id)
      setCommentsByTask((prev) => ({
        ...prev,
        [task.id]: (prev[task.id] ?? []).filter((c) => c.id !== comment.id),
      }))
      setTasks((prev) => prev.map((t) => (
        t.id === task.id ? withCount(t, Math.max(0, countOf(t) - 1)) : t
      )))
    } catch {
      setCommentError('That comment is no longer there.')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Engineering Task Board</h1>
          <p className="app-context">
            Track work across {STATUS_LABELS.todo}, {STATUS_LABELS['in-progress']}, and {STATUS_LABELS.done}
          </p>
        </div>
        <button type="button" onClick={refresh}>Refresh</button>
      </header>

      <details className="create-panel">
        <summary>Add a new task</summary>
        <TaskForm onCreate={handleCreate} />
      </details>

      <div className="toolbar">
        <StatusFilter value={filter} onChange={setFilter} />
        <SearchBox
          value={query}
          onChange={setQuery}
          onClear={handleClearSearch}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? <BoardSkeleton /> : (
        <TaskList
          tasks={tasks}
          filter={filter}
          searchActive={searchActive}
          onAdvance={handleAdvance}
          onDelete={handleDelete}
          commentsByTask={commentsByTask}
          expandedTaskId={expandedTaskId}
          onToggleComments={handleToggleComments}
          onPostComment={handlePostComment}
          onDeleteComment={handleDeleteComment}
          commentError={commentError}
          enteringTaskId={enteringTaskId}
        />
      )}
    </div>
  )
}
