import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BoardPage from '../../pages/BoardPage'
import * as taskService from '../../services/taskService'

vi.mock('../../services/taskService', () => ({
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  listComments: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}))

describe('BoardPage create panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    taskService.listTasks.mockResolvedValue([])
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
