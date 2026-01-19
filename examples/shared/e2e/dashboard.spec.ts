/**
 * Shared Dashboard Component E2E Tests
 *
 * Exports test functions that can be imported by adapter examples.
 */

import { test, expect } from '@playwright/test'

/**
 * Run dashboard component E2E tests.
 *
 * @param baseUrl - The base URL of the server (e.g., 'http://localhost:3001')
 */
export function dashboardTests(baseUrl: string) {
  test.describe('Dashboard - All Widgets', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard`)
    })

    test('displays initial state', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Dashboard')
      await expect(page.locator('.counter-widget')).toBeVisible()
      await expect(page.locator('.message-widget')).toBeVisible()
    })

    test('counter widget shows server initial value', async ({ page }) => {
      // Server sets initialCount={10}
      const countDisplay = page.locator('.counter-widget .count')
      await expect(countDisplay).toContainText('10')
    })

    test('counter widget increments and decrements', async ({ page }) => {
      const countDisplay = page.locator('.counter-widget .count')
      await expect(countDisplay).toContainText('10')

      // Increment
      await page.click('.counter-widget button:has-text("+1")')
      await expect(countDisplay).toContainText('11')

      await page.click('.counter-widget button:has-text("+1")')
      await expect(countDisplay).toContainText('12')

      // Decrement
      await page.click('.counter-widget button:has-text("-1")')
      await expect(countDisplay).toContainText('11')
    })

    test('message widget shows server initial text', async ({ page }) => {
      // Server sets message="Hello from server!"
      await expect(page.locator('.message-widget .message')).toContainText('Hello from server!')
    })

    test('message input reflects initial value', async ({ page }) => {
      const input = page.locator('.message-widget input')
      await expect(input).toHaveValue('Hello from server!')
    })

    test('typing in input updates display (two-way binding)', async ({ page }) => {
      const input = page.locator('.message-widget input')
      const messageDisplay = page.locator('.message-widget .message')

      // Clear and type new text
      await input.fill('New message')

      // Display should update immediately
      await expect(messageDisplay).toContainText('New message')
      await expect(input).toHaveValue('New message')
    })

    test('input syncs with display on each keystroke', async ({ page }) => {
      const input = page.locator('.message-widget input')
      const messageDisplay = page.locator('.message-widget .message')

      // Clear and type character by character
      await input.fill('')
      await input.type('H')
      await expect(messageDisplay).toContainText('H')

      await input.type('i')
      await expect(messageDisplay).toContainText('Hi')

      await input.type('!')
      await expect(messageDisplay).toContainText('Hi!')
    })

    test('handles special characters in input', async ({ page }) => {
      const input = page.locator('.message-widget input')
      const messageDisplay = page.locator('.message-widget .message')

      await input.fill('<script>alert("xss")</script>')
      await expect(messageDisplay).toContainText('<script>alert("xss")</script>')
    })

    test('handles empty input', async ({ page }) => {
      const input = page.locator('.message-widget input')

      // Clear input
      await input.fill('')
      await expect(input).toHaveValue('')
    })
  })

  test.describe('Dashboard - Counter Only Route', () => {
    test('shows only counter widget', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/counter-only`)
      await expect(page.locator('.counter-widget')).toBeVisible()
      await expect(page.locator('.message-widget')).toHaveCount(0)
    })

    test('counter starts at 5', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/counter-only`)
      await expect(page.locator('.counter-widget .count')).toContainText('5')
    })

    test('counter is interactive', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/counter-only`)
      const countDisplay = page.locator('.counter-widget .count')

      await page.click('.counter-widget button:has-text("+1")')
      await expect(countDisplay).toContainText('6')
    })
  })

  test.describe('Dashboard - Message Only Route', () => {
    test('shows only message widget', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/message-only`)
      await expect(page.locator('.message-widget')).toBeVisible()
      await expect(page.locator('.counter-widget')).toHaveCount(0)
    })

    test('message shows custom text', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/message-only`)
      await expect(page.locator('.message-widget .message')).toContainText('Custom message!')
    })

    test('input is interactive', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/message-only`)
      const input = page.locator('.message-widget input')
      const messageDisplay = page.locator('.message-widget .message')

      await input.fill('Updated via input')
      await expect(messageDisplay).toContainText('Updated via input')
    })
  })
}
