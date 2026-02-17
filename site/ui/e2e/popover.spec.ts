import { test, expect } from '@playwright/test'

test.describe('Popover Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/popover')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Popover')
    await expect(page.locator('text=A floating panel that appears relative to a trigger element')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx --bun barefoot add popover').first()).toBeVisible()
  })

  test.describe('Preview Demo', () => {
    test('opens popover on trigger click', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=Dimensions')).toBeVisible()
    })

    test('closes on ESC', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(content).toHaveCount(0)
    })

    test('closes on click outside', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()

      // Click outside the popover (on the page header)
      await page.locator('h1').click()
      await expect(content).toHaveCount(0)
    })

    test('has correct data-state transitions', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      // Initially closed
      const content = page.locator('[data-slot="popover-content"]').first()
      await expect(content).toHaveAttribute('data-state', 'closed')

      // Open
      await trigger.click()
      await expect(content).toHaveAttribute('data-state', 'open')

      // Close
      await page.keyboard.press('Escape')
      await expect(content).toHaveAttribute('data-state', 'closed')
    })

    test('has correct aria-expanded on trigger', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('contains form fields', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverPreviewDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content.locator('text=Width')).toBeVisible()
      await expect(content.locator('text=Height')).toBeVisible()
    })
  })

  test.describe('Basic Demo', () => {
    test('opens and shows content', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverBasicDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=About')).toBeVisible()
    })
  })

  test.describe('Form Demo', () => {
    test('opens and shows form', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverFormDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()
      await expect(content.locator('text=Notifications')).toBeVisible()
    })

    test('PopoverClose button closes popover', async ({ page }) => {
      const demo = page.locator('[bf-s^="PopoverFormDemo_"]').first()
      const trigger = demo.locator('[data-slot="popover-trigger"]')

      await trigger.click()

      const content = page.locator('[data-slot="popover-content"][data-state="open"]')
      await expect(content).toBeVisible()

      // Click the Cancel button (PopoverClose)
      const closeBtn = content.locator('[data-slot="popover-close"]')
      await closeBtn.click()

      await expect(content).toHaveCount(0)
    })
  })

  test.describe('API Reference', () => {
    test('displays API reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
      await expect(page.locator('h3:text-is("Popover")')).toBeVisible()
      await expect(page.locator('h3:has-text("PopoverTrigger")')).toBeVisible()
      await expect(page.locator('h3:has-text("PopoverContent")')).toBeVisible()
      await expect(page.locator('h3:has-text("PopoverClose")')).toBeVisible()
    })
  })
})
