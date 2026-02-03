/**
 * Shared Dialog Component E2E Tests
 *
 * Exports test functions that can be imported by adapter examples.
 */

import { test, expect } from '@playwright/test'

/**
 * Run dialog component E2E tests.
 *
 * @param baseUrl - The base URL of the server (e.g., 'http://localhost:8080')
 */
export function dialogTests(baseUrl: string) {
  test.describe('Dialog Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/dialog`)
    })

    test('dialog is closed by default', async ({ page }) => {
      // Overlay and content should not be visible initially
      await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0)
      await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0)
    })

    test('opens dialog when trigger button is clicked', async ({ page }) => {
      // Click the open button
      await page.click('button:has-text("Open Dialog")')

      // Dialog overlay and content should be visible
      await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible()
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()
    })

    test('closes dialog when close button is clicked', async ({ page }) => {
      // Open the dialog
      await page.click('button:has-text("Open Dialog")')
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()

      // Close the dialog
      await page.click('button:has-text("Close")')

      // Dialog should be closed
      await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0)
      await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0)
    })

    test('closes dialog when overlay is clicked', async ({ page }) => {
      // Open the dialog
      await page.click('button:has-text("Open Dialog")')
      await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible()

      // Click the overlay (not the content)
      await page.locator('[data-slot="dialog-overlay"]').click({ force: true })

      // Dialog should be closed
      await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0)
    })

    test('displays dialog title and description', async ({ page }) => {
      await page.click('button:has-text("Open Dialog")')

      // Check title and description are present
      await expect(page.locator('[data-slot="dialog-content"] h2')).toHaveText('Dialog Title')
      await expect(page.locator('[data-slot="dialog-content"] p')).toContainText('simple dialog example')
    })

    test('has valid ScopeID format', async ({ page }) => {
      // ScopeID should be in format: DialogExample_[6 random alphanumeric chars]
      const scopeId = await page.locator('[data-bf-scope]').first().getAttribute('data-bf-scope')
      expect(scopeId).toMatch(/^DialogExample_[a-z0-9]{6}$/)
    })
  })
}
