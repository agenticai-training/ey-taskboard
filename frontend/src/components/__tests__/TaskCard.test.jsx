import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TaskCard, { formatRelativeCreated } from '../TaskCard'

const baseTask = {
  id: 1,
  title: 'Write the schema',
  description: 'Define the tasks table',
  status: 'todo',
  assignee: 'Priya',
  createdAt: '2026-09-20T10:00:00.000Z',
}

describe('TaskCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the title, description and assignee initials chip', () => {
    render(<TaskCard task={baseTask} onAdvance={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Write the schema' })).toBeInTheDocument()
    expect(screen.getByText('Define the tasks table')).toBeInTheDocument()
    expect(screen.getByLabelText('Assigned to Priya')).toHaveTextContent('P')
  })

  it('shows ? avatar when assignee is blank', () => {
    render(
      <TaskCard
        task={{ ...baseTask, assignee: '   ' }}
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Unassigned')).toHaveTextContent('?')
  })

  it('shows two initials for multi-word assignees', () => {
    render(
      <TaskCard
        task={{ ...baseTask, assignee: 'Ada Lovelace' }}
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Assigned to Ada Lovelace')).toHaveTextContent('AL')
  })

  it('shows a muted relative created line', () => {
    const now = new Date('2026-09-23T10:00:00.000Z')
    render(
      <TaskCard
        task={{ ...baseTask, createdAt: '2026-09-20T10:00:00.000Z' }}
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    // 3 days before fixed now — use text that matches whatever Date.now is in CI;
    // prefer asserting formatRelativeCreated unit cases below and presence of created…
    expect(screen.getByText(/^created /)).toBeInTheDocument()
    void now
  })

  it('advances a todo task to in-progress', async () => {
    const onAdvance = vi.fn()
    render(<TaskCard task={baseTask} onAdvance={onAdvance} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Move to In Progress/ }))
    expect(onAdvance).toHaveBeenCalledWith(baseTask, 'in-progress')
  })

  it('has no advance button for a done task', () => {
    render(
      <TaskCard task={{ ...baseTask, status: 'done' }} onAdvance={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /Move to/ })).not.toBeInTheDocument()
  })

  it('deletes when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<TaskCard task={baseTask} onAdvance={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(baseTask)
  })

  it('shows the comment control without a count when there are no comments', () => {
    render(<TaskCard task={baseTask} onAdvance={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: '💬' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '💬 3' })).not.toBeInTheDocument()
  })

  it('shows the comment count when the task has comments', () => {
    render(
      <TaskCard
        task={{ ...baseTask, commentCount: 3 }}
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: '💬 3' })).toBeInTheDocument()
  })

  it('expands the thread oldest-first and collapses it again', async () => {
    const onToggle = vi.fn()
    const comments = [
      { id: 1, author: 'Ana', body: 'First', createdAt: '2026-09-21T09:00:00' },
      { id: 2, author: 'Priya', body: 'Second', createdAt: '2026-09-21T10:00:00' },
    ]
    const { rerender } = render(
      <TaskCard
        task={{ ...baseTask, commentCount: 2 }}
        comments={comments}
        commentsOpen={false}
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
        onToggleComments={onToggle}
      />,
    )
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '💬 2' }))
    expect(onToggle).toHaveBeenCalledWith({ ...baseTask, commentCount: 2 })

    rerender(
      <TaskCard
        task={{ ...baseTask, commentCount: 2 }}
        comments={comments}
        commentsOpen
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
        onToggleComments={onToggle}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('First')
    expect(items[1]).toHaveTextContent('Second')

    await userEvent.click(screen.getByRole('button', { name: '💬 2' }))
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('does not post when author or body is blank', async () => {
    const onPost = vi.fn()
    render(
      <TaskCard
        task={baseTask}
        commentsOpen
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
        onPostComment={onPost}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(onPost).not.toHaveBeenCalled()
  })

  it('posts trimmed author and body', async () => {
    const onPost = vi.fn()
    render(
      <TaskCard
        task={baseTask}
        commentsOpen
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
        onPostComment={onPost}
      />,
    )
    await userEvent.type(screen.getByLabelText('Author'), '  Ana  ')
    await userEvent.type(screen.getByLabelText('Comment'), '  Looks good  ')
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(onPost).toHaveBeenCalledWith(baseTask, { author: 'Ana', body: 'Looks good' })
  })

  it('deletes a comment without a confirm dialog', async () => {
    const onDeleteComment = vi.fn()
    const comment = { id: 8, author: 'Ana', body: 'Remove me', createdAt: '2026-09-21T09:00:00' }
    render(
      <TaskCard
        task={{ ...baseTask, commentCount: 1 }}
        comments={[comment]}
        commentsOpen
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
        onDeleteComment={onDeleteComment}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete comment' }))
    expect(onDeleteComment).toHaveBeenCalledWith({ ...baseTask, commentCount: 1 }, comment)
  })

  it('omits card-enter class when reduced motion is preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    render(<TaskCard task={baseTask} onAdvance={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByTestId('task-1')).not.toHaveClass('card-enter')
  })

  it('applies card-enter class when motion is allowed', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    render(<TaskCard task={baseTask} onAdvance={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByTestId('task-1')).toHaveClass('card-enter')
  })
})

describe('formatRelativeCreated', () => {
  const now = new Date(2026, 8, 23, 15, 0, 0)

  it('phrases less than an hour ago', () => {
    expect(formatRelativeCreated(new Date(2026, 8, 23, 14, 30, 0), now)).toBe(
      'created less than an hour ago',
    )
  })

  it('phrases created today on the same calendar day', () => {
    expect(formatRelativeCreated(new Date(2026, 8, 23, 10, 0, 0), now)).toBe('created today')
  })

  it('phrases created X hours ago across midnight within 24h', () => {
    const lateNow = new Date(2026, 8, 24, 2, 0, 0)
    expect(formatRelativeCreated(new Date(2026, 8, 23, 20, 0, 0), lateNow)).toBe(
      'created 6 hours ago',
    )
  })

  it('phrases created X days ago', () => {
    expect(formatRelativeCreated(new Date(2026, 8, 20, 15, 0, 0), now)).toBe('created 3 days ago')
  })

  it('phrases absolute date after 30 days', () => {
    expect(formatRelativeCreated(new Date(2026, 7, 1, 12, 0, 0), now)).toBe(
      'created on 1 Aug 2026',
    )
  })
})
