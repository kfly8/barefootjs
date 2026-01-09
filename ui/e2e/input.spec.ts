import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Input Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/input')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Input')
    await expect(page.locator('text=Displays an input field')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add input')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Input Rendering', () => {
    test('displays input elements', async ({ page }) => {
      // The Input component renders with data-bf-scope^="Input_"
      const inputs = page.locator('[data-bf-scope^="Input_"]')
      await expect(inputs.first()).toBeVisible()
    })

    test('has multiple input examples', async ({ page }) => {
      const inputs = page.locator('[data-bf-scope^="Input_"]')
      // Should have at least 5 inputs on the page (preview + types + disabled examples)
      await expect(inputs).toHaveCount(await inputs.count())
      expect(await inputs.count()).toBeGreaterThan(4)
    })
  })

  test.describe('Value Binding', () => {
    test('displays value binding section', async ({ page }) => {
      await expect(page.locator('[data-bf-scope^="InputBindingDemo_"]')).toBeVisible()
    })

    // Note: Value binding interaction tests are skipped due to a compiler bug
    // where readonly="inputReadOnly" is rendered as a literal string, making inputs read-only.
    // See: https://github.com/kfly8/barefootjs/issues/27
  })

  test.describe('Focus State', () => {
    test('displays focus state example', async ({ page }) => {
      await expect(page.locator('.focus-status')).toBeVisible()
    })

    test('shows focused state on focus', async ({ page }) => {
      const focusSection = page.locator('[data-bf-scope^="InputFocusDemo_"]')
      const input = focusSection.locator('input')
      const status = page.locator('.focus-status')

      await expect(status).toContainText('Not focused')

      await input.focus()
      await expect(status).toContainText('Focused')
    })

    test('shows not focused state on blur', async ({ page }) => {
      const focusSection = page.locator('[data-bf-scope^="InputFocusDemo_"]')
      const input = focusSection.locator('input')
      const status = page.locator('.focus-status')

      await input.focus()
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
      await expect(propsTable.locator('td').filter({ hasText: /^inputType$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^inputPlaceholder$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^inputValue$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^inputDisabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onInput$/ })).toBeVisible()
    })
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page - Input Link', () => {
  test('displays Input component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/input"]')).toBeVisible()
    await expect(page.locator('a[href="/components/input"] h2')).toContainText('Input')
  })

  test('navigates to Input page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/input"]')
    await expect(page).toHaveURL('/components/input')
    await expect(page.locator('h1')).toContainText('Input')
  })
})
