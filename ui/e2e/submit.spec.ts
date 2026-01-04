import { test, expect } from '@playwright/test'

test.describe('Form Submit Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/submit')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Form Submit')
    await expect(page.locator('p.text-muted-foreground.text-lg')).toContainText('async submit handling')
  })

  test('displays pattern overview section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Pattern Overview")')).toBeVisible()
  })

  test('displays examples section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Examples")')).toBeVisible()
  })

  test('displays key points section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Key Points")')).toBeVisible()
  })

  test.describe('Basic Submit Demo', () => {
    test('displays basic submit demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="BasicSubmitDemo"]')).toBeVisible()
    })

    test('shows no error initially', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const error = demo.locator('.error-message')
      await expect(error).toHaveText('')
    })

    test('shows validation error on blur when empty', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.focus()
      await input.blur()
      await expect(error).toHaveText('Email is required')
    })

    test('shows format error for invalid email', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.fill('invalid-email')
      await input.blur()
      await expect(error).toHaveText('Invalid email format')
    })

    test('button is disabled when form is invalid', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const button = demo.locator('[data-bf-scope="Button"]')

      await expect(button).toBeDisabled()
    })

    test('button is enabled when form is valid', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('test@example.com')
      await expect(button).not.toBeDisabled()
    })

    test('shows loading state during submission', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('test@example.com')
      await button.click()

      // Button should be disabled during loading
      await expect(button).toBeDisabled()
      // Input should be disabled during loading
      await expect(input).toBeDisabled()
    })

    test('shows success toast after submission', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('test@example.com')
      await button.click()

      // Wait for submission to complete
      const toast = demo.locator('[data-toast-variant="success"]')
      await expect(toast).toBeVisible({ timeout: 5000 })
      await expect(toast.locator('[data-toast-title]')).toContainText('Success')
    })

    test('form resets after successful submission', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicSubmitDemo"]')
      const input = demo.locator('input')

      await input.fill('test@example.com')

      // Wait for success toast to appear (indicates submission completed)
      const toast = demo.locator('[data-toast-variant="success"]')
      const button = demo.locator('[data-bf-scope="Button"]')
      await button.click()

      await expect(toast).toBeVisible({ timeout: 5000 })
      // Input should be cleared after successful submission
      await expect(input).toHaveValue('')
    })
  })

  test.describe('Network Error Demo', () => {
    test('displays network error demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="NetworkErrorDemo"]')).toBeVisible()
    })

    test('shows loading state during submission', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="NetworkErrorDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('Test message')
      await button.click()

      // Button should be disabled during loading
      await expect(button).toBeDisabled()
    })

    test('completes submission and returns to idle state', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="NetworkErrorDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('Test message')
      await button.click()

      // Wait for submission to complete (button becomes enabled again)
      await expect(button).not.toBeDisabled({ timeout: 5000 })
    })
  })

  test.describe('Server Validation Demo', () => {
    test('displays server validation demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="ServerValidationDemo"]')).toBeVisible()
    })

    test('shows client-side validation error', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="ServerValidationDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.client-error')

      await input.fill('invalid-email')
      await input.blur()
      await expect(error).toHaveText('Invalid email format')
    })

    test('shows server validation error for taken email', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="ServerValidationDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('taken@example.com')
      await button.click()

      // Wait for server error
      const serverError = demo.locator('.server-error')
      await expect(serverError).toBeVisible({ timeout: 5000 })
      await expect(serverError).toContainText('already registered')
    })

    test('clears server error when input changes', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="ServerValidationDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

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
      const demo = page.locator('[data-bf-scope="ServerValidationDemo"]')
      const input = demo.locator('input')
      const button = demo.locator('[data-bf-scope="Button"]')

      await input.fill('valid@example.com')
      await button.click()

      // Wait for success toast
      const successToast = demo.locator('[data-toast-variant="success"]')
      await expect(successToast).toBeVisible({ timeout: 5000 })
    })
  })
})

test.describe('Home Page - Form Submit Link', () => {
  test('displays Form Patterns section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2:has-text("Form Patterns")')).toBeVisible()
  })

  test('displays Form Submit link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/forms/submit"]')).toBeVisible()
    await expect(page.locator('a[href="/forms/submit"] h2')).toContainText('Form Submit')
  })

  test('navigates to Form Submit page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/forms/submit"]')
    await expect(page).toHaveURL('/forms/submit')
    await expect(page.locator('h1')).toContainText('Form Submit')
  })
})
