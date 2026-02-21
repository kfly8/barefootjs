import { test, expect } from '@playwright/test'

test.describe('Button Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/button')
  })

  test.describe('Interactive Counter', () => {
    test('increments count on click', async ({ page }) => {
      const counterButton = page.locator('button:has-text("Clicked")')

      // Get initial text
      const initialText = await counterButton.textContent()
      expect(initialText).toContain('Clicked')
      expect(initialText).toContain('0')

      // Click and verify count changes
      await counterButton.click()
      await expect(counterButton).toContainText('1')
    })

    test('increments count multiple times', async ({ page }) => {
      const counterButton = page.locator('button:has-text("Clicked")')
      await counterButton.click()
      await counterButton.click()
      await counterButton.click()
      await expect(counterButton).toContainText('3')
    })
  })

  test.describe('Button asChild', () => {
    test('renders link with button styling', async ({ page }) => {
      const link = page.locator('[data-testid="as-child-link"]')
      await expect(link).toBeVisible()
      // Should be an <a> tag, not <button>
      await expect(link).toHaveAttribute('role', 'button')
    })

    test('toggles aria-expanded on click', async ({ page }) => {
      const link = page.locator('[data-testid="as-child-link"]')

      // Initially collapsed
      await expect(link).toHaveAttribute('aria-expanded', 'false')
      await expect(link).toContainText('Collapsed')

      // Click to expand
      await link.click()

      // aria-expanded should update reactively
      await expect(link).toHaveAttribute('aria-expanded', 'true')
      await expect(link).toContainText('Expanded')
    })

    test('reactive state syncs across elements', async ({ page }) => {
      const link = page.locator('[data-testid="as-child-link"]')
      const state = page.locator('[data-testid="as-child-state"]')

      // Initially closed
      await expect(state).toContainText('Closed')

      // Click to toggle
      await link.click()
      await expect(state).toContainText('Open')

      // Click again to toggle back
      await link.click()
      await expect(state).toContainText('Closed')
    })
  })

})
