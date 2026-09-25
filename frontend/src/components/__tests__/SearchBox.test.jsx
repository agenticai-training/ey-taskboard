import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchBox from '../SearchBox'

describe('SearchBox', () => {
  it('renders a labelled search input with placeholder', () => {
    render(<SearchBox value="" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/title, description, or assignee/i)).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const onChange = vi.fn()
    render(<SearchBox value="" onChange={onChange} onClear={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Search tasks'), 'wire')
    expect(onChange).toHaveBeenCalled()
  })

  it('calls onClear when the clear button is clicked', async () => {
    const onClear = vi.fn()
    render(<SearchBox value="wire" onChange={vi.fn()} onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('disables clear when the value is empty', () => {
    render(<SearchBox value="" onChange={vi.fn()} onClear={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDisabled()
  })
})
