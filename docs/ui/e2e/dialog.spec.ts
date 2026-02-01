import { test, expect } from '@playwright/test'

test.describe('Dialog Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/dialog')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dialog')
    await expect(page.locator('text=A modal dialog that displays content')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("ESC key to close")')).toBeVisible()
    await expect(page.locator('strong:has-text("Click outside to close")')).toBeVisible()
    await expect(page.locator('strong:has-text("Scroll lock")')).toBeVisible()
    await expect(page.locator('strong:has-text("Focus trap")')).toBeVisible()
  })

  test.describe('Basic Dialog', () => {
    test('opens dialog when trigger is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      // Dialog should be visible (check within the demo scope)
      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Dialog Title')).toBeVisible()
    })

    test('closes dialog when close button is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Click close button
      const closeButton = dialog.locator('button:has-text("Close")')
      await closeButton.click()

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('closes dialog when ESC key is pressed', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Focus on dialog to ensure ESC key is captured
      await dialog.focus()

      // Press ESC to close dialog
      await page.keyboard.press('Escape')

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('closes dialog when overlay is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Click overlay (force click since it's fixed positioned)
      const overlay = basicDemo.locator('[data-slot="dialog-overlay"]')
      await overlay.click({ force: true })

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
      await expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description')
    })

    test('traps focus within dialog', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Focus on dialog
      await dialog.focus()

      // Get focusable elements
      const closeButton = dialog.locator('button:has-text("Close")')

      // Tab should move focus to the close button
      await page.keyboard.press('Tab')
      await expect(closeButton).toBeFocused()
    })
  })

  test.describe('Dialog Animations', () => {
    test('open animation plays', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')
      const dialog = basicDemo.locator('[role="dialog"]')

      // Initially dialog should be invisible (opacity-0)
      await expect(dialog).toHaveCSS('opacity', '0')

      await trigger.click()

      // Dialog should become visible with animation
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveCSS('opacity', '1')

      // Dialog should have scale-100 (transform contains scale(1) = matrix(1, 0, 0, 1, ...))
      const transform = await dialog.evaluate((el) => getComputedStyle(el).transform)
      expect(transform).toMatch(/^matrix\(1, 0, 0, 1,/)
    })

    test('close via ESC - animation plays', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')
      const dialog = basicDemo.locator('[role="dialog"]')

      await trigger.click()
      await expect(dialog).toBeVisible()

      // Focus on dialog and press ESC to close
      await dialog.focus()
      await page.keyboard.press('Escape')

      // Dialog should fade out (opacity becomes 0)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('close via overlay click', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')
      const dialog = basicDemo.locator('[role="dialog"]')
      const overlay = basicDemo.locator('[data-slot="dialog-overlay"]')

      await trigger.click()
      await expect(dialog).toBeVisible()

      // Click overlay to close (force click since it's fixed positioned)
      await overlay.click({ force: true })

      // Dialog should fade out
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('rapid open/close - no visual glitches', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')
      const dialog = basicDemo.locator('[role="dialog"]')
      const closeButton = dialog.locator('button:has-text("Close")')

      // Rapid open/close sequence
      await trigger.click()
      await expect(dialog).toBeVisible()

      await closeButton.click()
      // Immediately try to open again
      await trigger.click()
      await expect(dialog).toBeVisible()

      // Final state should be stable
      await expect(dialog).toHaveCSS('opacity', '1')

      // Close and verify final closed state
      await closeButton.click()
      await expect(dialog).toHaveCSS('opacity', '0')
    })
  })

  test.describe('Dialog with Form', () => {
    test('opens form dialog when trigger is clicked', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Edit Profile').first()).toBeVisible()
    })

    test('form inputs are focusable', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const nameInput = dialog.locator('input#name')
      const emailInput = dialog.locator('input#email')

      await expect(nameInput).toBeVisible()
      await expect(emailInput).toBeVisible()

      // Click and type in name input
      await nameInput.click()
      await nameInput.fill('John Doe')
      await expect(nameInput).toHaveValue('John Doe')
    })

    test('closes form dialog when Cancel is clicked', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const cancelButton = dialog.locator('button:has-text("Cancel")')
      await cancelButton.click()

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('closes form dialog when Save is clicked', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const saveButton = dialog.locator('button:has-text("Save changes")')
      await saveButton.click()

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays DialogTrigger props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DialogTrigger")')).toBeVisible()
    })

    test('displays DialogContent props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DialogContent")')).toBeVisible()
    })

    test('displays DialogTitle props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DialogTitle")')).toBeVisible()
    })

    test('displays DialogDescription props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DialogDescription")')).toBeVisible()
    })

    test('displays DialogClose props', async ({ page }) => {
      await expect(page.locator('h3:has-text("DialogClose")')).toBeVisible()
    })
  })
})

test.describe('Home Page - Dialog Link', () => {
  test('displays Dialog component link', async ({ page }) => {
    await page.goto('/')
    // Use main content area to avoid matching mobile menu links
    const mainContent = page.locator('main')
    await expect(mainContent.locator('a[href="/docs/components/dialog"]')).toBeVisible()
  })

  test('navigates to Dialog page on click', async ({ page }) => {
    await page.goto('/')
    // Use main content area to avoid matching mobile menu links
    const mainContent = page.locator('main')
    await mainContent.locator('a[href="/docs/components/dialog"]').click()
    await expect(page).toHaveURL('/docs/components/dialog')
    await expect(page.locator('h1')).toContainText('Dialog')
  })
})
