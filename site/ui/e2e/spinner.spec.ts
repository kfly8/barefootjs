import { test, expect } from '@playwright/test'

test.describe('Spinner Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/spinner')
  })

  test.describe('Spinner Display', () => {
    const spinnerSelector = '[data-slot="spinner"]'

    test('displays spinner with correct SVG element', async ({ page }) => {
      const spinner = page.locator(spinnerSelector).first()
      await expect(spinner).toBeVisible()

      const tagName = await spinner.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe('svg')
    })

    test('has animate-spin class', async ({ page }) => {
      const spinner = page.locator(spinnerSelector).first()
      await expect(spinner).toHaveClass(/animate-spin/)
    })

    test('has role=status for accessibility', async ({ page }) => {
      const spinner = page.locator(spinnerSelector).first()
      await expect(spinner).toHaveAttribute('role', 'status')
    })

    test('has aria-label for accessibility', async ({ page }) => {
      const spinner = page.locator(spinnerSelector).first()
      await expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })
  })

  test.describe('Sizes Demo', () => {
    test('displays multiple spinners with different sizes', async ({ page }) => {
      const spinners = page.locator('[data-slot="spinner"]')
      const count = await spinners.count()
      expect(count).toBeGreaterThanOrEqual(4)
    })
  })

  test.describe('Button Loading Demo', () => {
    test('shows spinner on button click', async ({ page }) => {
      const button = page.locator('[data-testid="spinner-button"]')
      await expect(button).toBeVisible()
      await expect(button).toContainText('Submit')

      // Click the button to trigger loading state
      await button.click()

      // Spinner should appear inside the button
      const spinnerInButton = button.locator('[data-slot="spinner"]')
      await expect(spinnerInButton).toBeVisible()
      await expect(button).toContainText('Processing...')
    })
  })
})
