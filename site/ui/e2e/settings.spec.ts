import { test, expect } from '@playwright/test'

test.describe('Settings Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/settings')
  })

  test.describe('Tab Navigation', () => {
    test('renders with profile tab active by default', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const profileTrigger = section.locator('button[role="tab"]:has-text("Profile")')
      await expect(profileTrigger).toHaveAttribute('data-state', 'active')
    })

    test('switches to account tab', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const accountTrigger = section.locator('button[role="tab"]:has-text("Account")')
      await accountTrigger.click()
      await expect(accountTrigger).toHaveAttribute('data-state', 'active')
      await expect(section.locator('text=Change Password')).toBeVisible()
    })

    test('switches to notifications tab', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const notifTrigger = section.locator('button[role="tab"]:has-text("Notifications")')
      await notifTrigger.click()
      await expect(notifTrigger).toHaveAttribute('data-state', 'active')
      await expect(section.locator('text=Email Notifications')).toBeVisible()
    })

    test('preserves data between tab switches', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const nameInput = section.locator('input#settings-name')

      // Change name on profile tab
      await nameInput.fill('Jane Smith')
      await expect(nameInput).toHaveValue('Jane Smith')

      // Switch to account and back
      await section.locator('button[role="tab"]:has-text("Account")').click()
      await section.locator('button[role="tab"]:has-text("Profile")').click()

      // Name should be preserved
      await expect(nameInput).toHaveValue('Jane Smith')
    })
  })

  test.describe('Profile Tab', () => {
    test('shows display name and email with default values', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await expect(section.locator('input#settings-name')).toHaveValue('John Doe')
      await expect(section.locator('input#settings-email')).toHaveValue('john@example.com')
    })

    test('validates empty display name', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const nameInput = section.locator('input#settings-name')
      await nameInput.fill('')
      await expect(section.locator('text=Display name is required')).toBeVisible()
    })

    test('disables save when display name is empty', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const nameInput = section.locator('input#settings-name')
      await nameInput.fill('')
      const saveButton = section.locator('button:has-text("Save changes")')
      await expect(saveButton).toBeDisabled()
    })

    test('saves profile and shows toast', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const saveButton = section.locator('button:has-text("Save changes")')
      await saveButton.click()
      await expect(page.locator('text=Profile updated successfully').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Account Tab', () => {
    test.beforeEach(async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('button[role="tab"]:has-text("Account")').click()
    })

    test('shows password change form', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Change Password')).toBeVisible()
      await expect(section.locator('input#current-password')).toBeVisible()
      await expect(section.locator('input#new-password')).toBeVisible()
      await expect(section.locator('input#confirm-password')).toBeVisible()
    })

    test('validates password length', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const newPwInput = section.locator('input#new-password')
      await newPwInput.fill('short')
      await expect(section.locator('text=Password must be at least 8 characters')).toBeVisible()
    })

    test('validates password match', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const newPwInput = section.locator('input#new-password')
      const confirmInput = section.locator('input#confirm-password')
      await newPwInput.fill('password123')
      await confirmInput.fill('different')
      await expect(section.locator('text=Passwords do not match')).toBeVisible()
    })

    test('update button disabled when form incomplete', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const updateButton = section.locator('button:has-text("Update password")')
      await expect(updateButton).toBeDisabled()
    })

    test('update button enabled with valid passwords', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('input#current-password').fill('oldpass123')
      await section.locator('input#new-password').fill('newpass123')
      await section.locator('input#confirm-password').fill('newpass123')
      const updateButton = section.locator('button:has-text("Update password")')
      await expect(updateButton).toBeEnabled()
    })

    test('opens delete account dialog', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('button:has-text("Delete Account")').first().click()
      const alertDialog = page.locator('[role="alertdialog"][aria-labelledby="delete-account-title"]')
      await expect(alertDialog).toBeVisible()
      await expect(alertDialog.locator('text=This will permanently delete')).toBeVisible()
    })

    test('closes delete dialog with cancel', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('button:has-text("Delete Account")').first().click()
      const alertDialog = page.locator('[role="alertdialog"][aria-labelledby="delete-account-title"]')
      await expect(alertDialog).toBeVisible()
      const cancelButton = alertDialog.locator('button:has-text("Cancel")')
      await cancelButton.click()
      await expect(alertDialog).toHaveCSS('opacity', '0')
    })
  })

  test.describe('Notifications Tab', () => {
    test.beforeEach(async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('button[role="tab"]:has-text("Notifications")').click()
    })

    test('renders notification switches', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Email Notifications')).toBeVisible()
      const switches = section.locator('button[role="switch"]')
      await expect(switches).toHaveCount(4)
    })

    test('toggles email notification switch', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const switches = section.locator('button[role="switch"]')
      const emailSwitch = switches.first()

      // Initially checked
      await expect(emailSwitch).toHaveAttribute('data-state', 'checked')

      // Toggle off
      await emailSwitch.click()
      await expect(emailSwitch).toHaveAttribute('data-state', 'unchecked')

      // Toggle back on
      await emailSwitch.click()
      await expect(emailSwitch).toHaveAttribute('data-state', 'checked')
    })

    test('shows frequency select', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      const select = section.locator('select#notification-frequency')
      await expect(select).toBeVisible()
    })

    test('saves notification preferences with toast', async ({ page }) => {
      const section = page.locator('[bf-s^="SettingsDemo_"]:not([data-slot])').first()
      await section.locator('button:has-text("Save preferences")').click()
      await expect(page.locator('text=Notification preferences saved')).toBeVisible({ timeout: 5000 })
    })
  })
})
