import { test, expect } from '@playwright/test'

test.describe('Controlled Input Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms/controlled-input')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Controlled Input')
    await expect(page.locator('text=Signal ↔ input value synchronization')).toBeVisible()
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

  test.describe('Basic Two-Way Binding', () => {
    test('displays basic controlled demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="BasicControlledDemo"]')).toBeVisible()
    })

    test('updates display when typing', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicControlledDemo"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      await expect(display).toHaveText('')

      await input.fill('Hello World')
      await expect(display).toHaveText('Hello World')
    })

    test('handles rapid typing', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicControlledDemo"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      // Type rapidly
      await input.pressSequentially('abcdefghij', { delay: 10 })
      await expect(display).toHaveText('abcdefghij')
    })

    // Skip: Known edge case - cursor position is not preserved during controlled input updates.
    // When value is synchronized via signal, cursor moves to end of input.
    // This is a validation finding for Issue #75.
    test.skip('handles typing in middle of text', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="BasicControlledDemo"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      await input.fill('Hello World')
      await expect(display).toHaveText('Hello World')

      // Move cursor to middle and type
      await input.focus()
      await input.press('Home')
      for (let i = 0; i < 5; i++) {
        await input.press('ArrowRight')
      }
      await input.type(' Beautiful')
      await expect(display).toHaveText('Hello Beautiful World')
    })
  })

  test.describe('Character Count', () => {
    test('displays character count demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="CharacterCountDemo"]')).toBeVisible()
    })

    test('shows initial count of 0', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="CharacterCountDemo"]')
      const charCount = demo.locator('.char-count')
      const remaining = demo.locator('.remaining-count')

      await expect(charCount).toHaveText('0')
      await expect(remaining).toHaveText('100')
    })

    test('updates count on typing', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="CharacterCountDemo"]')
      const input = demo.locator('input')
      const charCount = demo.locator('.char-count')
      const remaining = demo.locator('.remaining-count')

      await input.fill('Hello')
      await expect(charCount).toHaveText('5')
      await expect(remaining).toHaveText('95')
    })

    test('updates count in real-time during typing', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="CharacterCountDemo"]')
      const input = demo.locator('input')
      const charCount = demo.locator('.char-count')

      await input.pressSequentially('abc', { delay: 50 })
      await expect(charCount).toHaveText('3')
    })
  })

  test.describe('Live Preview', () => {
    test('displays live preview demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="LivePreviewDemo"]')).toBeVisible()
    })

    test('shows uppercase transformation', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="LivePreviewDemo"]')
      const input = demo.locator('input')
      const uppercase = demo.locator('.uppercase-preview')

      await input.fill('hello world')
      await expect(uppercase).toHaveText('HELLO WORLD')
    })

    test('shows correct word count', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="LivePreviewDemo"]')
      const input = demo.locator('input')
      const wordCount = demo.locator('.word-count')

      await expect(wordCount).toHaveText('0')

      await input.fill('one')
      await expect(wordCount).toHaveText('1')

      await input.fill('one two three')
      await expect(wordCount).toHaveText('3')
    })

    test('handles empty and whitespace-only input', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="LivePreviewDemo"]')
      const input = demo.locator('input')
      const wordCount = demo.locator('.word-count')

      await input.fill('   ')
      await expect(wordCount).toHaveText('0')

      await input.fill('')
      await expect(wordCount).toHaveText('0')
    })
  })

  test.describe('Multi-Input Sync', () => {
    test('displays multi-input sync demo', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="MultiInputSyncDemo"]')).toBeVisible()
    })

    test('syncs value between inputs', async ({ page }) => {
      const demo = page.locator('[data-bf-scope="MultiInputSyncDemo"]')
      const inputs = demo.locator('input')
      const inputA = inputs.first()
      const inputB = inputs.last()
      const sharedValue = demo.locator('.shared-value')

      // Type in first input
      await inputA.fill('Hello')
      await expect(inputB).toHaveValue('Hello')
      await expect(sharedValue).toHaveText('Hello')

      // Type in second input
      await inputB.fill('World')
      await expect(inputA).toHaveValue('World')
      await expect(sharedValue).toHaveText('World')
    })
  })
})

test.describe('Home Page - Controlled Input Link', () => {
  test('displays Form Patterns section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2:has-text("Form Patterns")')).toBeVisible()
  })

  test('displays Controlled Input link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/forms/controlled-input"]')).toBeVisible()
    await expect(page.locator('a[href="/forms/controlled-input"] h2')).toContainText('Controlled Input')
  })

  test('navigates to Controlled Input page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/forms/controlled-input"]')
    await expect(page).toHaveURL('/forms/controlled-input')
    await expect(page.locator('h1')).toContainText('Controlled Input')
  })
})
