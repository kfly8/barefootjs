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
      // Should have checkboxes on the page (preview + examples)
      expect(await checkboxes.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Preview (Terms Demo)', () => {
    test('displays preview with checkbox and button', async ({ page }) => {
      // Use first() to avoid strict mode error (parent and child both have matching scope)
      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
      await expect(section.locator('button[role="checkbox"]')).toBeVisible()
      await expect(section.locator('button:has-text("Continue")')).toBeVisible()
    })

    test('button is disabled when unchecked', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo_"]:not([data-slot])').first()
      const button = section.locator('button:has-text("Continue")')
      await expect(button).toBeDisabled()
    })

    test('button enables when checkbox is checked', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')
      const button = section.locator('button:has-text("Continue")')

      await checkbox.dispatchEvent('click')
      await expect(button).toBeEnabled()
    })
  })

  test.describe('With Text', () => {
    test('displays with text example', async ({ page }) => {
      await expect(page.locator('h3:has-text("With Text")')).toBeVisible()
      await expect(page.locator('[data-bf-scope^="CheckboxWithTextDemo_"]:not([data-slot])').first()).toBeVisible()
    })

    test('shows label and description', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxWithTextDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Accept terms and conditions')).toBeVisible()
      await expect(section.locator('text=You agree to our Terms')).toBeVisible()
    })

    test('toggles on click', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxWithTextDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')

      await expect(checkbox).toHaveAttribute('aria-checked', 'false')
      await checkbox.dispatchEvent('click')
      await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })

  test.describe('Disabled', () => {
    test('displays disabled example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Disabled")')).toBeVisible()
      await expect(page.locator('[data-bf-scope^="CheckboxDisabledDemo_"]:not([data-slot])').first()).toBeVisible()
    })

    test('checkbox is disabled', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxDisabledDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')
      await expect(checkbox).toBeDisabled()
    })
  })

  test.describe('Form', () => {
    test('displays form example with multiple checkboxes', async ({ page }) => {
      await expect(page.locator('h3:has-text("Form")')).toBeVisible()
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      // Should have 3 checkboxes (Mobile, Desktop, Email)
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes).toHaveCount(3)
    })

    test('shows sidebar heading and description', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('h4:has-text("Sidebar")')).toBeVisible()
      await expect(section.locator('text=Select the items you want')).toBeVisible()
    })

    test('Desktop is checked by default', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Desktop is the second checkbox
      const desktopCheckbox = checkboxes.nth(1)
      await expect(desktopCheckbox).toHaveAttribute('aria-checked', 'true')
    })

    test('shows selected items', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Selected:')).toBeVisible()
      // Use first() since "Desktop" appears twice (label and selected text)
      await expect(section.locator('text=Desktop').first()).toBeVisible()
    })

    test('updates selection when checkboxes are toggled', async ({ page }) => {
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      const selectedText = section.locator('text=/Selected:/')

      // Click Mobile (first checkbox)
      await checkboxes.first().dispatchEvent('click')
      await expect(selectedText).toContainText('Mobile')
      await expect(selectedText).toContainText('Desktop')
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
