import { test, expect } from '@playwright/test'

test.describe('Badge Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/badge')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Badge')
    // Use getByRole('main') to target description in main content (not sidebar)
    await expect(page.getByRole('main').getByText('Displays a badge or a component')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    // Check that the installation section contains the package manager tabs
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test('displays examples section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Examples")')).toBeVisible()
  })

  test.describe('Badge Variants', () => {
    // Use data-slot selector to target actual Badge components (not syntax-highlighted code spans)
    const badgeSelector = '[data-slot="badge"]'

    test('displays all variant badges', async ({ page }) => {
      await expect(page.locator(`${badgeSelector}:has-text("Default")`).first()).toBeVisible()
      await expect(page.locator(`${badgeSelector}:has-text("Secondary")`)).toBeVisible()
      await expect(page.locator(`${badgeSelector}:has-text("Destructive")`)).toBeVisible()
      await expect(page.locator(`${badgeSelector}:has-text("Outline")`)).toBeVisible()
    })

    test('default badge has correct styling', async ({ page }) => {
      const defaultBadge = page.locator(`${badgeSelector}:has-text("Default")`).first()
      await expect(defaultBadge).toHaveClass(/bg-primary/)
    })

    test('secondary badge has correct styling', async ({ page }) => {
      const secondaryBadge = page.locator(`${badgeSelector}:has-text("Secondary")`)
      await expect(secondaryBadge).toHaveClass(/bg-secondary/)
    })

    test('destructive badge has correct styling', async ({ page }) => {
      const destructiveBadge = page.locator(`${badgeSelector}:has-text("Destructive")`)
      await expect(destructiveBadge).toHaveClass(/bg-destructive/)
    })

    test('outline badge has correct styling', async ({ page }) => {
      const outlineBadge = page.locator(`${badgeSelector}:has-text("Outline")`)
      await expect(outlineBadge).toHaveClass(/border/)
    })
  })

  test.describe('Badge asChild', () => {
    test('renders <a> tag with badge styling (not <span>)', async ({ page }) => {
      const link = page.locator('[data-testid="badge-aschild-link"]')
      await expect(link).toBeVisible()

      // Should be an <a> tag
      const tagName = await link.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe('a')

      // Should have badge styling classes
      await expect(link).toHaveClass(/inline-flex/)
      await expect(link).toHaveClass(/rounded-full/)
    })

    test('renders outline variant with asChild', async ({ page }) => {
      const outlineLink = page.locator('[data-testid="badge-aschild-outline"]')
      await expect(outlineLink).toBeVisible()

      // Should be an <a> tag
      const tagName = await outlineLink.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe('a')

      // Should have outline variant styling
      await expect(outlineLink).toHaveClass(/text-foreground/)
    })

    test('reactive count updates on click', async ({ page }) => {
      const link = page.locator('[data-testid="badge-aschild-link"]')

      // Initially 0 clicks
      await expect(link).toContainText('Clicked 0 times')

      // Click to increment
      await link.click()
      await expect(link).toContainText('Clicked 1 times')

      // Click again
      await link.click()
      await expect(link).toContainText('Clicked 2 times')
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays props table headers', async ({ page }) => {
      await expect(page.locator('th:has-text("Prop")')).toBeVisible()
      await expect(page.locator('th:has-text("Type")')).toBeVisible()
      await expect(page.locator('th:has-text("Default")')).toBeVisible()
      await expect(page.locator('th:has-text("Description")')).toBeVisible()
    })

    test('displays all props', async ({ page }) => {
      const propsTable = page.locator('table')
      await expect(propsTable.locator('td').filter({ hasText: /^variant$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^children$/ })).toBeVisible()
    })
  })
})
