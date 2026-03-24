import { test, expect } from '@playwright/test'

test.describe('Login Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/login')
  })

  test.describe('Basic Login', () => {
    test('renders login card with form fields', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Sign In').first()).toBeVisible()
      await expect(section.locator('input[type="email"]')).toBeVisible()
      await expect(section.locator('input[type="password"]')).toBeVisible()
    })

    test('shows email error on blur with empty value', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      await emailInput.focus()
      await emailInput.blur()
      await expect(section.locator('text=Email is required')).toBeVisible()
    })

    test('shows email format error', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      await emailInput.fill('invalid-email')
      await emailInput.blur()
      await expect(section.locator('text=Invalid email format')).toBeVisible()
    })

    test('shows password error on blur with empty value', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const passwordInput = section.locator('input[type="password"]')
      await passwordInput.focus()
      await passwordInput.blur()
      await expect(section.locator('text=Password is required')).toBeVisible()
    })

    test('shows password length error', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const passwordInput = section.locator('input[type="password"]')
      await passwordInput.fill('short')
      await passwordInput.blur()
      await expect(section.locator('text=Password must be at least 8 characters')).toBeVisible()
    })

    test('submit button is disabled when form is invalid', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const button = section.locator('button:has(.button-text)')
      await expect(button).toBeDisabled()
    })

    test('submit button enables when form is valid', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      const passwordInput = section.locator('input[type="password"]')
      const button = section.locator('button:has(.button-text)')

      await emailInput.fill('user@example.com')
      await passwordInput.fill('password123')
      await expect(button).toBeEnabled()
    })

    test('shows loading state on submit', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      const passwordInput = section.locator('input[type="password"]')

      await emailInput.fill('user@example.com')
      await passwordInput.fill('password123')

      const button = section.locator('button:has(.button-text)')
      await button.click()

      await expect(section.locator('.button-text')).toHaveText('Signing in...')
    })

    test('shows success toast after submit', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      const passwordInput = section.locator('input[type="password"]')

      await emailInput.fill('user@example.com')
      await passwordInput.fill('password123')

      const button = section.locator('button:has(.button-text)')
      await button.click()

      await expect(page.locator('text=Welcome back!').first()).toBeVisible({ timeout: 5000 })
    })

    test('remember me checkbox toggles', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginBasicDemo_"]:not([data-slot])').first()
      const checkbox = section.locator('button[role="checkbox"]')

      await expect(checkbox).toHaveAttribute('aria-checked', 'false')
      await checkbox.click()
      await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })

  test.describe('Social Login', () => {
    test('renders social login buttons', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginSocialDemo_"]:not([data-slot])').first()
      await expect(section.locator('button:has-text("Google")')).toBeVisible()
      await expect(section.locator('button:has-text("GitHub")')).toBeVisible()
    })

    test('shows separator text', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginSocialDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Or continue with')).toBeVisible()
    })

    test('validates email on blur', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginSocialDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      await emailInput.focus()
      await emailInput.blur()
      await expect(section.locator('text=Email is required')).toBeVisible()
    })

    test('submit button enables with valid form', async ({ page }) => {
      const section = page.locator('[bf-s^="LoginSocialDemo_"]:not([data-slot])').first()
      const emailInput = section.locator('input[type="email"]')
      const passwordInput = section.locator('input[type="password"]')
      const button = section.locator('button:has(.button-text)')

      await expect(button).toBeDisabled()

      await emailInput.fill('user@example.com')
      await passwordInput.fill('password123')
      await expect(button).toBeEnabled()
    })
  })
})
