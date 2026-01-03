import { test, expect } from '@playwright/test'

test.describe('Form Validation Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/validation')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Form Validation')
    await expect(page.locator('p.text-zinc-400.text-lg')).toContainText('error state management')
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

  test.describe('Required Field Demo', () => {
    test('displays required field demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="RequiredFieldDemo"]')).toBeVisible()
    })

    test('shows no error initially', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="RequiredFieldDemo"]')
      const error = demo.locator('.error-message')
      await expect(error).toHaveText('')
    })

    test('shows error on blur when empty', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="RequiredFieldDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.focus()
      await input.blur()
      await expect(error).toHaveText('Name is required')
    })

    test('clears error when value is entered', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="RequiredFieldDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      // Trigger error first
      await input.focus()
      await input.blur()
      await expect(error).toHaveText('Name is required')

      // Enter value to clear error
      await input.fill('John')
      await expect(error).toHaveText('')
    })
  })

  test.describe('Email Validation Demo', () => {
    test('displays email validation demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="EmailValidationDemo"]')).toBeVisible()
    })

    test('shows required error when empty on blur', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="EmailValidationDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.focus()
      await input.blur()
      await expect(error).toHaveText('Email is required')
    })

    test('shows format error for invalid email', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="EmailValidationDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')

      await input.fill('invalid-email')
      await input.blur()
      await expect(error).toHaveText('Invalid email format')
    })

    test('shows valid indicator for correct email', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="EmailValidationDemo"]')
      const input = demo.locator('input')
      const error = demo.locator('.error-message')
      const valid = demo.locator('.valid-indicator')

      await input.fill('test@example.com')
      await input.blur()
      await expect(error).toHaveText('')
      await expect(valid).toHaveText('Valid')
    })
  })

  test.describe('Password Confirmation Demo', () => {
    test('displays password confirmation demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="PasswordConfirmationDemo"]')).toBeVisible()
    })

    test('shows password length error', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="PasswordConfirmationDemo"]')
      const passwordInput = demo.locator('input[type="password"]').first()
      const error = demo.locator('.password-error')

      await passwordInput.fill('short')
      await passwordInput.blur()
      await expect(error).toHaveText('Password must be at least 8 characters')
    })

    test('shows mismatch error when passwords differ', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="PasswordConfirmationDemo"]')
      const passwordInput = demo.locator('input[type="password"]').first()
      const confirmInput = demo.locator('input[type="password"]').last()
      const confirmError = demo.locator('.confirm-error')

      await passwordInput.fill('password123')
      await confirmInput.fill('different123')
      await confirmInput.blur()
      await expect(confirmError).toHaveText('Passwords do not match')
    })

    test('shows match indicator when passwords match', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="PasswordConfirmationDemo"]')
      const passwordInput = demo.locator('input[type="password"]').first()
      const confirmInput = demo.locator('input[type="password"]').last()
      const matchIndicator = demo.locator('.match-indicator')

      await passwordInput.fill('password123')
      await passwordInput.blur()
      await confirmInput.fill('password123')
      await confirmInput.blur()
      await expect(matchIndicator).toHaveText('Passwords match!')
    })
  })

  test.describe('Multi-Field Form Demo', () => {
    test('displays multi-field form demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="MultiFieldFormDemo"]')).toBeVisible()
    })

    test('shows all field errors on submit with empty form', async ({ page }) => {
      // Use direct CSS selectors since nested locators may have issues with data-bf-scope on children
      const demo = page.locator('[data-bf-scope="MultiFieldFormDemo"]')
      await expect(demo).toBeVisible()

      const submitButton = page.locator('[data-bf-scope="MultiFieldFormDemo"] button')
      const nameError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .name-error')
      const emailError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .email-error')
      const passwordError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .password-error')
      const confirmError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .confirm-error')
      const formError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .form-error')

      await submitButton.click()

      await expect(nameError).toHaveText('Name is required')
      await expect(emailError).toHaveText('Email is required')
      await expect(passwordError).toHaveText('Password is required')
      await expect(confirmError).toHaveText('Please confirm your password')
      await expect(formError).toHaveText('Please fix the errors above')
    })

    test('shows name length error for short name', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="MultiFieldFormDemo"]')
      await expect(demo).toBeVisible()

      const nameInput = page.locator('[data-bf-scope="MultiFieldFormDemo"] input').first()
      const nameError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .name-error')

      await nameInput.fill('A')
      await nameInput.blur()
      await expect(nameError).toHaveText('Name must be at least 2 characters')
    })

    test('submits successfully with valid data', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="MultiFieldFormDemo"]')
      await expect(demo).toBeVisible()

      const inputs = page.locator('[data-bf-scope="MultiFieldFormDemo"] input')
      const nameInput = inputs.nth(0)
      const emailInput = inputs.nth(1)
      const passwordInput = inputs.nth(2)
      const confirmInput = inputs.nth(3)
      const submitButton = page.locator('[data-bf-scope="MultiFieldFormDemo"] button')
      const successMessage = page.locator('[data-bf-scope="MultiFieldFormDemo"] .success-message')

      await nameInput.fill('John Doe')
      await emailInput.fill('john@example.com')
      await passwordInput.fill('password123')
      await confirmInput.fill('password123')
      await submitButton.click()

      await expect(successMessage).toBeVisible()
      await expect(successMessage).toContainText('Form submitted successfully')
      await expect(successMessage).toContainText('John Doe')
      await expect(successMessage).toContainText('john@example.com')
    })

    test('clears errors when valid values are entered', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="MultiFieldFormDemo"]')
      await expect(demo).toBeVisible()

      const inputs = page.locator('[data-bf-scope="MultiFieldFormDemo"] input')
      const nameInput = inputs.nth(0)
      const emailInput = inputs.nth(1)
      const nameError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .name-error')
      const emailError = page.locator('[data-bf-scope="MultiFieldFormDemo"] .email-error')
      const submitButton = page.locator('[data-bf-scope="MultiFieldFormDemo"] button')

      // Trigger errors
      await submitButton.click()
      await expect(nameError).toHaveText('Name is required')
      await expect(emailError).toHaveText('Email is required')

      // Fix errors
      await nameInput.fill('John')
      await emailInput.fill('john@example.com')
      await expect(nameError).toHaveText('')
      await expect(emailError).toHaveText('')
    })
  })
})

test.describe('Home Page - Form Validation Link', () => {
  test('displays Form Patterns section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2:has-text("Form Patterns")')).toBeVisible()
  })

  test('displays Form Validation link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/forms/validation"]')).toBeVisible()
    await expect(page.locator('a[href="/forms/validation"] h2')).toContainText('Form Validation')
  })

  test('navigates to Form Validation page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/forms/validation"]')
    await expect(page).toHaveURL('/forms/validation')
    await expect(page.locator('h1')).toContainText('Form Validation')
  })
})
