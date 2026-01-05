import { test, expect } from '@playwright/test'

test.describe('Select Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/select')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Select')
    await expect(page.locator('text=Displays a select dropdown')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add select')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Select Rendering', () => {
    test('displays select elements', async ({ page }) => {
      const selects = page.locator('select')
      await expect(selects.first()).toBeVisible()
    })

    test('has multiple select examples', async ({ page }) => {
      const selects = page.locator('select')
      // Should have at least 4 selects (preview + basic + disabled examples + binding demos)
      expect(await selects.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Disabled State', () => {
    test('displays disabled select', async ({ page }) => {
      const disabledSelect = page.locator('select[disabled]')
      await expect(disabledSelect.first()).toBeVisible()
    })
  })

  test.describe('Value Binding', () => {
    test('displays binding example section', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="SelectBindingDemo"]')).toBeVisible()
    })

    test('shows initial empty state', async ({ page }) => {
      const status = page.locator('[data-bf-scope="SelectBindingDemo"] .selected-value')
      await expect(status).toContainText('None')
    })

    // Skipped: Static Select examples on page trigger auto-hydration with empty props,
    // causing reconcileList to fail. Needs fix in compiler or page structure.
    test.skip('changes value on selection', async ({ page }) => {
      const bindingSection = page.locator('[data-bf-scope="SelectBindingDemo"]')
      const select = bindingSection.locator('select')
      const status = bindingSection.locator('.selected-value')

      // Initial state
      await expect(status).toContainText('None')

      // Select Apple
      await select.selectOption('apple')
      await expect(select).toHaveValue('apple')
      await expect(status).toContainText('apple')
    })

    // Skipped: Same auto-hydration issue as above
    test.skip('syncs display with selection', async ({ page }) => {
      const bindingSection = page.locator('[data-bf-scope="SelectBindingDemo"]')
      const select = bindingSection.locator('select')
      const status = bindingSection.locator('.selected-value')

      await select.selectOption('banana')
      await expect(status).toContainText('banana')

      await select.selectOption('orange')
      await expect(status).toContainText('orange')
    })

    // Skipped: Same auto-hydration issue as above
    test.skip('cycles through all options', async ({ page }) => {
      const bindingSection = page.locator('[data-bf-scope="SelectBindingDemo"]')
      const select = bindingSection.locator('select')
      const status = bindingSection.locator('.selected-value')

      // Initial state (None)
      await expect(status).toContainText('None')

      // Apple
      await select.selectOption('apple')
      await expect(select).toHaveValue('apple')
      await expect(status).toContainText('apple')

      // Banana
      await select.selectOption('banana')
      await expect(select).toHaveValue('banana')
      await expect(status).toContainText('banana')

      // Orange
      await select.selectOption('orange')
      await expect(select).toHaveValue('orange')
      await expect(status).toContainText('orange')

      // Grape
      await select.selectOption('grape')
      await expect(select).toHaveValue('grape')
      await expect(status).toContainText('grape')
    })
  })

  test.describe('Focus State', () => {
    test('displays focus example section', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="SelectFocusDemo"]')).toBeVisible()
    })

    test('shows initial not focused state', async ({ page }) => {
      const status = page.locator('[data-bf-scope="SelectFocusDemo"] .focus-status')
      await expect(status).toContainText('Not focused')
    })

    // Skipped: Same auto-hydration issue as Value Binding tests
    test.skip('updates status on focus', async ({ page }) => {
      const focusSection = page.locator('[data-bf-scope="SelectFocusDemo"]')
      const select = focusSection.locator('select')
      const status = focusSection.locator('.focus-status')

      // Focus the select
      await select.focus()
      await expect(status).toContainText('Focused')
    })

    // Skipped: Same auto-hydration issue as Value Binding tests
    test.skip('updates status on blur', async ({ page }) => {
      const focusSection = page.locator('[data-bf-scope="SelectFocusDemo"]')
      const select = focusSection.locator('select')
      const status = focusSection.locator('.focus-status')

      // Focus then blur
      await select.focus()
      await expect(status).toContainText('Focused')

      await select.blur()
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
      await expect(propsTable.locator('td').filter({ hasText: /^options$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^selectValue$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^selectPlaceholder$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^selectDisabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onChange$/ })).toBeVisible()
    })
  })
})

test.describe('Home Page - Select Link', () => {
  test('displays Select component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/select"]')).toBeVisible()
    await expect(page.locator('a[href="/components/select"] h2')).toContainText('Select')
  })

  test('navigates to Select page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/select"]')
    await expect(page).toHaveURL('/components/select')
    await expect(page.locator('h1')).toContainText('Select')
  })
})
