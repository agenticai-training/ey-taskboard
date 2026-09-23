import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { STATUS_LABELS } from '../../constants'
import TaskList from '../TaskList'

const tasks = [
  { id: 1, title: 'Todo item', status: 'todo', assignee: 'Ana' },
  { id: 2, title: 'Doing item', status: 'in-progress', assignee: 'Sam' },
  { id: 3, title: 'Done item', status: 'done', assignee: null },
]

describe('TaskList', () => {
  it('always renders three columns with labels from STATUS_LABELS', () => {
    render(
      <TaskList
        tasks={tasks}
        filter="all"
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByRole('region', { name: STATUS_LABELS.todo })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: STATUS_LABELS['in-progress'] })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: STATUS_LABELS.done })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: STATUS_LABELS.todo })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: STATUS_LABELS['in-progress'] })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: STATUS_LABELS.done })).toBeInTheDocument()
  })

  it('shows live header counts for each column', () => {
    render(
      <TaskList
        tasks={tasks}
        filter="all"
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(within(screen.getByRole('region', { name: 'To Do' })).getByLabelText('1 tasks')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'In Progress' })).getByLabelText('1 tasks')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Done' })).getByLabelText('1 tasks')).toBeInTheDocument()
  })

  it('keeps filtered-out columns mounted with count 0 and empty copy', () => {
    render(
      <TaskList
        tasks={tasks}
        filter="todo"
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    const todo = screen.getByRole('region', { name: 'To Do' })
    const progress = screen.getByRole('region', { name: 'In Progress' })
    const done = screen.getByRole('region', { name: 'Done' })

    expect(within(todo).getByTestId('task-1')).toBeInTheDocument()
    expect(within(todo).getByLabelText('1 tasks')).toBeInTheDocument()
    expect(within(progress).getByLabelText('0 tasks')).toBeInTheDocument()
    expect(within(done).getByLabelText('0 tasks')).toBeInTheDocument()
    expect(within(progress).getByText('No tasks yet')).toBeInTheDocument()
    expect(within(done).getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.queryByTestId('task-2')).not.toBeInTheDocument()
  })

  it('shows No tasks yet in every empty column', () => {
    render(
      <TaskList
        tasks={[]}
        filter="all"
        onAdvance={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getAllByText('No tasks yet')).toHaveLength(3)
  })
})
