import { test, expect } from '@playwright/test'

test.describe('Toggle Group Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/toggle-group')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Toggle Group')
    await expect(page.locator('text=A set of two-state buttons that can be toggled on or off.')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Toggle Group Rendering', () => {
    test('displays toggle-group elements with data-slot', async ({ page }) => {
      const groups = page.locator('[data-slot="toggle-group"]')
      await expect(groups.first()).toBeVisible()
    })

    test('has toggle-group-item elements', async ({ page }) => {
      const items = page.locator('[data-slot="toggle-group-item"]')
      expect(await items.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Basic', () => {
    test('displays basic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three toggle items', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      await expect(items).toHaveCount(3)
    })

    test('center item starts selected (defaultValue)', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      // center is the second item (index 1)
      await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')
      await expect(items.nth(1)).toHaveAttribute('data-state', 'on')
    })

    test('other items start unselected', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'false')
      await expect(items.nth(0)).toHaveAttribute('data-state', 'off')
      await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'false')
      await expect(items.nth(2)).toHaveAttribute('data-state', 'off')
    })

    test('single select: clicking one deselects others', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Center (index 1) is initially selected
      await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')

      // Click left (index 0)
      await items.nth(0).click()

      // Left should be selected, center should be deselected
      await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true')
      await expect(items.nth(0)).toHaveAttribute('data-state', 'on')
      await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'false')
      await expect(items.nth(1)).toHaveAttribute('data-state', 'off')
    })

    test('preview text alignment changes with selection', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupBasicDemo_"]:not([data-slot])').first()
      const preview = section.locator('[data-testid="alignment-preview"]')
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Default: center alignment
      await expect(preview).toHaveClass(/text-center/)

      // Click left
      await items.nth(0).click()
      await expect(preview).toHaveClass(/text-left/)

      // Click right
      await items.nth(2).click()
      await expect(preview).toHaveClass(/text-right/)
    })
  })

  test.describe('Outline', () => {
    test('displays outline example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Outline")')).toBeVisible()
      const section = page.locator('[bf-s^="ToggleGroupOutlineDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three toggle items', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupOutlineDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      await expect(items).toHaveCount(3)
    })

    test('group has outline variant attribute', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupOutlineDemo_"]:not([data-slot])').first()
      const group = section.locator('[data-slot="toggle-group"]')
      await expect(group).toHaveAttribute('data-variant', 'outline')
    })

    test('preview font size changes with selection', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupOutlineDemo_"]:not([data-slot])').first()
      const preview = section.locator('[data-testid="fontsize-preview"]')
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Default: M (text-base)
      await expect(preview).toHaveClass(/text-base/)

      // Click S
      await items.nth(0).click()
      await expect(preview).toHaveClass(/text-sm/)

      // Click L
      await items.nth(2).click()
      await expect(preview).toHaveClass(/text-lg/)
    })
  })

  test.describe('Multiple', () => {
    test('displays multiple example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Multiple")')).toBeVisible()
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three toggle items', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      await expect(items).toHaveCount(3)
    })

    test('all items start unselected', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')
      for (let i = 0; i < 3; i++) {
        await expect(items.nth(i)).toHaveAttribute('aria-pressed', 'false')
      }
    })

    test('multiple items can be active simultaneously', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Click Bold and Italic
      await items.nth(0).click()
      await items.nth(1).click()

      // Both should be selected
      await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true')
      await expect(items.nth(0)).toHaveAttribute('data-state', 'on')
      await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')
      await expect(items.nth(1)).toHaveAttribute('data-state', 'on')
      // Third should still be unselected
      await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'false')
    })

    test('clicking active item deselects it', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Select Bold
      await items.nth(0).click()
      await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true')

      // Deselect Bold
      await items.nth(0).click()
      await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'false')
    })

    test('preview text formatting changes with selection', async ({ page }) => {
      const section = page.locator('[bf-s^="ToggleGroupMultipleDemo_"]:not([data-slot])').first()
      const preview = section.locator('[data-testid="format-preview"]')
      const items = section.locator('[data-slot="toggle-group-item"]')

      // Initially no formatting
      await expect(preview).not.toHaveClass(/font-bold/)
      await expect(preview).not.toHaveClass(/italic/)
      await expect(preview).not.toHaveClass(/underline/)

      // Click Bold
      await items.nth(0).click()
      await expect(preview).toHaveClass(/font-bold/)

      // Click Italic
      await items.nth(1).click()
      await expect(preview).toHaveClass(/font-bold/)
      await expect(preview).toHaveClass(/italic/)

      // Click Underline
      await items.nth(2).click()
      await expect(preview).toHaveClass(/font-bold/)
      await expect(preview).toHaveClass(/italic/)
      await expect(preview).toHaveClass(/underline/)

      // Deselect Bold
      await items.nth(0).click()
      await expect(preview).not.toHaveClass(/font-bold/)
      await expect(preview).toHaveClass(/italic/)
      await expect(preview).toHaveClass(/underline/)
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays props table headers', async ({ page }) => {
      await expect(page.locator('th:has-text("Prop")').first()).toBeVisible()
      await expect(page.locator('th:has-text("Type")').first()).toBeVisible()
      await expect(page.locator('th:has-text("Default")').first()).toBeVisible()
      await expect(page.locator('th:has-text("Description")').first()).toBeVisible()
    })

    test('displays ToggleGroup props', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ToggleGroup', exact: true })).toBeVisible()
      const tables = page.locator('table')
      await expect(tables.first().locator('td').filter({ hasText: /^type$/ })).toBeVisible()
      await expect(tables.first().locator('td').filter({ hasText: /^variant$/ })).toBeVisible()
      await expect(tables.first().locator('td').filter({ hasText: /^size$/ })).toBeVisible()
      await expect(tables.first().locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(tables.first().locator('td').filter({ hasText: /^onValueChange$/ })).toBeVisible()
    })

    test('displays ToggleGroupItem props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToggleGroupItem")')).toBeVisible()
      const tables = page.locator('table')
      await expect(tables.nth(1).locator('td').filter({ hasText: /^value$/ })).toBeVisible()
      await expect(tables.nth(1).locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
    })
  })
})
