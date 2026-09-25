import { test, expect } from '@playwright/test'
import { createTask } from './helpers/api.js'
import { resetDatabase } from './helpers/db.js'
import {
  clearSearch,
  columnSection,
  expandCreatePanel,
  setStatusFilter,
  typeSearchQuery,
  waitForBoardReady,
} from './helpers/board.js'

test.beforeEach(async () => {
  resetDatabase()
})

test.describe('User Story 1 — Find a task by typing a search query', () => {
  test('US1-1: search control is present near status filter and refresh', async ({ page }) => {
    await createTask({ title: 'Seed task', status: 'todo' })
    await waitForBoardReady(page)

    const toolbar = page.locator('.toolbar')
    await expect(toolbar.getByText('Filter by status')).toBeVisible()
    await expect(toolbar.getByText('Search tasks')).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveAttribute(
      'placeholder',
      'Search by title, description, or assignee',
    )
    await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('button', { name: 'Refresh' })).toBeVisible()
  })

  test('US1-2: case-insensitive contains match on title', async ({ page }) => {
    await createTask({ title: 'Wire up the board UI', status: 'todo' })
    await createTask({ title: 'Deploy production', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'wire')
    await expect(page.getByRole('heading', { name: 'Wire up the board UI', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Deploy production', level: 3 })).toBeHidden()
  })

  test('US1-3: match on title, description, or assignee is sufficient', async ({ page }) => {
    await createTask({
      title: 'Alpha task',
      description: 'Contains keyword zeta-hidden in full stored text',
      status: 'todo',
    })
    await createTask({
      title: 'Beta task',
      description: 'Plain notes',
      assignee: 'Jordan Lee',
      status: 'in-progress',
    })
    await createTask({ title: 'Gamma task', status: 'done' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'zeta-hidden')
    await expect(page.getByRole('heading', { name: 'Alpha task', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Beta task', level: 3 })).toBeHidden()

    await typeSearchQuery(page, 'Jordan')
    await expect(page.getByRole('heading', { name: 'Beta task', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Alpha task', level: 3 })).toBeHidden()

    await typeSearchQuery(page, 'Gamma')
    await expect(page.getByRole('heading', { name: 'Gamma task', level: 3 })).toBeVisible()
  })

  test('US1-4: matching tasks stay in the correct status columns', async ({ page }) => {
    await createTask({ title: 'Todo match item', status: 'todo' })
    await createTask({ title: 'Progress match item', status: 'in-progress' })
    await createTask({ title: 'Done match item', status: 'done' })
    await createTask({ title: 'Unrelated task', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'item')
    await expect(columnSection(page, 'To Do').getByRole('heading', { name: 'Todo match item', level: 3 })).toBeVisible()
    await expect(columnSection(page, 'In Progress').getByRole('heading', { name: 'Progress match item', level: 3 })).toBeVisible()
    await expect(columnSection(page, 'Done').getByRole('heading', { name: 'Done match item', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Unrelated task', level: 3 })).toBeHidden()
  })
})

test.describe('User Story 2 — Combine search with the status filter', () => {
  test('US2-1: status filter and assignee query intersect in the correct column', async ({ page }) => {
    await createTask({ title: 'Ana in progress', assignee: 'Ana Rivera', status: 'in-progress' })
    await createTask({ title: 'Ana todo', assignee: 'Ana Rivera', status: 'todo' })
    await createTask({ title: 'Ben in progress', assignee: 'Ben Kim', status: 'in-progress' })
    await waitForBoardReady(page)

    await setStatusFilter(page, 'In Progress')
    await typeSearchQuery(page, 'Ana')
    const inProgress = columnSection(page, 'In Progress')
    await expect(inProgress.getByRole('heading', { name: 'Ana in progress', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ana todo', level: 3 })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Ben in progress', level: 3 })).toBeHidden()
  })

  test('US2-2: column counts reflect both status filter and search query', async ({ page }) => {
    await createTask({ title: 'One', assignee: 'Sam', status: 'in-progress' })
    await createTask({ title: 'Two', assignee: 'Sam', status: 'in-progress' })
    await createTask({ title: 'Three', assignee: 'Sam', status: 'todo' })
    await createTask({ title: 'Four', assignee: 'Alex', status: 'in-progress' })
    await waitForBoardReady(page)

    await setStatusFilter(page, 'In Progress')
    await typeSearchQuery(page, 'Sam')
    await expect(columnSection(page, 'In Progress').getByLabel('2 tasks')).toBeVisible()
    await expect(columnSection(page, 'To Do').getByLabel('0 tasks')).toBeVisible()
    await expect(columnSection(page, 'Done').getByLabel('0 tasks')).toBeVisible()
  })
})

test.describe('User Story 3 — Clear search and restore the status-filter view', () => {
  test('US3-1: clearing search restores status-filter-only view', async ({ page }) => {
    await createTask({ title: 'Visible when filtered', status: 'todo' })
    await createTask({ title: 'Hidden by search', status: 'todo' })
    await waitForBoardReady(page)

    await setStatusFilter(page, 'To Do')
    await typeSearchQuery(page, 'Visible')
    await expect(page.getByRole('heading', { name: 'Visible when filtered', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hidden by search', level: 3 })).toBeHidden()

    await clearSearch(page)
    await expect(page.getByRole('heading', { name: 'Visible when filtered', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hidden by search', level: 3 })).toBeVisible()
  })

  test('US3-2: with empty search, create, move, delete, comments, and status filter work', async ({ page }) => {
    const seeded = await createTask({ title: 'Move me', status: 'todo', assignee: 'Pat' })
    await waitForBoardReady(page)

    await expandCreatePanel(page)
    await page.getByLabel('Title').fill('Created via e2e')
    await page.getByRole('button', { name: 'Add task' }).click()
    await expect(page.getByRole('heading', { name: 'Created via e2e', level: 3 })).toBeVisible()

    const moveCard = page.getByTestId(`task-${seeded.id}`)
    await moveCard.getByRole('button', { name: 'Move to In Progress' }).click()
    await expect(columnSection(page, 'In Progress').getByRole('heading', { name: 'Move me', level: 3 })).toBeVisible()

    await moveCard.getByRole('button', { name: /💬/ }).click()
    await page.getByLabel('Author').fill('Reviewer')
    await page.getByLabel('Comment').fill('Looks good')
    await page.getByRole('button', { name: 'Post' }).click()
    await expect(page.getByText('Looks good')).toBeVisible()

    await setStatusFilter(page, 'In Progress')
    await expect(page.getByRole('heading', { name: 'Move me', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Created via e2e', level: 3 })).toBeHidden()

    await moveCard.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Move me', level: 3 })).toBeHidden()
  })
})

test.describe('User Story 4 — Understand when nothing matches', () => {
  test('US4-1: no-match search shows board message and hides per-column empty copy', async ({ page }) => {
    await createTask({ title: 'Existing task', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'nomatchxyz')
    await expect(page.locator('.board-no-match')).toHaveText('No tasks match your search')
    await expect(page.getByText('No tasks yet')).toHaveCount(0)
  })

  test('US4-2: with search off, empty columns show the usual empty-column message', async ({ page }) => {
    await waitForBoardReady(page)

    await expect(page.getByRole('status', { name: 'No tasks match your search' })).toBeHidden()
    await expect(columnSection(page, 'To Do').getByText('No tasks yet')).toBeVisible()
    await expect(columnSection(page, 'In Progress').getByText('No tasks yet')).toBeVisible()
    await expect(columnSection(page, 'Done').getByText('No tasks yet')).toBeVisible()
  })
})

test.describe('User Story 5 — Keep the query while using the board', () => {
  test('US5-1: active query survives create, move, and delete refreshes', async ({ page }) => {
    const todo = await createTask({ title: 'Keep query todo', status: 'todo' })
    await createTask({ title: 'Keep query progress', status: 'in-progress' })
    await createTask({ title: 'Noise task', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'Keep query')
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('Keep query')
    await expect(page.getByRole('heading', { name: 'Keep query todo', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Noise task', level: 3 })).toBeHidden()

    await expandCreatePanel(page)
    await page.getByLabel('Title').fill('Keep query created')
    await page.getByRole('button', { name: 'Add task' }).click()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('Keep query')
    await expect(page.getByRole('heading', { name: 'Keep query created', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Noise task', level: 3 })).toBeHidden()

    const card = page.getByTestId(`task-${todo.id}`)
    await card.getByRole('button', { name: 'Move to In Progress' }).click()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('Keep query')
    await expect(columnSection(page, 'In Progress').getByRole('heading', { name: 'Keep query todo', level: 3 })).toBeVisible()

    await card.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('Keep query')
    await expect(page.getByRole('heading', { name: 'Keep query progress', level: 3 })).toBeVisible()
  })

  test('US5-2: changing the query updates visible results quickly on the same board', async ({ page }) => {
    await createTask({ title: 'Apple task', status: 'todo' })
    await createTask({ title: 'Banana task', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'Apple')
    await expect(page.getByRole('heading', { name: 'Apple task', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Banana task', level: 3 })).toBeHidden()

    await typeSearchQuery(page, 'Banana')
    await expect(page.getByRole('heading', { name: 'Banana task', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Apple task', level: 3 })).toBeHidden()
    await expect(page).toHaveURL('/')
  })

  test('US5-3: full page reload does not restore the search query', async ({ page }) => {
    await createTask({ title: 'Reload task', status: 'todo' })
    await waitForBoardReady(page)

    await typeSearchQuery(page, 'Reload')
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('Reload')

    await page.reload()
    await expect(page.getByRole('status', { name: 'Loading tasks' })).toBeHidden()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('')
    await expect(page.getByRole('heading', { name: 'Reload task', level: 3 })).toBeVisible()
  })
})
