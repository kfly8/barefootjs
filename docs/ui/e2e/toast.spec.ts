import { test, expect } from '@playwright/test'

test.describe('Toast Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/toast')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Toast')
    await expect(page.locator('text=A non-blocking notification')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("Auto-dismiss")')).toBeVisible()
    await expect(page.locator('strong:has-text("Manual dismiss")')).toBeVisible()
    await expect(page.locator('strong:has-text("Variants")')).toBeVisible()
    await expect(page.locator('strong:has-text("Portal rendering")')).toBeVisible()
  })

  test.describe('Simple Toast', () => {
    test('opens toast when button is clicked', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      // Toast is portaled to body, search globally
      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()
      await expect(toast.locator('[data-slot="toast-description"]')).toContainText('Event has been created')
    })

    test('closes toast when close button is clicked', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      // Wait for toast to become visible
      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()

      // Get a stable reference that won't break when data-state changes
      const toastBySlot = page.locator('[data-slot="toast"]').first()
      const closeButton = toastBySlot.locator('[data-slot="toast-close"]')
      await closeButton.click()

      // Toast should transition to hidden
      await expect(toastBySlot).toHaveAttribute('data-state', 'hidden')
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('role', 'status')
      await expect(toast).toHaveAttribute('aria-live', 'polite')
    })
  })

  test.describe('Destructive Toast', () => {
    test('displays error variant with assertive aria-live', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastDestructiveDemo_"]').first()
      const trigger = demo.locator('button:has-text("Show Error")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-variant="error"][data-state="visible"]').first()
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('role', 'alert')
      await expect(toast).toHaveAttribute('aria-live', 'assertive')
      await expect(toast.locator('[data-slot="toast-title"]')).toContainText('Uh oh! Something went wrong.')
    })

    test('action button dismisses toast', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastDestructiveDemo_"]').first()
      const trigger = demo.locator('button:has-text("Show Error")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-variant="error"][data-state="visible"]').first()
      await expect(toast).toBeVisible()

      // Get stable reference before state changes
      const toastBySlot = page.locator('[data-slot="toast"][data-variant="error"]').first()
      const actionButton = toastBySlot.locator('[data-slot="toast-action"]')
      await expect(actionButton).toContainText('Try again')
      await actionButton.click()

      await expect(toastBySlot).toHaveAttribute('data-state', 'hidden')
    })
  })

  test.describe('Toast with Action', () => {
    test('displays action button', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastWithActionDemo_"]').first()
      const trigger = demo.locator('button:has-text("Delete Item")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()

      const actionButton = toast.locator('[data-slot="toast-action"]')
      await expect(actionButton).toBeVisible()
      await expect(actionButton).toContainText('Undo')
    })

    test('action button closes toast when clicked', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastWithActionDemo_"]').first()
      const trigger = demo.locator('button:has-text("Delete Item")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()

      // Use the visible toast's action button directly, then verify via stable locator
      const actionButton = toast.locator('[data-slot="toast-action"]')
      await actionButton.click()

      // Locate the toast that has the undo action (stable selector without data-state)
      const toastWithAction = page.locator('[data-slot="toast"]:has([data-slot="toast-action"][aria-label="Undo deletion"])').first()
      await expect(toastWithAction).toHaveAttribute('data-state', 'hidden')
    })
  })

  test.describe('Toast Animations', () => {
    test('shows toast with visible state after entering', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      // After rAF, toast should be in visible state
      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()
    })

    test('slides out when dismissed and transitions to hidden', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()

      // Get stable reference before state changes
      const toastBySlot = page.locator('[data-slot="toast"]').first()
      const closeButton = toastBySlot.locator('[data-slot="toast-close"]')
      await closeButton.click()

      // Should transition through exiting to hidden
      await expect(toastBySlot).toHaveAttribute('data-state', 'hidden')
    })

    test('toast has transition classes for animation', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastSimpleDemo_"]').first()
      const trigger = demo.locator('button:has-text("Add to calendar")')

      await trigger.click()

      const toast = page.locator('[data-slot="toast"][data-state="visible"]').first()
      await expect(toast).toBeVisible()
      await expect(toast).toHaveClass(/transition-all/)
      await expect(toast).toHaveClass(/duration-slow/)
    })
  })

  test.describe('All Variants Demo', () => {
    test('displays multiple toasts when button is clicked', async ({ page }) => {
      const demo = page.locator('[data-bf-scope^="ToastVariantsDemo_"]').first()
      const trigger = demo.locator('button:has-text("Show All Variants")')

      await trigger.click()

      // All 5 variants should be visible (portaled to body)
      await expect(page.locator('[data-slot="toast"][data-variant="default"][data-state="visible"]')).toBeVisible()
      await expect(page.locator('[data-slot="toast"][data-variant="success"][data-state="visible"]')).toBeVisible()
      await expect(page.locator('[data-slot="toast"][data-variant="error"][data-state="visible"]')).toBeVisible()
      await expect(page.locator('[data-slot="toast"][data-variant="warning"][data-state="visible"]')).toBeVisible()
      await expect(page.locator('[data-slot="toast"][data-variant="info"][data-state="visible"]')).toBeVisible()
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays ToastProvider props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToastProvider")')).toBeVisible()
    })

    test('displays Toast props', async ({ page }) => {
      await expect(page.locator('h3:has-text("Toast")').first()).toBeVisible()
    })

    test('displays ToastTitle props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToastTitle")')).toBeVisible()
    })

    test('displays ToastDescription props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToastDescription")')).toBeVisible()
    })

    test('displays ToastClose props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToastClose")')).toBeVisible()
    })

    test('displays ToastAction props', async ({ page }) => {
      await expect(page.locator('h3:has-text("ToastAction")')).toBeVisible()
    })
  })
})
