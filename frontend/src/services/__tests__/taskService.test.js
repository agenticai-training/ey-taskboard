import { afterEach, describe, expect, it, vi } from 'vitest'
import api from '../api'
import * as taskService from '../taskService'

vi.mock('../api')

afterEach(() => vi.clearAllMocks())

describe('taskService', () => {
  it('omits the status param when filter is "all"', async () => {
    api.get.mockResolvedValue({ data: [] })
    await taskService.listTasks('all')
    expect(api.get).toHaveBeenCalledWith('/api/tasks', { params: {} })
  })

  it('passes status through when a filter is set', async () => {
    api.get.mockResolvedValue({ data: [] })
    await taskService.listTasks('todo')
    expect(api.get).toHaveBeenCalledWith('/api/tasks', { params: { status: 'todo' } })
  })

  it('sends params.q only when the effective query is active', async () => {
    api.get.mockResolvedValue({ data: [] })
    await taskService.listTasks('all', '  wire  ')
    expect(api.get).toHaveBeenCalledWith('/api/tasks', { params: { q: 'wire' } })
  })

  it('omits params.q when the query is inactive', async () => {
    api.get.mockResolvedValue({ data: [] })
    await taskService.listTasks('todo', 'ab')
    expect(api.get).toHaveBeenCalledWith('/api/tasks', { params: { status: 'todo' } })

    await taskService.listTasks('all', '   ')
    expect(api.get).toHaveBeenLastCalledWith('/api/tasks', { params: {} })
  })

  it('truncates an over-long query to 200 characters', async () => {
    api.get.mockResolvedValue({ data: [] })
    const long = `  ${'x'.repeat(250)}  `
    await taskService.listTasks('all', long)
    expect(api.get).toHaveBeenCalledWith('/api/tasks', {
      params: { q: 'x'.repeat(200) },
    })
  })

  it('normalizeSearchQuery mirrors server rules', () => {
    expect(taskService.normalizeSearchQuery(null)).toBeNull()
    expect(taskService.normalizeSearchQuery('ab')).toBeNull()
    expect(taskService.normalizeSearchQuery('abc')).toBe('abc')
    expect(taskService.normalizeSearchQuery(` ${'y'.repeat(210)} `)).toBe('y'.repeat(200))
  })

  it('posts a new task and returns the created record', async () => {
    api.post.mockResolvedValue({ data: { id: 7, title: 'x' } })
    const result = await taskService.createTask({ title: 'x' })
    expect(api.post).toHaveBeenCalledWith('/api/tasks', { title: 'x' })
    expect(result).toEqual({ id: 7, title: 'x' })
  })

  it('deletes by id', async () => {
    api.delete.mockResolvedValue({})
    await taskService.deleteTask(3)
    expect(api.delete).toHaveBeenCalledWith('/api/tasks/3')
  })

  it('lists comments for a task', async () => {
    api.get.mockResolvedValue({ data: [] })
    await taskService.listComments(4)
    expect(api.get).toHaveBeenCalledWith('/api/tasks/4/comments')
  })

  it('posts a comment', async () => {
    api.post.mockResolvedValue({ data: { id: 1, author: 'Ana', body: 'Hi' } })
    const result = await taskService.createComment(4, { author: 'Ana', body: 'Hi' })
    expect(api.post).toHaveBeenCalledWith('/api/tasks/4/comments', { author: 'Ana', body: 'Hi' })
    expect(result.body).toBe('Hi')
  })

  it('deletes a comment', async () => {
    api.delete.mockResolvedValue({})
    await taskService.deleteComment(4, 2)
    expect(api.delete).toHaveBeenCalledWith('/api/tasks/4/comments/2')
  })
})
