import { test, expect } from '@playwright/test'

test.describe('Dialog Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/dialog')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dialog')
    await expect(page.locator('text=A modal dialog that displays content')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add dialog')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
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
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      // Dialog should be visible (check within the demo scope)
      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Dialog Title')).toBeVisible()
    })

    test('closes dialog when close button is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Click close button
      const closeButton = dialog.locator('button:has-text("Close")')
      await closeButton.click()

      // Dialog should be closed
      await expect(dialog).not.toBeVisible()
    })

    test('closes dialog when ESC key is pressed', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Wait for dialog to receive focus (DialogBasicDemo uses setTimeout to focus)
      await expect(dialog).toBeFocused()

      // Press ESC to close dialog
      await page.keyboard.press('Escape')

      // Dialog should be closed
      await expect(dialog).not.toBeVisible()
    })

    test('closes dialog when overlay is clicked', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Click overlay (the dark backdrop within this demo)
      const overlay = basicDemo.locator('[data-dialog-overlay]')
      await overlay.click({ position: { x: 10, y: 10 } })

      // Dialog should be closed
      await expect(dialog).not.toBeVisible()
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
      await expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description')
    })

    test('traps focus within dialog', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope="DialogBasicDemo"]').first()
      const trigger = basicDemo.locator('button:has-text("Open Dialog")')

      await trigger.click()

      const dialog = basicDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      // Dialog should auto-focus after opening
      await expect(dialog).toBeFocused()

      // Get focusable elements
      const closeButton = dialog.locator('button:has-text("Close")')

      // Tab should move focus to the close button
      await page.keyboard.press('Tab')
      await expect(closeButton).toBeFocused()
    })
  })

  test.describe('Dialog with Form', () => {
    test('opens form dialog when trigger is clicked', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope="DialogFormDemo"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('text=Edit Profile').first()).toBeVisible()
    })

    test('form inputs are focusable', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope="DialogFormDemo"]').first()
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
      const formDemo = page.locator('[data-bf-scope="DialogFormDemo"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const cancelButton = dialog.locator('button:has-text("Cancel")')
      await cancelButton.click()

      await expect(dialog).not.toBeVisible()
    })

    test('closes form dialog when Save is clicked', async ({ page }) => {
      const formDemo = page.locator('[data-bf-scope="DialogFormDemo"]').first()
      const trigger = formDemo.locator('button:has-text("Edit Profile")')

      await trigger.click()

      const dialog = formDemo.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const saveButton = dialog.locator('button:has-text("Save changes")')
      await saveButton.click()

      await expect(dialog).not.toBeVisible()
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
    await expect(page.locator('a[href="/components/dialog"]')).toBeVisible()
    await expect(page.locator('a[href="/components/dialog"] h2')).toContainText('Dialog')
  })

  test('navigates to Dialog page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/dialog"]')
    await expect(page).toHaveURL('/components/dialog')
    await expect(page.locator('h1')).toContainText('Dialog')
  })
})
