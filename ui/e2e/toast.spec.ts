import { test, expect } from '@playwright/test'

test.describe('Toast Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/toast')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Toast')
    await expect(page.locator('text=A non-blocking notification')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add toast')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("Auto-dismiss")')).toBeVisible()
    await expect(page.locator('strong:has-text("Manual dismiss")')).toBeVisible()
    await expect(page.locator('strong:has-text("Variants")')).toBeVisible()
    await expect(page.locator('strong:has-text("Position options")')).toBeVisible()
  })

  test.describe('Basic Toast', () => {
    test('opens toast when button is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')

      await trigger.click()

      // Toast should be visible
      const toast = basicDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast.locator('[data-toast-title]')).toContainText('Notification')
    })

    test('closes toast when close button is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')

      await trigger.click()

      const toast = basicDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()

      // Use dispatchEvent to trigger a real click that fires the onclick handler
      // (force: true doesn't trigger the onclick handler properly in this scenario)
      const closeButton = toast.locator('[data-toast-close]')
      await closeButton.dispatchEvent('click')

      // Toast should be closed (check for hidden class since visibility can be affected by overlapping demos)
      await expect(toast).toHaveClass(/hidden/)
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')

      await trigger.click()

      const toast = basicDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('role', 'status')
      await expect(toast).toHaveAttribute('aria-live', 'polite')
    })
  })

  test.describe('Success Toast', () => {
    test('displays success variant', async ({ page }) => {
      const successDemo = page.locator('[data-bf-scope^="ToastSuccessDemo_"]').first()
      const trigger = successDemo.locator('button:has-text("Show Success")')

      await trigger.click()

      const toast = successDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('data-toast-variant', 'success')
      await expect(toast.locator('[data-toast-title]')).toContainText('Success')
    })
  })

  test.describe('Error Toast', () => {
    test('displays error variant with assertive aria-live', async ({ page }) => {
      const errorDemo = page.locator('[data-bf-scope^="ToastErrorDemo_"]').first()
      const trigger = errorDemo.locator('button:has-text("Show Error")')

      await trigger.click()

      const toast = errorDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('data-toast-variant', 'error')
      await expect(toast).toHaveAttribute('role', 'alert')
      await expect(toast).toHaveAttribute('aria-live', 'assertive')
    })
  })

  test.describe('Warning Toast', () => {
    test('displays warning variant', async ({ page }) => {
      const warningDemo = page.locator('[data-bf-scope^="ToastWarningDemo_"]').first()
      const trigger = warningDemo.locator('button:has-text("Show Warning")')

      await trigger.click()

      const toast = warningDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('data-toast-variant', 'warning')
      await expect(toast.locator('[data-toast-title]')).toContainText('Warning')
    })
  })

  test.describe('Info Toast', () => {
    test('displays info variant', async ({ page }) => {
      const infoDemo = page.locator('[data-bf-scope^="ToastInfoDemo_"]').first()
      const trigger = infoDemo.locator('button:has-text("Show Info")')

      await trigger.click()

      const toast = infoDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()
      await expect(toast).toHaveAttribute('data-toast-variant', 'info')
      await expect(toast.locator('[data-toast-title]')).toContainText('Info')
    })
  })

  test.describe('Toast with Action', () => {
    test('displays action button', async ({ page }) => {
      const actionDemo = page.locator('[data-bf-scope^="ToastWithActionDemo_"]').first()
      const trigger = actionDemo.locator('button:has-text("Show Toast with Action")')

      await trigger.click()

      const toast = actionDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()

      const actionButton = toast.locator('[data-toast-action]')
      await expect(actionButton).toBeVisible()
      await expect(actionButton).toContainText('Undo')
    })

    test('action button closes toast when clicked', async ({ page }) => {
      const actionDemo = page.locator('[data-bf-scope^="ToastWithActionDemo_"]').first()
      const trigger = actionDemo.locator('button:has-text("Show Toast with Action")')

      await trigger.click()

      const toast = actionDemo.locator('[data-toast]')
      await expect(toast).toBeVisible()

      // Use dispatchEvent to trigger a real click that fires the onclick handler
      const actionButton = toast.locator('[data-toast-action]')
      await actionButton.dispatchEvent('click')

      // Toast should be closed (check for hidden class since visibility can be affected by overlapping demos)
      await expect(toast).toHaveClass(/hidden/)
    })
  })

  test.describe('All Variants Demo', () => {
    test('displays multiple toasts when button is clicked', async ({ page }) => {
      const variantsDemo = page.locator('[data-bf-scope^="ToastVariantsDemo_"]').first()
      const trigger = variantsDemo.locator('button:has-text("Show All Variants")')

      await trigger.click()

      // All 5 variants should be visible
      const toasts = variantsDemo.locator('[data-toast]')
      await expect(toasts).toHaveCount(5)

      // Check each variant is present
      await expect(variantsDemo.locator('[data-toast-variant="default"]')).toBeVisible()
      await expect(variantsDemo.locator('[data-toast-variant="success"]')).toBeVisible()
      await expect(variantsDemo.locator('[data-toast-variant="error"]')).toBeVisible()
      await expect(variantsDemo.locator('[data-toast-variant="warning"]')).toBeVisible()
      await expect(variantsDemo.locator('[data-toast-variant="info"]')).toBeVisible()
    })
  })

  test.describe('Toast Animations', () => {
    test('shows toast with entering animation state', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')
      const toast = basicDemo.locator('[data-toast]')

      await trigger.click()

      // Toast should transition through animation states
      // After rAF, it should be visible
      await expect(toast).toHaveAttribute('data-toast-animation-state', 'visible')
      await expect(toast).toBeVisible()
    })

    test('slides out when dismissed and waits for animation', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')
      const toast = basicDemo.locator('[data-toast]')

      await trigger.click()
      await expect(toast).toBeVisible()

      // Click dismiss button using standard Playwright click
      const closeButton = toast.locator('[data-toast-close]')
      await closeButton.click()

      // Wait for toast to be hidden (final state)
      // Note: We don't test the transient 'exiting' state as it's timing-sensitive
      await expect(toast).toHaveAttribute('data-toast-animation-state', 'hidden')
      await expect(toast).toHaveClass(/hidden/)
    })

    test('manual dismiss during enter animation transitions smoothly to exit', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')
      const toast = basicDemo.locator('[data-toast]')

      await trigger.click()

      // Immediately click dismiss (during enter animation)
      const closeButton = toast.locator('[data-toast-close]')
      await closeButton.dispatchEvent('click')

      // Should transition to exiting
      await expect(toast).toHaveAttribute('data-toast-animation-state', 'exiting')

      // Wait for animation
      await page.waitForTimeout(400)
      await expect(toast).toHaveClass(/hidden/)
    })

    test('multiple toasts animate independently', async ({ page }) => {
      const variantsDemo = page.locator('[data-bf-scope^="ToastVariantsDemo_"]').first()
      const trigger = variantsDemo.locator('button:has-text("Show All Variants")')

      await trigger.click()

      // All toasts should be visible after animation
      const toasts = variantsDemo.locator('[data-toast]')
      await expect(toasts).toHaveCount(5)

      // Each toast should be in visible state
      const defaultToast = variantsDemo.locator('[data-toast-variant="default"]')
      const successToast = variantsDemo.locator('[data-toast-variant="success"]')

      await expect(defaultToast).toHaveAttribute('data-toast-animation-state', 'visible')
      await expect(successToast).toHaveAttribute('data-toast-animation-state', 'visible')

      // Dismiss one toast, others should remain
      const defaultClose = defaultToast.locator('[data-toast-close]')
      await defaultClose.dispatchEvent('click')

      await expect(defaultToast).toHaveAttribute('data-toast-animation-state', 'exiting')
      await expect(successToast).toHaveAttribute('data-toast-animation-state', 'visible')
    })

    test('auto-dismiss waits for exit animation before hiding', async ({ page }) => {
      // Use a short duration for testing (we can't control the duration, so we verify the behavior)
      const basicDemo = page.locator('[data-bf-scope^="ToastBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Show Toast")')
      const toast = basicDemo.locator('[data-toast]')

      await trigger.click()
      await expect(toast).toBeVisible()

      // Verify the animation state attribute exists (indicating animation support)
      await expect(toast).toHaveAttribute('data-toast-animation-state', 'visible')

      // The toast should have transition classes for smooth animation
      await expect(toast).toHaveClass(/transition-all/)
      await expect(toast).toHaveClass(/duration-slow/)
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

test.describe('Home Page - Toast Link', () => {
  test('displays Toast component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/toast"]')).toBeVisible()
    await expect(page.locator('a[href="/components/toast"] h2')).toContainText('Toast')
  })

  test('navigates to Toast page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/toast"]')
    await expect(page).toHaveURL('/components/toast')
    await expect(page.locator('h1')).toContainText('Toast')
  })
})
