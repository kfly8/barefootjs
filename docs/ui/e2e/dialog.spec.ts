import { test, expect } from '@playwright/test'

// Click position for overlay outside the dialog area.
// The dialog is centered on screen, so clicking near the left edge of the overlay
// ensures we click the overlay itself, not the dialog content on top of it.
const OVERLAY_CLICK_POSITION = { x: 10, y: 10 }

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
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body, so we search globally by aria-labelledby
      const dialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Create New Task')).toBeVisible()
    })

    test('focuses first form element when dialog opens', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(dialog).toBeVisible()

      // First form element (title input) should be focused
      const titleInput = dialog.locator('input#task-title')
      await expect(titleInput).toBeFocused()
    })

    test('closes dialog when close button is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      // Click cancel button
      const cancelButton = openDialog.locator('button:has-text("Cancel")')
      await cancelButton.click()

      // Dialog should be closed (data-state changes to "closed")
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })

    test('closes dialog when ESC key is pressed', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      // Focus on dialog for ESC key to work
      await openDialog.focus()

      // Press ESC to close dialog
      await page.keyboard.press('Escape')

      // Dialog should be closed (data-state changes to "closed")
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })

    test('closes dialog when overlay is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      // Overlay is also portaled to body
      const overlay = page.locator('[data-slot="dialog-overlay"]').first()
      await overlay.click({ position: OVERLAY_CLICK_POSITION })

      // Dialog should be closed (data-state changes to "closed")
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
      await expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description')
    })

    test('traps focus within dialog', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(dialog).toBeVisible()

      // Focus on dialog
      await dialog.focus()

      // Get focusable elements - first is the title input
      const titleInput = dialog.locator('input#task-title')

      // Tab should move focus to the first focusable element (title input)
      await page.keyboard.press('Tab')
      await expect(titleInput).toBeFocused()
    })
  })

  test.describe('Dialog Animations', () => {
    test('open animation plays', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')
      // Dialog is portaled to body - check closed state first
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()

      // Initially dialog should be invisible (opacity-0)
      await expect(closedDialog).toHaveCSS('opacity', '0')

      await trigger.click()

      // Dialog should become visible with animation
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()
      await expect(openDialog).toHaveCSS('opacity', '1')

      // Dialog should have scale-100 (transform contains scale(1) = matrix(1, 0, 0, 1, ...))
      const transform = await openDialog.evaluate((el) => getComputedStyle(el).transform)
      expect(transform).toMatch(/^matrix\(1, 0, 0, 1,/)
    })

    test('close via ESC - animation plays', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      await trigger.click()

      // Dialog is portaled to body
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      // Focus on dialog for ESC key to work
      await openDialog.focus()

      // Press ESC to close
      await page.keyboard.press('Escape')

      // Dialog should fade out (opacity becomes 0)
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })

    test('close via overlay click', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')
      const overlay = page.locator('[data-slot="dialog-overlay"]').first()

      await trigger.click()

      // Dialog is portaled to body
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      await overlay.click({ position: OVERLAY_CLICK_POSITION })

      // Dialog should fade out
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })

    test('rapid open/close - no visual glitches', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="DialogBasicDemo_"]').first()
      const trigger = basicDemo.locator('button:has-text("Create Task")')

      // Rapid open/close sequence
      await trigger.click()
      const openDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="open"]')
      await expect(openDialog).toBeVisible()

      const cancelButton = openDialog.locator('button:has-text("Cancel")')
      await cancelButton.click()
      // Immediately try to open again
      await trigger.click()
      await expect(openDialog).toBeVisible()

      // Final state should be stable
      await expect(openDialog).toHaveCSS('opacity', '1')

      // Close and verify final closed state
      await cancelButton.click()
      const closedDialog = page.locator('[role="dialog"][aria-labelledby="dialog-title"][data-state="closed"]').first()
      await expect(closedDialog).toHaveCSS('opacity', '0')
    })
  })

  test.describe('Delete Confirmation Dialog', () => {
    test('opens delete dialog when trigger is clicked', async ({ page }) => {
      const deleteDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = deleteDemo.locator('button:has-text("Delete Project")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="delete-dialog-title"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Delete Project').first()).toBeVisible()
    })

    test('shows warning message', async ({ page }) => {
      const deleteDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = deleteDemo.locator('button:has-text("Delete Project")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="delete-dialog-title"]')
      await expect(dialog).toBeVisible()

      // Check warning content
      await expect(dialog.locator('text=This action cannot be undone')).toBeVisible()
      await expect(dialog.locator('text=All project files')).toBeVisible()
    })

    test('closes delete dialog when Cancel is clicked', async ({ page }) => {
      const deleteDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = deleteDemo.locator('button:has-text("Delete Project")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="delete-dialog-title"]')
      await expect(dialog).toBeVisible()

      const cancelButton = dialog.locator('button:has-text("Cancel")')
      await cancelButton.click()

      // Dialog should be closed (check opacity since we use CSS transitions)
      await expect(dialog).toHaveCSS('opacity', '0')
    })

    test('closes delete dialog when Delete is clicked', async ({ page }) => {
      const deleteDemo = page.locator('[data-bf-scope^="DialogFormDemo_"]').first()
      const trigger = deleteDemo.locator('button:has-text("Delete Project")')

      await trigger.click()

      // Dialog is portaled to body
      const dialog = page.locator('[role="dialog"][aria-labelledby="delete-dialog-title"]')
      await expect(dialog).toBeVisible()

      const deleteButton = dialog.locator('button:has-text("Delete")').last()
      await deleteButton.click()

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
