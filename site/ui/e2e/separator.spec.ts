import { test, expect } from '@playwright/test'

test.describe('Separator Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/separator')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Separator')
    await expect(page.getByRole('main').getByText('Visually or semantically separates content')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test('displays examples section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Examples")')).toBeVisible()
  })

  test.describe('Separator Rendering', () => {
    const separatorSelector = '[data-slot="separator"]'

    test('renders horizontal separators', async ({ page }) => {
      const horizontalSeparators = page.locator(`${separatorSelector}[data-orientation="horizontal"]`)
      await expect(horizontalSeparators.first()).toBeVisible()
    })

    test('renders vertical separators', async ({ page }) => {
      const verticalSeparators = page.locator(`${separatorSelector}[data-orientation="vertical"]`)
      await expect(verticalSeparators.first()).toBeVisible()
    })

    test('horizontal separator has correct styling', async ({ page }) => {
      const separator = page.locator(`${separatorSelector}[data-orientation="horizontal"]`).first()
      await expect(separator).toHaveClass(/bg-border/)
      await expect(separator).toHaveClass(/h-px/)
      await expect(separator).toHaveClass(/w-full/)
    })

    test('vertical separator has correct styling', async ({ page }) => {
      const separator = page.locator(`${separatorSelector}[data-orientation="vertical"]`).first()
      await expect(separator).toHaveClass(/bg-border/)
      await expect(separator).toHaveClass(/w-px/)
      await expect(separator).toHaveClass(/self-stretch/)
    })

    test('decorative separator has role="none"', async ({ page }) => {
      const separator = page.locator(`${separatorSelector}`).first()
      await expect(separator).toHaveAttribute('role', 'none')
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
      await expect(propsTable.locator('td').filter({ hasText: /^orientation$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^decorative$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^className$/ })).toBeVisible()
    })
  })
})
