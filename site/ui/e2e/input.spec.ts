import { test, expect } from '@playwright/test'

test.describe('Input Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/input')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Input')
    await expect(page.locator('text=Displays an input field')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Input Rendering', () => {
    test('displays input elements', async ({ page }) => {
      const inputs = page.locator('input[data-slot="input"]')
      await expect(inputs.first()).toBeVisible()
    })

    test('has multiple input examples', async ({ page }) => {
      const inputs = page.locator('input[data-slot="input"]')
      // Should have at least 5 inputs on the page (preview + types + disabled examples)
      expect(await inputs.count()).toBeGreaterThan(4)
    })
  })

  test.describe('Input Types', () => {
    test('displays input types example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Input Types")')).toBeVisible()
    })

    test('has text, email, password, and number inputs', async ({ page }) => {
      await expect(page.locator('input[type="text"][placeholder="Text input"]')).toBeVisible()
      await expect(page.locator('input[type="email"][placeholder="Email address"]')).toBeVisible()
      await expect(page.locator('input[type="password"][placeholder="Password"]')).toBeVisible()
      await expect(page.locator('input[type="number"][placeholder="Number"]')).toBeVisible()
    })
  })

  test.describe('Disabled', () => {
    test('displays disabled example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Disabled")')).toBeVisible()
    })

    test('has disabled inputs', async ({ page }) => {
      const disabledInputs = page.locator('input[data-slot="input"][disabled]')
      expect(await disabledInputs.count()).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('Value Binding', () => {
    test('displays value binding section', async ({ page }) => {
      await expect(page.locator('h3:has-text("Value Binding")')).toBeVisible()
      const section = page.locator('[bf-s^="InputBindingDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    // Interactive value binding tests are skipped due to compiler limitations
    // with child component event handler hydration.
    // See: https://github.com/kfly8/barefootjs/issues/27
    test.skip('updates output when typing', async ({ page }) => {
      const section = page.locator('[bf-s^="InputBindingDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-slot="input"]')
      const output = section.locator('.typed-value')

      await input.pressSequentially('hello')
      await expect(output).toContainText('hello')
    })
  })

  test.describe('Focus State', () => {
    test('displays focus state example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Focus State")')).toBeVisible()
      const section = page.locator('[bf-s^="InputFocusDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
      await expect(section.locator('.focus-status')).toBeVisible()
    })

    // Interactive focus tests are skipped due to compiler limitations
    // with child component event handler hydration.
    test.skip('shows focused state on focus', async ({ page }) => {
      const section = page.locator('[bf-s^="InputFocusDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-slot="input"]')
      const status = section.locator('.focus-status')

      await expect(status).toContainText('Not focused')
      await input.click()
      await expect(status).toContainText('Focused')
    })

    test.skip('shows not focused state on blur', async ({ page }) => {
      const section = page.locator('[bf-s^="InputFocusDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-slot="input"]')
      const status = section.locator('.focus-status')

      await input.click()
      await expect(status).toContainText('Focused')
      await input.blur()
      await expect(status).toContainText('Not focused')
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
      await expect(propsTable.locator('td').filter({ hasText: /^type$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^placeholder$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^value$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onInput$/ })).toBeVisible()
    })
  })
})

// Note: Input does not have a PreviewCard on the Home Page yet.
// Home Page tests will be added when a PreviewCard is created.
