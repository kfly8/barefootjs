import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Button Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/button')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Button')
    await expect(page.locator('text=Displays a button or a component')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    // Default tab is 'bun', command includes --bun flag
    // Check that the installation section contains the package manager tabs
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test('displays examples section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Examples")')).toBeVisible()
  })

  test.describe('Button Variants', () => {
    test('displays all variant buttons', async ({ page }) => {
      // Use first() for buttons that might appear multiple times
      await expect(page.locator('button:has-text("Default")').first()).toBeVisible()
      await expect(page.locator('button:has-text("Secondary")')).toBeVisible()
      await expect(page.locator('button:has-text("Destructive")')).toBeVisible()
      await expect(page.locator('button:has-text("Outline")').first()).toBeVisible()
      await expect(page.locator('button:has-text("Ghost")')).toBeVisible()
      await expect(page.locator('button:has-text("Link")')).toBeVisible()
    })
  })

  test.describe('Button Sizes', () => {
    test('displays all size buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Small")')).toBeVisible()
      await expect(page.locator('button:has-text("Large")')).toBeVisible()
    })

    test('displays icon button', async ({ page }) => {
      // Icon button has data-bf-scope attribute (not a copy button)
      // It's the Button component with an SVG icon inside
      // Note: data-bf-scope uses unique IDs like "Button_0", so we use prefix matching
      // Multiple icon buttons may exist, so use first()
      const iconButton = page.locator('button[data-bf-scope^="Button"]:has(svg)').first()
      await expect(iconButton).toBeVisible()
    })
  })

  test.describe('Disabled State', () => {
    test('displays disabled buttons', async ({ page }) => {
      const disabledButtons = page.locator('button:has-text("Disabled")')
      await expect(disabledButtons).toHaveCount(2)
    })
  })

  test.describe('Interactive Counter', () => {
    test('displays counter button', async ({ page }) => {
      await expect(page.locator('button:has-text("Clicked")')).toBeVisible()
    })

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
      // Check prop names exist in table (use first() for exact match)
      const propsTable = page.locator('table')
      await expect(propsTable.locator('td').filter({ hasText: /^variant$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^size$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^asChild$/ })).toBeVisible()
    })
  })
})
