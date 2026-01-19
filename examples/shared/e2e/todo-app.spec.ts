/**
 * Shared TodoApp Component E2E Tests
 *
 * Exports test functions that can be imported by adapter examples.
 */

import { test, expect } from '@playwright/test'

/**
 * Run TodoApp component E2E tests.
 *
 * @param baseUrl - The base URL of the server (e.g., 'http://localhost:3001')
 */
export function todoAppTests(baseUrl: string) {
  // Run TodoApp tests serially to avoid server state conflicts
  test.describe.serial('TodoApp Component', () => {
    test.beforeEach(async ({ page, request }) => {
      // Reset server state before each test
      await request.post(`${baseUrl}/api/todos/reset`)
      await page.goto(`${baseUrl}/todos`)
      // Wait for todos to be loaded
      await page.waitForSelector('li')
    })

    test('displays initial todos', async ({ page }) => {
      // Check page title (use #app h1 to avoid conflict with page header)
      await expect(page.locator('#app h1')).toContainText('BarefootJS Todo')

      // Check initial todos are displayed
      await expect(page.locator('li')).toHaveCount(3)
      await expect(page.locator('li').nth(0)).toContainText('Setup project')
      await expect(page.locator('li').nth(1)).toContainText('Create components')
      await expect(page.locator('li').nth(2)).toContainText('Write tests')
    })

    test('displays done count', async ({ page }) => {
      // Check done counter shows 1/3 (Write tests is done)
      await expect(page.locator('text=Done:')).toContainText('1')
      await expect(page.locator('text=/ 3')).toBeVisible()
    })

    test('adds a new todo', async ({ page }) => {
      const initialCount = await page.locator('li').count()

      // Type new todo text
      await page.fill('input[placeholder="Enter new todo..."]', 'New task from Playwright')

      // Click Add button
      await page.click('button:has-text("Add")')

      // Wait for new item to appear
      await expect(page.locator('li')).toHaveCount(initialCount + 1)

      // Verify new todo is in the list
      await expect(page.locator('li').last()).toContainText('New task from Playwright')
    })

    test('toggles todo done state', async ({ page }) => {
      // Find first "Done" button and click it
      const doneButton = page.locator('button:has-text("Done")').first()
      await doneButton.click()

      // Wait for button to change to "Undo"
      await expect(page.locator('li').first().locator('button:has-text("Undo")')).toBeVisible()

      // Done count should increase
      await expect(page.locator('text=Done:')).toContainText('2')
    })

    test('toggles todo back to not done', async ({ page }) => {
      // Find "Undo" button (Write tests is already done) and click it
      const undoButton = page.locator('button:has-text("Undo")').first()
      await undoButton.click()

      // Wait for button to change back to "Done"
      await expect(page.locator('li').nth(2).locator('button:has-text("Done")')).toBeVisible()

      // Done count should decrease
      await expect(page.locator('text=Done:')).toContainText('0')
    })

    test('enters edit mode on text click', async ({ page }) => {
      // Click on todo text to enter edit mode
      await page.click('text=Setup project')

      // Should show input field
      await expect(page.locator('input[value="Setup project"]')).toBeVisible()
    })

    test('edits todo text', async ({ page }) => {
      // Click on todo text to enter edit mode
      await page.click('text=Setup project')

      // Clear and type new text
      const input = page.locator('input[value="Setup project"]')
      await input.fill('Updated project setup')

      // Press Enter to save
      await input.press('Enter')

      // Verify text is updated
      await expect(page.locator('li').first()).toContainText('Updated project setup')
    })

    test('deletes a todo', async ({ page }) => {
      const initialCount = await page.locator('li').count()

      // Click first Delete button
      await page.locator('button:has-text("Delete")').first().click()

      // Wait for item to be removed
      await expect(page.locator('li')).toHaveCount(initialCount - 1)

      // First todo should no longer be "Setup project"
      await expect(page.locator('li').first()).not.toContainText('Setup project')
    })
  })
}
