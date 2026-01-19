/**
 * Shared FizzBuzzCounter Component E2E Tests
 *
 * Exports test functions that can be imported by adapter examples.
 */

import { test, expect } from '@playwright/test'

/**
 * Run FizzBuzzCounter component E2E tests.
 *
 * @param baseUrl - The base URL of the server (e.g., 'http://localhost:3001')
 */
export function fizzbuzzTests(baseUrl: string) {
  test.describe('FizzBuzzCounter Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/fizzbuzz`)
    })

    test('displays initial count as 0 in simple mode', async ({ page }) => {
      await expect(page.locator('.simple')).toHaveText('0')
    })

    test('simple mode does not show details', async ({ page }) => {
      await expect(page.locator('.details')).not.toBeVisible()
    })

    test('increments count with +1 button', async ({ page }) => {
      await page.click('button:has-text("+1")')
      await expect(page.locator('.simple')).toHaveText('1')
    })

    test('decrements count with -1 button', async ({ page }) => {
      await page.click('button:has-text("-1")')
      await expect(page.locator('.simple')).toHaveText('-1')
    })

    test('toggles to details view', async ({ page }) => {
      await page.click('button:has-text("Toggle Details")')

      // Simple mode should be hidden
      await expect(page.locator('.simple')).not.toBeVisible()

      // Details should be visible
      await expect(page.locator('.details')).toBeVisible()
      await expect(page.locator('.count')).toContainText('Count: 0')
      await expect(page.locator('.doubled')).toContainText('Doubled: 0')
    })

    test('details view shows correct doubled value', async ({ page }) => {
      // Increment to 5
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("+1")')
      }

      // Toggle to details
      await page.click('button:has-text("Toggle Details")')

      await expect(page.locator('.count')).toContainText('Count: 5')
      await expect(page.locator('.doubled')).toContainText('Doubled: 10')
    })

    test('toggles back to simple view', async ({ page }) => {
      // Toggle to details
      await page.click('button:has-text("Toggle Details")')
      await expect(page.locator('.details')).toBeVisible()

      // Toggle back to simple
      await page.click('button:has-text("Toggle Details")')
      await expect(page.locator('.simple')).toBeVisible()
      await expect(page.locator('.details')).not.toBeVisible()
    })

    test('count persists across view toggles', async ({ page }) => {
      // Set count to 3
      await page.click('button:has-text("+1")')
      await page.click('button:has-text("+1")')
      await page.click('button:has-text("+1")')
      await expect(page.locator('.simple')).toHaveText('3')

      // Toggle to details
      await page.click('button:has-text("Toggle Details")')
      await expect(page.locator('.count')).toContainText('Count: 3')

      // Toggle back to simple
      await page.click('button:has-text("Toggle Details")')
      await expect(page.locator('.simple')).toHaveText('3')
    })

    test('increment works in details mode', async ({ page }) => {
      // Toggle to details
      await page.click('button:has-text("Toggle Details")')

      // Increment
      await page.click('button:has-text("+1")')

      await expect(page.locator('.count')).toContainText('Count: 1')
      await expect(page.locator('.doubled')).toContainText('Doubled: 2')
    })
  })
}
