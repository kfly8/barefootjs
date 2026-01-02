import { test, expect } from '@playwright/test'

test.describe('Dropdown Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/dropdown')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dropdown')
    await expect(page.locator('text=A select-like dropdown menu')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add dropdown')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("Props-based state")')).toBeVisible()
    await expect(page.locator('strong:has-text("ESC key to close")')).toBeVisible()
    await expect(page.locator('strong:has-text("Click to select")')).toBeVisible()
    await expect(page.locator('strong:has-text("Accessibility")')).toBeVisible()
  })

  test.describe('Basic Dropdown', () => {
    test('opens dropdown when trigger is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      // Dropdown content should be visible
      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=Apple')).toBeVisible()
    })

    test('closes dropdown when trigger is clicked again', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Open
      await trigger.click()
      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toBeVisible()

      // Close
      await trigger.click()
      await expect(content).not.toBeVisible()
    })

    test('selects an item when clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Open dropdown
      await trigger.click()

      // Click on "Banana" option
      const content = basicDemo.locator('[data-dropdown-content]')
      await content.locator('text=Banana').click()

      // Dropdown should close and trigger should show selected value
      await expect(content).not.toBeVisible()
      await expect(trigger).toContainText('Banana')
    })

    test('shows checkmark on selected item', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Select an item first
      await trigger.click()
      const content = basicDemo.locator('[data-dropdown-content]')
      await content.locator('text=Cherry').click()

      // Open dropdown again
      await trigger.click()

      // Selected item should have aria-selected="true"
      const selectedItem = content.locator('[role="option"][aria-selected="true"]')
      await expect(selectedItem).toBeVisible()
      await expect(selectedItem).toContainText('Cherry')
    })

    test('closes dropdown when ESC key is pressed', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toBeVisible()

      // Focus the content and press ESC
      await content.focus()
      await page.keyboard.press('Escape')

      await expect(content).not.toBeVisible()
    })

    test('has correct accessibility attributes on trigger', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Initially closed
      await expect(trigger).toHaveAttribute('role', 'combobox')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')

      // After opening
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    test('has correct accessibility attributes on content', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toHaveAttribute('role', 'listbox')
    })

    test('has correct accessibility attributes on items', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DropdownBasicDemo"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = basicDemo.locator('[data-dropdown-content]')
      const items = content.locator('[role="option"]')
      expect(await items.count()).toBe(4)

      // Check first item
      const firstItem = items.first()
      await expect(firstItem).toHaveAttribute('role', 'option')
      await expect(firstItem).toHaveAttribute('aria-selected', 'false')
    })
  })

  test.describe('Dropdown with Default Value', () => {
    test('displays default selected value', async ({ page }) => {
      const defaultDemo = page.locator('[data-bf-scope="DropdownWithDefaultDemo"]').first()
      const trigger = defaultDemo.locator('[data-dropdown-trigger]')

      // Should show "Medium" as default
      await expect(trigger).toContainText('Medium')
    })

    test('can change selection from default', async ({ page }) => {
      const defaultDemo = page.locator('[data-bf-scope="DropdownWithDefaultDemo"]').first()
      const trigger = defaultDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = defaultDemo.locator('[data-dropdown-content]')
      await content.locator('[data-value="large"]').click()

      await expect(trigger).toContainText('Large')
    })
  })

  test.describe('Disabled Dropdown', () => {
    test('displays disabled dropdown', async ({ page }) => {
      const disabledDemo = page.locator('[data-bf-scope="DropdownDisabledDemo"]').first()
      const trigger = disabledDemo.locator('[data-dropdown-trigger]')

      await expect(trigger).toBeDisabled()
    })

    test('does not open when clicked', async ({ page }) => {
      const disabledDemo = page.locator('[data-bf-scope="DropdownDisabledDemo"]').first()
      const trigger = disabledDemo.locator('[data-dropdown-trigger]')
      const content = disabledDemo.locator('[data-dropdown-content]')

      // Try to click (should not work)
      await trigger.click({ force: true })

      // Content should remain hidden
      await expect(content).not.toBeVisible()
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays DropdownTrigger props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DropdownTrigger")')).toBeVisible()
    })

    test('displays DropdownContent props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DropdownContent")')).toBeVisible()
    })

    test('displays DropdownItem props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DropdownItem")')).toBeVisible()
    })

    test('displays DropdownLabel props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DropdownLabel")')).toBeVisible()
    })
  })
})

test.describe('Home Page - Dropdown Link', () => {
  test('displays Dropdown component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/dropdown"]')).toBeVisible()
    await expect(page.locator('a[href="/components/dropdown"] h2')).toContainText('Dropdown')
  })

  test('navigates to Dropdown page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/dropdown"]')
    await expect(page).toHaveURL('/components/dropdown')
    await expect(page.locator('h1')).toContainText('Dropdown')
  })
})
