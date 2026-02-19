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
      const section = page.locator('[bf-s^="CheckboxTermsDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
      await expect(section.locator('button[role="checkbox"]')).toBeVisible()
      await expect(section.locator('button:has-text("Continue")')).toBeVisible()
    })

    test('button is disabled when unchecked', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxTermsDemo_"]:not([data-slot])').first()
      const button = section.locator('button:has-text("Continue")')
      await expect(button).toBeDisabled()
    })

    test('button enables when checkbox is checked', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxTermsDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')
      const button = section.locator('button:has-text("Continue")')

      await checkbox.dispatchEvent('click')
      await expect(button).toBeEnabled()
    })

    test('clicking label shows checkmark SVG in checkbox', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxTermsDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')
      const label = section.locator('text=I agree to the terms and conditions')

      // Initially no checkmark
      await expect(checkbox.locator('svg[data-slot="checkbox-indicator"]')).not.toBeVisible()

      // Click the label (which triggers setAccepted via handleLabelClick)
      await label.click()

      // Checkbox should show checkmark SVG
      // First wait for data-state to be checked (confirms state update is complete)
      await expect(checkbox).toHaveAttribute('data-state', 'checked')
      await expect(checkbox).toHaveAttribute('aria-checked', 'true')
      // Then check SVG (use more specific selector)
      await expect(checkbox.locator('svg[data-slot="checkbox-indicator"]')).toBeVisible()
    })
  })

  test.describe('Basic', () => {
    test('displays basic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three checkboxes', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes).toHaveCount(3)
    })

    test('first checkbox starts unchecked', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes.first()).toHaveAttribute('aria-checked', 'false')
    })

    test('second checkbox starts checked (defaultChecked)', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes.nth(1)).toHaveAttribute('aria-checked', 'true')
    })

    test('third checkbox is disabled', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes.nth(2)).toBeDisabled()
    })

    test('clicking toggles checkbox state', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxBasicDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]').first()

      // Initially unchecked
      await expect(checkbox).toHaveAttribute('aria-checked', 'false')

      // Click to check
      await checkbox.click()
      await expect(checkbox).toHaveAttribute('aria-checked', 'true')

      // Click to uncheck
      await checkbox.click()
      await expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  test.describe('Form', () => {
    test('displays form example with multiple checkboxes', async ({ page }) => {
      await expect(page.locator('h3:has-text("Form")')).toBeVisible()
      const section = page.locator('[bf-s^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      // Should have 3 checkboxes (Mobile, Desktop, Email)
      const checkboxes = section.locator('button[role="checkbox"]')
      await expect(checkboxes).toHaveCount(3)
    })

    test('shows sidebar heading and description', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('h4:has-text("Sidebar")')).toBeVisible()
      await expect(section.locator('text=Select the items you want')).toBeVisible()
    })

    test('Desktop is checked by default', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxFormDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Desktop is the second checkbox
      const desktopCheckbox = checkboxes.nth(1)
      await expect(desktopCheckbox).toHaveAttribute('aria-checked', 'true')
    })

    test('shows selected items', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Selected:')).toBeVisible()
      // Use first() since "Desktop" appears twice (label and selected text)
      await expect(section.locator('text=Desktop').first()).toBeVisible()
    })

    test('updates selection when checkboxes are toggled', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxFormDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')
      const selectedText = section.locator('text=/Selected:/')

      // Click Mobile (first checkbox)
      await checkboxes.first().dispatchEvent('click')
      await expect(selectedText).toContainText('Mobile')
      await expect(selectedText).toContainText('Desktop')
    })
  })

  test.describe('Email List', () => {
    test('displays email list example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Email List")')).toBeVisible()
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('shows select all checkbox and items', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Select all')).toBeVisible()
      await expect(section.locator('text=Meeting tomorrow')).toBeVisible()
    })

    test('can select individual emails', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // First checkbox is "select all", second is first email
      const firstEmailCheckbox = checkboxes.nth(1)
      await firstEmailCheckbox.dispatchEvent('click')

      // Should show "1 selected"
      await expect(section.locator('text=1 selected')).toBeVisible()
    })

    test('select all shows checkmark SVG in all email checkboxes', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Click "Select all" checkbox (first one)
      const selectAllCheckbox = checkboxes.first()
      await selectAllCheckbox.click()

      // Should show "3 selected"
      await expect(section.locator('text=3 selected')).toBeVisible()

      // All 4 checkboxes should have checkmark SVG (select all + 3 emails)
      for (let i = 0; i < 4; i++) {
        const checkbox = checkboxes.nth(i)
        // First wait for data-state to be checked (confirms state update is complete)
        await expect(checkbox).toHaveAttribute('data-state', 'checked')
        // Then check SVG (use more specific selector to avoid stale reference)
        await expect(checkbox.locator('svg[data-slot="checkbox-indicator"]')).toBeVisible()
      }
    })
  })

  test.describe('Email List Detailed Behavior', () => {
    test('initial state: all unchecked, shows "Select all"', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // All 4 checkboxes unchecked
      for (let i = 0; i < 4; i++) {
        await expect(checkboxes.nth(i)).toHaveAttribute('aria-checked', 'false')
      }
      // Shows "Select all"
      await expect(section.locator('text=Select all')).toBeVisible()
      await expect(section.locator('text=selected')).not.toBeVisible()
    })

    test('selecting 1 email shows "1 selected"', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      await checkboxes.nth(1).dispatchEvent('click')
      await expect(section.locator('text=1 selected')).toBeVisible()
    })

    test('selecting 2 emails shows "2 selected"', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      await checkboxes.nth(1).dispatchEvent('click')
      await checkboxes.nth(2).dispatchEvent('click')
      await expect(section.locator('text=2 selected')).toBeVisible()
    })

    test('selecting all 3 emails shows "3 selected" and checks "Select all"', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      await checkboxes.nth(1).dispatchEvent('click')
      await checkboxes.nth(2).dispatchEvent('click')
      await checkboxes.nth(3).dispatchEvent('click')

      await expect(section.locator('text=3 selected')).toBeVisible()
      await expect(checkboxes.first()).toHaveAttribute('aria-checked', 'true') // Select all
    })

    test('unselecting one email updates count', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Select 2
      await checkboxes.nth(1).dispatchEvent('click')
      await checkboxes.nth(2).dispatchEvent('click')
      await expect(section.locator('text=2 selected')).toBeVisible()

      // Unselect 1
      await checkboxes.nth(1).dispatchEvent('click')
      await expect(section.locator('text=1 selected')).toBeVisible()
    })

    test('unselecting all returns to "Select all"', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Select 1, then unselect
      await checkboxes.nth(1).dispatchEvent('click')
      await checkboxes.nth(1).dispatchEvent('click')

      await expect(section.locator('text=Select all')).toBeVisible()
    })

    test('clicking "Select all" when partially selected selects all', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Select 1 email first
      await checkboxes.nth(1).dispatchEvent('click')
      await expect(section.locator('text=1 selected')).toBeVisible()

      // Click "Select all"
      await checkboxes.first().dispatchEvent('click')

      // All should be selected
      await expect(section.locator('text=3 selected')).toBeVisible()
      for (let i = 0; i < 4; i++) {
        await expect(checkboxes.nth(i)).toHaveAttribute('aria-checked', 'true')
      }
    })

    test('"Mark as read" appears only when selection > 0', async ({ page }) => {
      const section = page.locator('[bf-s^="CheckboxEmailListDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('button[role="checkbox"]')

      // Initially hidden
      await expect(section.locator('text=Mark as read')).not.toBeVisible()

      // Select one - visible
      await checkboxes.nth(1).dispatchEvent('click')
      await expect(section.locator('text=1 selected')).toBeVisible() // Wait for selection update
      await expect(section.locator('text=Mark as read')).toBeVisible()

      // Unselect - hidden again
      await checkboxes.nth(1).dispatchEvent('click')
      await expect(section.locator('text=Select all')).toBeVisible() // Wait for selection reset
      await expect(section.locator('text=Mark as read')).not.toBeVisible()
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
