import { expect } from '@playwright/test'

export const SEARCH_DEBOUNCE_MS = 300

export async function waitForBoardReady(page) {
  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Loading tasks' })).toBeHidden()
}

export async function typeSearchQuery(page, query) {
  const input = page.getByRole('searchbox', { name: 'Search tasks' })
  await input.fill(query)
  if (query.trim().length >= 3) {
    await page.waitForTimeout(SEARCH_DEBOUNCE_MS)
  }
}

export async function clearSearch(page) {
  await page.getByRole('button', { name: 'Clear search' }).click()
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS)
}

export async function setStatusFilter(page, label) {
  await page.getByLabel('Filter by status').selectOption({ label })
}

export function columnSection(page, columnLabel) {
  return page.getByRole('region', { name: columnLabel })
}

export async function expandCreatePanel(page) {
  await page.getByText('Add a new task').click()
}
