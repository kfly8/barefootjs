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
    test('displays all variant badges', async ({ page }) => {
      await expect(page.locator('span:has-text("Default")').first()).toBeVisible()
      await expect(page.locator('span:has-text("Secondary")')).toBeVisible()
      await expect(page.locator('span:has-text("Destructive")')).toBeVisible()
      await expect(page.locator('span:has-text("Outline")')).toBeVisible()
    })

    test('default badge has correct styling', async ({ page }) => {
      const defaultBadge = page.locator('span:has-text("Default")').first()
      await expect(defaultBadge).toHaveClass(/bg-zinc-900/)
    })

    test('secondary badge has correct styling', async ({ page }) => {
      const secondaryBadge = page.locator('span:has-text("Secondary")')
      await expect(secondaryBadge).toHaveClass(/bg-zinc-100/)
    })

    test('destructive badge has correct styling', async ({ page }) => {
      const destructiveBadge = page.locator('span:has-text("Destructive")')
      await expect(destructiveBadge).toHaveClass(/bg-red-500/)
    })

    test('outline badge has correct styling', async ({ page }) => {
      const outlineBadge = page.locator('span:has-text("Outline")')
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
