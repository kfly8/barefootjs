import { test, expect } from '@playwright/test'

test.describe('Command Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/command')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Command')
    await expect(page.locator('text=A command menu with search')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Preview Demo', () => {
    test('displays command input', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      await expect(section).toBeVisible()
      const input = section.locator('input[data-slot="command-input"]')
      await expect(input).toBeVisible()
    })

    test('displays groups with headings', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      await expect(section.locator('[data-slot="command-group-heading"]').first()).toBeVisible()
      await expect(section.locator('[data-slot="command-group-heading"]')).toHaveCount(2)
    })

    test('displays command items', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      await expect(section.locator('[data-slot="command-item"]')).toHaveCount(6)
    })

    test('displays keyboard shortcuts', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      await expect(section.locator('[data-slot="command-shortcut"]')).toHaveCount(3)
    })

    test('filtering hides non-matching items', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      const input = section.locator('input[data-slot="command-input"]')

      await input.fill('cal')
      // Wait for reactive effects + rAF
      await page.waitForTimeout(300)

      // "Calendar" and "Calculator" should be visible (contain "cal")
      const visibleItems = section.locator('[data-slot="command-item"]:visible')
      await expect(visibleItems).toHaveCount(2)
    })

    test('filtering shows empty state when no matches', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      const input = section.locator('input[data-slot="command-input"]')

      await input.fill('zzzzz')
      await page.waitForTimeout(300)

      await expect(section.locator('[data-slot="command-empty"]')).toBeVisible()
    })

    test('arrow key navigation changes selected item', async ({ page }) => {
      const section = page.locator('[bf-s^="CommandPreviewDemo_"]').first()
      const input = section.locator('input[data-slot="command-input"]')

      // Type something to trigger auto-selection, then clear
      await input.click()
      await input.fill('a')
      await page.waitForTimeout(200)
      await input.fill('')
      await page.waitForTimeout(200)

      // Press ArrowDown and verify selection changes
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(100)

      // Second item should now be selected
      const items = section.locator('[data-slot="command-item"]')
      await expect(items.nth(1)).toHaveAttribute('data-selected', 'true')
    })
  })

  test.describe('Dialog Demo', () => {
    test('displays dialog trigger button', async ({ page }) => {
      await expect(page.locator('[data-command-dialog-trigger]')).toBeVisible()
    })

    test('opens dialog on button click', async ({ page }) => {
      await page.locator('[data-command-dialog-trigger]').click()
      await page.waitForTimeout(200)

      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      const input = dialog.locator('input[data-slot="command-input"]')
      await expect(input).toBeVisible()
    })

    test('closes dialog on ESC', async ({ page }) => {
      await page.locator('[data-command-dialog-trigger]').click()
      await page.waitForTimeout(200)

      await expect(page.locator('[role="dialog"]')).toBeVisible()

      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)

      const dialog = page.locator('[data-slot="dialog-content"]')
      await expect(dialog).toHaveAttribute('data-state', 'closed')
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays Command props table', async ({ page }) => {
      await expect(page.locator('h3').filter({ hasText: /^Command$/ })).toBeVisible()
    })

    test('displays CommandInput props table', async ({ page }) => {
      await expect(page.locator('h3:has-text("CommandInput")')).toBeVisible()
    })

    test('displays CommandItem props table', async ({ page }) => {
      await expect(page.locator('h3:has-text("CommandItem")')).toBeVisible()
    })
  })
})

test.describe('Home Page', () => {
  test('displays Command card', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('#components a[href="/docs/components/command"]')
    await expect(card).toBeVisible()
    await expect(card.locator('h3')).toContainText('Command')
  })
})
