import { test, expect } from '@playwright/test'

test.describe('Badge Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/badge')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Badge')
    await expect(page.locator('text=Displays a badge or a component')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add badge')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Badge Variants', () => {
    // Use class selector to target actual Badge components (not syntax-highlighted code spans)
    const badgeSelector = 'span.inline-flex.items-center.rounded-md'

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
