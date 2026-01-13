import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Dropdown Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/dropdown')
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
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      // Dropdown content should be visible
      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=Apple')).toBeVisible()
    })

    test('closes dropdown when trigger is clicked again', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Open
      await trigger.click()
      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toHaveClass(/opacity-100/)

      // Close
      await trigger.click()
      // Should have closed state (opacity-0, pointer-events-none)
      await expect(content).toHaveClass(/opacity-0/)
      await expect(content).toHaveClass(/pointer-events-none/)
    })

    test('selects an item when clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      // Open dropdown
      await trigger.click()

      // Click on "Banana" option
      const content = basicDemo.locator('[data-dropdown-content]')
      await content.locator('text=Banana').click()

      // Dropdown should close (opacity-0) and trigger should show selected value
      await expect(content).toHaveClass(/opacity-0/)
      await expect(trigger).toContainText('Banana')
    })

    test('shows checkmark on selected item', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
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
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toHaveClass(/opacity-100/)

      // Focus the content and press ESC
      await content.focus()
      await page.keyboard.press('Escape')

      // Should close (opacity-0)
      await expect(content).toHaveClass(/opacity-0/)
    })

    test('has correct accessibility attributes on trigger', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
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
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = basicDemo.locator('[data-dropdown-content]')
      await expect(content).toHaveAttribute('role', 'listbox')
    })

    test('has correct accessibility attributes on items', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
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
      const defaultDemo = page.locator('[data-bf-scope^="DropdownWithDefaultDemo_"]').first()
      const trigger = defaultDemo.locator('[data-dropdown-trigger]')

      // Should show "Medium" as default
      await expect(trigger).toContainText('Medium')
    })

    test('can change selection from default', async ({ page }) => {
      const defaultDemo = page.locator('[data-bf-scope^="DropdownWithDefaultDemo_"]').first()
      const trigger = defaultDemo.locator('[data-dropdown-trigger]')

      await trigger.click()

      const content = defaultDemo.locator('[data-dropdown-content]')
      await content.locator('[data-value="large"]').click()

      await expect(trigger).toContainText('Large')
    })
  })

  test.describe('Disabled Dropdown', () => {
    test('displays disabled dropdown', async ({ page }) => {
      const disabledDemo = page.locator('[data-bf-scope^="DropdownDisabledDemo_"]').first()
      const trigger = disabledDemo.locator('[data-dropdown-trigger]')

      await expect(trigger).toBeDisabled()
    })

    test('does not open when clicked', async ({ page }) => {
      const disabledDemo = page.locator('[data-bf-scope^="DropdownDisabledDemo_"]').first()
      const trigger = disabledDemo.locator('[data-dropdown-trigger]')
      const content = disabledDemo.locator('[data-dropdown-content]')

      // Try to click (should not work)
      await trigger.click({ force: true })

      // Content should remain closed (opacity-0)
      await expect(content).toHaveClass(/opacity-0/)
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

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page - Dropdown Link', () => {
  test('displays Dropdown component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/dropdown"]')).toBeVisible()
    await expect(page.locator('a[href="/components/dropdown"] h2')).toContainText('Dropdown')
  })

  test('navigates to Dropdown page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/dropdown"]')
    await expect(page).toHaveURL('/docs/dropdown')
    await expect(page.locator('h1')).toContainText('Dropdown')
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Dropdown Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/dropdown')
  })

  test('opens with scale and fade animation from trigger', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    // Initially should have opacity-0 and scale-95 classes
    await expect(content).toHaveClass(/opacity-0/)
    await expect(content).toHaveClass(/scale-95/)

    // Open dropdown
    await trigger.click()

    // After opening should have opacity-100 and scale-100 classes
    await expect(content).toHaveClass(/opacity-100/)
    await expect(content).toHaveClass(/scale-100/)
  })

  test('closes with scale and fade animation', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()
    await expect(content).toHaveClass(/opacity-100/)

    // Close dropdown
    await trigger.click()

    // After closing should return to closed state
    await expect(content).toHaveClass(/opacity-0/)
    await expect(content).toHaveClass(/scale-95/)
  })

  test('has transform-origin at top for natural expand direction', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const content = basicDemo.locator('[data-dropdown-content]')

    // Should have origin-top class for transform-origin
    await expect(content).toHaveClass(/origin-top/)
  })

  test('no content jump when animation completes', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()

    // Wait for animation to complete (200ms transition)
    await page.waitForTimeout(250)

    // Get position after animation
    const positionAfterAnimation = await content.boundingBox()

    // Wait a bit more to ensure no jump
    await page.waitForTimeout(100)

    // Get position again
    const positionStable = await content.boundingBox()

    // Positions should be the same (no jump)
    expect(positionAfterAnimation?.x).toBe(positionStable?.x)
    expect(positionAfterAnimation?.y).toBe(positionStable?.y)
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Dropdown with CSS Transforms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/dropdown')
  })

  test('opens and positions correctly inside scaled container', async ({ page }) => {
    const container = page.locator('[data-transform-container]')
    const dropdown = container.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()

    // Content should be visible
    await expect(content).toBeVisible()
    await expect(content).toHaveClass(/opacity-100/)

    // Get positions
    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()

    // Content should be positioned below trigger
    expect(contentBox).not.toBeNull()
    expect(triggerBox).not.toBeNull()
    if (contentBox && triggerBox) {
      // Content top should be near trigger bottom (with small margin)
      expect(contentBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 5)
    }
  })

  test('opens and positions correctly inside rotated container', async ({ page }) => {
    const container = page.locator('[data-transform-container-rotate]')
    const dropdown = container.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()

    // Content should be visible
    await expect(content).toBeVisible()
    await expect(content.locator('text=Option 1')).toBeVisible()
  })

  test('opens and positions correctly inside translated container', async ({ page }) => {
    const container = page.locator('[data-transform-container-translate]')
    // Scroll container into view to ensure dropdown is not covered by other elements
    await container.scrollIntoViewIfNeeded()

    const dropdown = container.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()

    // Content should be visible (items are accessible)
    await expect(content.locator('text=Option 1')).toBeVisible()
  })

  test('selection works correctly in transformed container', async ({ page }) => {
    const container = page.locator('[data-transform-container]')
    const dropdown = container.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open and select
    await trigger.click()
    await content.locator('[data-value="option1"]').click()

    // Dropdown should close
    await expect(content).toHaveClass(/opacity-0/)

    // Selected value should be displayed
    await expect(trigger).toContainText('Option 1')

    // Open again and verify checkmark
    await trigger.click()
    const selectedItem = content.locator('[role="option"][aria-selected="true"]')
    await expect(selectedItem).toContainText('Option 1')
  })

  test('ESC key works in transformed container', async ({ page }) => {
    const container = page.locator('[data-transform-container]')
    const dropdown = container.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()
    await expect(content).toHaveClass(/opacity-100/)

    // Press ESC
    await content.focus()
    await page.keyboard.press('Escape')

    // Should close
    await expect(content).toHaveClass(/opacity-0/)
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Dropdown Viewport Edge Positioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/dropdown')
  })

  test('dropdown near bottom of viewport still displays correctly', async ({ page }) => {
    // Scroll to make the CSS transform section visible near bottom
    const transformSection = page.locator('[data-transform-container-translate]')
    await transformSection.scrollIntoViewIfNeeded()

    const dropdown = transformSection.locator('[data-bf-scope^="DropdownWithTransformDemo_"]').first()
    const trigger = dropdown.locator('[data-dropdown-trigger]')
    const content = dropdown.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()

    // Content should be visible
    await expect(content).toBeVisible()
    await expect(content.locator('text=Option 1')).toBeVisible()
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Dropdown Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/dropdown')
  })

  test('ArrowDown navigates to next item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    // Open dropdown
    await trigger.click()
    await expect(content).toHaveClass(/opacity-100/)

    // Focus the content and press ArrowDown
    await content.focus()
    await page.keyboard.press('ArrowDown')

    // First item should be focused
    const items = content.locator('[data-dropdown-item]')
    await expect(items.first()).toBeFocused()
  })

  test('ArrowDown cycles through items', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // Navigate to first item
    await page.keyboard.press('ArrowDown')
    const items = content.locator('[data-dropdown-item]')
    await expect(items.nth(0)).toBeFocused()

    // Navigate to second item
    await page.keyboard.press('ArrowDown')
    await expect(items.nth(1)).toBeFocused()

    // Navigate to third item
    await page.keyboard.press('ArrowDown')
    await expect(items.nth(2)).toBeFocused()
  })

  test('ArrowUp navigates to previous item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // ArrowUp from no focus should go to last item
    await page.keyboard.press('ArrowUp')
    const items = content.locator('[data-dropdown-item]')
    await expect(items.last()).toBeFocused()
  })

  test('ArrowDown wraps from last to first item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    const items = content.locator('[data-dropdown-item]')
    const itemCount = await items.count()

    // Navigate to last item
    for (let i = 0; i < itemCount; i++) {
      await page.keyboard.press('ArrowDown')
    }

    // Press ArrowDown again should wrap to first
    await page.keyboard.press('ArrowDown')
    await expect(items.first()).toBeFocused()
  })

  test('Enter selects focused item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // Navigate to second item (Banana)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Press Enter to select
    await page.keyboard.press('Enter')

    // Dropdown should close and show selected value
    await expect(content).toHaveClass(/opacity-0/)
    await expect(trigger).toContainText('Banana')
  })

  test('Space selects focused item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // Navigate to third item (Cherry)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Press Space to select
    await page.keyboard.press(' ')

    // Dropdown should close and show selected value
    await expect(content).toHaveClass(/opacity-0/)
    await expect(trigger).toContainText('Cherry')
  })

  test('Home key navigates to first item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // Navigate down a few times
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Press Home to go to first
    await page.keyboard.press('Home')

    const items = content.locator('[data-dropdown-item]')
    await expect(items.first()).toBeFocused()
  })

  test('End key navigates to last item', async ({ page }) => {
    const basicDemo = page.locator('[data-bf-scope^="DropdownBasicDemo_"]').first()
    const trigger = basicDemo.locator('[data-dropdown-trigger]')
    const content = basicDemo.locator('[data-dropdown-content]')

    await trigger.click()
    await content.focus()

    // Press End to go to last
    await page.keyboard.press('End')

    const items = content.locator('[data-dropdown-item]')
    await expect(items.last()).toBeFocused()
  })
})
