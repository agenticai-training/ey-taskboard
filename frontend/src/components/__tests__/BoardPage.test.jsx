import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BoardPage from '../../pages/BoardPage'
import * as taskService from '../../services/taskService'

vi.mock('../../services/taskService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    listComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  }
})

describe('BoardPage create panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    taskService.listTasks.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the create panel collapsed by default', async () => {
    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalled())
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
    })
    const details = screen.getByText('Add a new task').closest('details')
    expect(details.open).toBe(false)
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('heading', { name: 'Engineering Task Board' })).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  it('lets TaskForm submit after expanding the panel', async () => {
    taskService.createTask.mockResolvedValue({})
    taskService.listTasks.mockResolvedValue([])

    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalled())
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Add a new task'))
    await userEvent.type(screen.getByLabelText('Title'), 'Ship UI')
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith({
        title: 'Ship UI',
        description: null,
        assignee: null,
      })
    })
  })

  it('animates only the card created in this session', async () => {
    const existing = { id: 1, title: 'Old task', status: 'todo', assignee: 'Ana' }
    const created = {
      id: 9,
      title: 'Ship UI',
      status: 'todo',
      assignee: null,
      createdAt: '2026-09-24T00:00:00.000Z',
    }
    taskService.createTask.mockResolvedValue(created)
    taskService.listTasks
      .mockResolvedValueOnce([existing])
      .mockResolvedValue([existing, created])

    render(<BoardPage />)
    await waitFor(() => {
      expect(screen.getByTestId('task-1')).toBeInTheDocument()
    })
    expect(screen.getByTestId('task-1')).not.toHaveClass('card-enter')

    await userEvent.click(screen.getByText('Add a new task'))
    await userEvent.type(screen.getByLabelText('Title'), 'Ship UI')
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => {
      expect(screen.getByTestId('task-9')).toHaveClass('card-enter')
    })
    expect(screen.getByTestId('task-1')).not.toHaveClass('card-enter')
  })
})

describe('BoardPage search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    taskService.listTasks.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a search control beside the status filter', async () => {
    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalled())
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument()
  })

  it('triggers listTasks with q when the query becomes active', async () => {
    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalledWith('all', null))

    await userEvent.type(screen.getByLabelText('Search tasks'), 'wire')

    await waitFor(
      () => {
        expect(taskService.listTasks).toHaveBeenCalledWith('all', 'wire')
      },
      { timeout: 2000 },
    )
  })

  it('clears the query and refetches without q', async () => {
    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('Search tasks'), 'wire')
    await waitFor(
      () => expect(taskService.listTasks).toHaveBeenCalledWith('all', 'wire'),
      { timeout: 2000 },
    )

    taskService.listTasks.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    await waitFor(() => {
      expect(taskService.listTasks).toHaveBeenCalledWith('all', null)
    })
    expect(screen.getByLabelText('Search tasks')).toHaveValue('')
  })

  it('keeps create, move, delete, comments, and status filter working with empty search', async () => {
    const task = {
      id: 1,
      title: 'Move me',
      status: 'todo',
      assignee: null,
      commentCount: 0,
    }
    taskService.listTasks.mockResolvedValue([task])
    taskService.updateTask.mockResolvedValue({ ...task, status: 'in-progress' })
    taskService.deleteTask.mockResolvedValue(undefined)
    taskService.createTask.mockResolvedValue({ id: 2, title: 'New', status: 'todo' })
    taskService.listComments.mockResolvedValue([])
    taskService.createComment.mockResolvedValue({
      id: 1, taskId: 1, author: 'Ana', body: 'Hi',
    })

    render(<BoardPage />)
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument())

    await userEvent.selectOptions(screen.getByLabelText('Filter by status'), 'todo')
    await waitFor(() => {
      expect(taskService.listTasks).toHaveBeenCalledWith('todo', null)
    })

    await userEvent.click(screen.getByRole('button', { name: /Move to In Progress/i }))
    await waitFor(() => expect(taskService.updateTask).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: /💬/ }))
    await waitFor(() => expect(taskService.listComments).toHaveBeenCalledWith(1))

    await userEvent.type(screen.getByLabelText('Author'), 'Ana')
    await userEvent.type(screen.getByLabelText('Comment'), 'Hi')
    await userEvent.click(screen.getByRole('button', { name: /^Post$/i }))
    await waitFor(() => expect(taskService.createComment).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }))
    await waitFor(() => expect(taskService.deleteTask).toHaveBeenCalledWith(1))

    await userEvent.click(screen.getByText('Add a new task'))
    await userEvent.type(screen.getByLabelText('Title'), 'Another')
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(taskService.createTask).toHaveBeenCalled())
  })

  it('keeps the active query applied after create refresh', async () => {
    taskService.listTasks.mockResolvedValue([])
    taskService.createTask.mockResolvedValue({ id: 3, title: 'New', status: 'todo' })

    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('Search tasks'), 'wire')
    await waitFor(
      () => expect(taskService.listTasks).toHaveBeenCalledWith('all', 'wire'),
      { timeout: 2000 },
    )

    taskService.listTasks.mockClear()
    await userEvent.click(screen.getByText('Add a new task'))
    await userEvent.type(screen.getByLabelText('Title'), 'Ship')
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalled()
      expect(taskService.listTasks).toHaveBeenCalledWith('all', 'wire')
    })
  })

  it('does not restore a previous query on initial mount', async () => {
    window.localStorage.setItem('taskboard-search', 'wire')
    render(<BoardPage />)
    await waitFor(() => expect(taskService.listTasks).toHaveBeenCalledWith('all', null))
    expect(screen.getByLabelText('Search tasks')).toHaveValue('')
    window.localStorage.removeItem('taskboard-search')
  })
})
