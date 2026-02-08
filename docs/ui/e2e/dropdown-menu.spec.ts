import { test, expect } from '@playwright/test'

test.describe('DropdownMenu Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/dropdown-menu')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dropdown Menu')
    await expect(page.locator('text=A menu of actions triggered by a button')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx --bun barefoot add dropdown-menu').first()).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("Props-based state")')).toBeVisible()
    await expect(page.locator('strong:has-text("Flexible trigger")')).toBeVisible()
    await expect(page.locator('strong:has-text("ESC key to close")')).toBeVisible()
    await expect(page.locator('strong:has-text("Accessibility")')).toBeVisible()
  })

  test.describe('Profile Menu Demo', () => {
    // Content is portaled to body, so use page-level locator after trigger click.
    // Only one menu is open at a time, so [data-state="open"] uniquely identifies it.

    test('opens menu when avatar trigger is clicked', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=Settings')).toBeVisible()
    })

    test('has correct ARIA roles', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await trigger.click()

      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await expect(content).toHaveAttribute('role', 'menu')

      const items = content.locator('[role="menuitem"]')
      expect(await items.count()).toBeGreaterThan(0)
    })

    test('displays menu label', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      const label = content.locator('[data-slot="dropdown-menu-label"]')
      await expect(label).toContainText('My Account')
    })

    test('displays separators', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      const separators = content.locator('[data-slot="dropdown-menu-separator"]')
      expect(await separators.count()).toBeGreaterThanOrEqual(2)
    })

    test('displays keyboard shortcut', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      const shortcut = content.locator('[data-slot="dropdown-menu-shortcut"]')
      await expect(shortcut.first()).toBeVisible()
    })

    test('closes on ESC', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const openContent = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await expect(openContent).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(openContent).toHaveCount(0)
    })

    test('closes on click outside', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const openContent = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await expect(openContent).toBeVisible()

      // Click outside the menu (on the page header)
      await page.locator('h1').click()
      await expect(openContent).toHaveCount(0)
    })

    test('closes on item click', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const openContent = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      const item = openContent.locator('[data-slot="dropdown-menu-item"]').first()
      await item.click()

      await expect(openContent).toHaveCount(0)
    })

    test('keyboard navigation with arrow keys', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await content.focus()

      // Arrow down should focus first item
      await page.keyboard.press('ArrowDown')
      const firstItem = content.locator('[data-slot="dropdown-menu-item"]').first()
      await expect(firstItem).toBeFocused()

      // Arrow down again should focus second item
      await page.keyboard.press('ArrowDown')
      const secondItem = content.locator('[data-slot="dropdown-menu-item"]').nth(1)
      await expect(secondItem).toBeFocused()

      // Arrow up should go back to first item
      await page.keyboard.press('ArrowUp')
      await expect(firstItem).toBeFocused()
    })

    test('Home/End key navigation', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuProfileDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await content.focus()

      // End should focus last item
      await page.keyboard.press('End')
      const items = content.locator('[data-slot="dropdown-menu-item"]')
      const lastItem = items.last()
      await expect(lastItem).toBeFocused()

      // Home should focus first item
      await page.keyboard.press('Home')
      const firstItem = items.first()
      await expect(firstItem).toBeFocused()
    })
  })

  test.describe('asChild Trigger', () => {
    test('renders trigger with ARIA attributes via display:contents wrapper', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuAsChildDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')

      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Child button is inside the trigger wrapper
      const childButton = trigger.locator('button')
      await expect(childButton).toHaveAttribute('aria-label', 'Actions')
    })

    test('aria-expanded updates reactively on asChild trigger', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuAsChildDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')
      const childButton = trigger.locator('button')

      await expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await childButton.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await childButton.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('click toggles menu open/close on asChild trigger', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuAsChildDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')
      const childButton = trigger.locator('button')

      await childButton.click()
      const openContent = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await expect(openContent).toBeVisible()

      await childButton.click()
      await expect(openContent).toHaveCount(0)
    })

    test('keyboard navigation works with asChild trigger', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="DropdownMenuAsChildDemo_"]').first()
      const trigger = demo.locator('[data-slot="dropdown-menu-trigger"]')
      const childButton = trigger.locator('button')

      await childButton.click()

      const content = page.locator('[data-slot="dropdown-menu-content"][data-state="open"]')
      await content.focus()

      await page.keyboard.press('ArrowDown')
      const firstItem = content.locator('[data-slot="dropdown-menu-item"]').first()
      await expect(firstItem).toBeFocused()

      await page.keyboard.press('Escape')
      await expect(content).toHaveCount(0)
    })
  })

  test.describe('Accessibility', () => {
    test('displays accessibility section', async ({ page }) => {
      await expect(page.locator('h2:has-text("Accessibility")')).toBeVisible()
      await expect(page.locator('strong:has-text("Keyboard Navigation")')).toBeVisible()
      await expect(page.locator('strong:has-text("ARIA")')).toBeVisible()
    })
  })

  test.describe('API Reference', () => {
    test('displays API reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
      await expect(page.locator('h3:text-is("DropdownMenu")')).toBeVisible()
      await expect(page.locator('h3:has-text("DropdownMenuTrigger")')).toBeVisible()
      await expect(page.locator('h3:has-text("DropdownMenuContent")')).toBeVisible()
      await expect(page.locator('h3:has-text("DropdownMenuItem")')).toBeVisible()
      await expect(page.locator('h3:has-text("DropdownMenuLabel")')).toBeVisible()
      await expect(page.locator('h3:has-text("DropdownMenuShortcut")')).toBeVisible()
    })
  })
})
