import { test, expect } from '@playwright/test'

test.describe('Textarea Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/textarea')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Textarea')
    await expect(page.locator('text=Displays a multi-line text input field.')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Textarea Rendering', () => {
    test('displays textarea elements', async ({ page }) => {
      const textareas = page.locator('textarea[data-slot="textarea"]')
      await expect(textareas.first()).toBeVisible()
    })

    test('has multiple textarea examples', async ({ page }) => {
      const textareas = page.locator('textarea[data-slot="textarea"]')
      // Should have textareas on the page (preview + examples)
      expect(await textareas.count()).toBeGreaterThanOrEqual(4)
    })
  })

  test.describe('Basic', () => {
    test('displays basic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
    })

    test('has placeholder text', async ({ page }) => {
      const textareas = page.locator('textarea[data-slot="textarea"]')
      await expect(textareas.first()).toHaveAttribute('placeholder', 'Type your message here.')
    })
  })

  test.describe('Disabled', () => {
    test('displays disabled example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Disabled")')).toBeVisible()
    })

    test('has disabled textarea', async ({ page }) => {
      const disabledTextarea = page.locator('textarea[data-slot="textarea"][disabled]')
      await expect(disabledTextarea.first()).toBeVisible()
    })
  })

  test.describe('Value Binding', () => {
    test('displays value binding example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Value Binding")')).toBeVisible()
    })

    test('updates character count on input', async ({ page }) => {
      const section = page.locator('[bf-s^="TextareaBindingDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      const textarea = section.locator('textarea[data-slot="textarea"]')
      const charCount = section.locator('.char-count')

      // Initially 0 characters
      await expect(charCount).toContainText('0')

      // Click to focus and type using keyboard
      await textarea.click()
      await page.keyboard.type('Hello')
      await expect(charCount).toContainText('5')
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
      await expect(propsTable.locator('td').filter({ hasText: /^placeholder$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^rows$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onInput$/ })).toBeVisible()
    })
  })
})
