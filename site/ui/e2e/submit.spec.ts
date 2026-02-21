import { test, expect } from '@playwright/test'

test.describe('Form Submit Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/forms/submit')
  })

  test.describe('Basic Submit Demo', () => {
    test('displays basic submit demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="BasicSubmitDemo_"]')).toBeVisible()
    })

    test('shows no error initially', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const error = demo.locator('.error-message')
      await expect(error).toHaveText('')
    })

    test('shows validation error on blur when empty', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.focus()
      await input.blur()
      await expect(error).toHaveText('Email is required')
    })

    test('shows format error for invalid email', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.fill('invalid-email')
      await input.blur()
      await expect(error).toHaveText('Invalid email format')
    })

    test('button is disabled when form is invalid', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const button = demo.locator('button:has(.button-text)')

      await expect(button).toBeDisabled()
    })

    test('button is enabled when form is valid', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('test@example.com')
      await expect(button).not.toBeDisabled()
    })

    test('shows loading state during submission', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('test@example.com')
      await button.click()

      // Button should be disabled during loading
      await expect(button).toBeDisabled()
      // Input should be disabled during loading
      await expect(input).toBeDisabled()
    })

    test('shows success toast after submission', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('test@example.com')
      await button.click()

      // Toast is rendered via Portal to document.body, scoped by bf-s to this demo
      const toast = page.locator('[data-slot="toast"][bf-s*="BasicSubmitDemo"]')
      await expect(toast).toBeVisible({ timeout: 5000 })
      await expect(toast.locator('[data-slot="toast-title"]')).toContainText('Success')
    })

    test('form resets after successful submission', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicSubmitDemo_"]')
      const input = demo.locator('input')

      await input.fill('test@example.com')

      // Toast is rendered via Portal to document.body, scoped by bf-s to this demo
      const toast = page.locator('[data-slot="toast"][bf-s*="BasicSubmitDemo"]')
      const button = demo.locator('button:has(.button-text)')
      await button.click()

      await expect(toast).toBeVisible({ timeout: 5000 })
      // Input should be cleared after successful submission
      await expect(input).toHaveValue('')
    })
  })

  test.describe('Network Error Demo', () => {
    test('displays network error demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="NetworkErrorDemo_"]')).toBeVisible()
    })

    test('shows loading state during submission', async ({ page }) => {
      const demo = page.locator('[bf-s^="NetworkErrorDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('Test message')
      await button.click()

      // Button should be disabled during loading
      await expect(button).toBeDisabled()
    })

    test('completes submission and returns to idle state', async ({ page }) => {
      const demo = page.locator('[bf-s^="NetworkErrorDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('Test message')
      await button.click()

      // Wait for submission to complete (button becomes enabled again)
      await expect(button).not.toBeDisabled({ timeout: 5000 })
    })
  })

  test.describe('Server Validation Demo', () => {
    test('displays server validation demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="ServerValidationDemo_"]')).toBeVisible()
    })

    test('shows client-side validation error', async ({ page }) => {
      const demo = page.locator('[bf-s^="ServerValidationDemo_"]')
      const input = demo.locator('input')
      const error = demo.locator('.client-error')

      await input.fill('invalid-email')
      await input.blur()
      await expect(error).toHaveText('Invalid email format')
    })

    test('shows server validation error for taken email', async ({ page }) => {
      const demo = page.locator('[bf-s^="ServerValidationDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('taken@example.com')
      await button.click()

      // Wait for server error
      const serverError = demo.locator('.server-error')
      await expect(serverError).toBeVisible({ timeout: 5000 })
      await expect(serverError).toContainText('already registered')
    })

    test('clears server error when input changes', async ({ page }) => {
      const demo = page.locator('[bf-s^="ServerValidationDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('taken@example.com')
      await button.click()

      // Wait for server error
      const serverError = demo.locator('.server-error')
      await expect(serverError).toBeVisible({ timeout: 5000 })

      // Modify input
      await input.fill('new@example.com')
      await expect(serverError).not.toBeVisible()
    })

    test('shows success for valid email', async ({ page }) => {
      const demo = page.locator('[bf-s^="ServerValidationDemo_"]')
      const input = demo.locator('input')
      const button = demo.locator('button:has(.button-text)')

      await input.fill('valid@example.com')
      await button.click()

      // Toast is rendered via Portal to document.body, scoped by bf-s to this demo
      const successToast = page.locator('[data-slot="toast"][bf-s*="ServerValidationDemo"]')
      await expect(successToast).toBeVisible({ timeout: 5000 })
    })
  })
})
