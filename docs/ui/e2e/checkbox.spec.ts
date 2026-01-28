import { test, expect } from '@playwright/test'

test.describe('Checkbox Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/checkbox')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Checkbox')
    await expect(page.locator('text=A control that allows the user to toggle')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Checkbox Rendering', () => {
    test('displays checkbox elements', async ({ page }) => {
      // The Checkbox component uses button with role="checkbox"
      const checkboxes = page.locator('button[role="checkbox"]')
      await expect(checkboxes.first()).toBeVisible()
    })

    test('has multiple checkbox examples', async ({ page }) => {
      const checkboxes = page.locator('button[role="checkbox"]')
      // Should have at least 4 checkboxes on the page (preview + checked states + disabled + examples)
      expect(await checkboxes.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Checked State', () => {
    test('displays checked and unchecked checkboxes', async ({ page }) => {
      const section = page.locator('text=Checked State').locator('..')
      const checkboxes = section.locator('button[role="checkbox"]')

      // Should have 2 checkboxes in this section
      await expect(checkboxes).toHaveCount(2)
    })

    test('checked checkbox shows checkmark', async ({ page }) => {
      // Look for checkboxes with bg-primary (checked state styling)
      const checkedCheckbox = page.locator('button[role="checkbox"].bg-primary').first()
      await expect(checkedCheckbox.locator('svg')).toBeVisible()
    })

    test('unchecked checkbox has no checkmark', async ({ page }) => {
      const uncheckedCheckbox = page.locator('button[role="checkbox"].bg-background').first()
      await expect(uncheckedCheckbox.locator('svg')).not.toBeVisible()
    })
  })

  test.describe('Disabled State', () => {
    test('displays disabled checkboxes', async ({ page }) => {
      const disabledCheckboxes = page.locator('button[role="checkbox"][disabled]')
      await expect(disabledCheckboxes).toHaveCount(2)
    })
  })

  test.describe('State Binding', () => {
    test('displays binding example section', async ({ page }) => {
      // Use .first() to avoid strict mode error (parent and child both have matching scope)
      await expect(page.locator('div[data-bf-scope^="CheckboxBindingDemo_"]').first()).toBeVisible()
    })

    test('shows initial unchecked state', async ({ page }) => {
      const status = page.locator('.checked-status')
      await expect(status).toContainText('Unchecked')
    })

    test('toggles to checked state on first click', async ({ page }) => {
      const bindingSection = page.locator('div[data-bf-scope^="CheckboxBindingDemo_"]').first()
      const checkbox = bindingSection.locator('button[role="checkbox"]')
      const status = page.locator('.checked-status')

      // Initial state
      await expect(status).toContainText('Unchecked')

      // Click to check
      await checkbox.click()
      await expect(status).toContainText('Checked')
    })
  })

  test.describe('With Label', () => {
    test('displays with label example', async ({ page }) => {
      // Use .first() to avoid strict mode error (parent and child both have matching scope)
      await expect(page.locator('div[data-bf-scope^="CheckboxWithLabelDemo_"]').first()).toBeVisible()
    })

    test('shows initial not accepted state', async ({ page }) => {
      const status = page.locator('.terms-status')
      await expect(status).toContainText('Not accepted')
    })

    test('toggles to accepted on first click', async ({ page }) => {
      const labelExample = page.locator('div[data-bf-scope^="CheckboxWithLabelDemo_"]').first()
      const checkbox = labelExample.locator('button[role="checkbox"]')
      const status = page.locator('.terms-status')

      // Click to accept
      await checkbox.click()
      await expect(status).toContainText('Accepted')
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
      await expect(propsTable.locator('td').filter({ hasText: /^checked$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onCheckedChange$/ })).toBeVisible()
    })
  })
})

test.describe('Home Page - Checkbox Link', () => {
  test('displays Checkbox component link', async ({ page }) => {
    await page.goto('/')
    // Use main content area selector to avoid sidebar duplicates
    const mainContent = page.locator('main')
    await expect(mainContent.locator('a[href="/docs/components/checkbox"]')).toBeVisible()
    await expect(mainContent.locator('a[href="/docs/components/checkbox"] h2')).toContainText('Checkbox')
  })

  test('navigates to Checkbox page on click', async ({ page }) => {
    await page.goto('/')
    // Use main content area selector to avoid sidebar duplicates
    const mainContent = page.locator('main')
    await mainContent.locator('a[href="/docs/components/checkbox"]').click()
    await expect(page).toHaveURL('/docs/components/checkbox')
    await expect(page.locator('h1')).toContainText('Checkbox')
  })
})
