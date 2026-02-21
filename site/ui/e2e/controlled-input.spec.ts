import { test, expect } from '@playwright/test'

test.describe('Controlled Input Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/forms/controlled-input')
  })

  test.describe('Basic Two-Way Binding', () => {
    test('displays basic controlled demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="BasicControlledDemo_"]')).toBeVisible()
    })

    test('updates display when typing', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicControlledDemo_"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      await expect(display).toHaveText('')

      await input.fill('Hello World')
      await expect(display).toHaveText('Hello World')
    })

    test('handles rapid typing', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicControlledDemo_"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      // Type rapidly
      await input.pressSequentially('abcdefghij', { delay: 10 })
      await expect(display).toHaveText('abcdefghij')
    })

    test('handles typing in middle of text', async ({ page }) => {
      const demo = page.locator('[bf-s^="BasicControlledDemo_"]')
      const input = demo.locator('input')
      const display = demo.locator('.current-value')

      await input.fill('Hello World')
      await expect(display).toHaveText('Hello World')

      // Move cursor to position 5 (after "Hello") and type
      await input.focus()
      await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(5, 5))
      await input.pressSequentially(' Beautiful')
      await expect(display).toHaveText('Hello Beautiful World')
    })
  })

  test.describe('Character Count', () => {
    test('displays character count demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="CharacterCountDemo_"]')).toBeVisible()
    })

    test('shows initial count of 0', async ({ page }) => {
      const demo = page.locator('[bf-s^="CharacterCountDemo_"]')
      const charCount = demo.locator('.char-count')
      const remaining = demo.locator('.remaining-count')

      await expect(charCount).toHaveText('0')
      await expect(remaining).toHaveText('100')
    })

    test('updates count on typing', async ({ page }) => {
      const demo = page.locator('[bf-s^="CharacterCountDemo_"]')
      const input = demo.locator('input')
      const charCount = demo.locator('.char-count')
      const remaining = demo.locator('.remaining-count')

      await input.fill('Hello')
      await expect(charCount).toHaveText('5')
      await expect(remaining).toHaveText('95')
    })

    test('updates count in real-time during typing', async ({ page }) => {
      const demo = page.locator('[bf-s^="CharacterCountDemo_"]')
      const input = demo.locator('input')
      const charCount = demo.locator('.char-count')

      await input.pressSequentially('abc', { delay: 50 })
      await expect(charCount).toHaveText('3')
    })
  })

  test.describe('Live Preview', () => {
    test('displays live preview demo', async ({ page }) => {
      await expect(page.locator('[bf-s^="LivePreviewDemo_"]')).toBeVisible()
    })

    test('shows uppercase transformation', async ({ page }) => {
      const demo = page.locator('[bf-s^="LivePreviewDemo_"]')
      const input = demo.locator('input')
      const uppercase = demo.locator('.uppercase-preview')

      await input.fill('hello world')
      await expect(uppercase).toHaveText('HELLO WORLD')
    })

    test('shows correct word count', async ({ page }) => {
      const demo = page.locator('[bf-s^="LivePreviewDemo_"]')
      const input = demo.locator('input')
      const wordCount = demo.locator('.word-count')

      await expect(wordCount).toHaveText('0')

      await input.fill('one')
      await expect(wordCount).toHaveText('1')

      await input.fill('one two three')
      await expect(wordCount).toHaveText('3')
    })

    test('handles empty and whitespace-only input', async ({ page }) => {
      const demo = page.locator('[bf-s^="LivePreviewDemo_"]')
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
      await expect(page.locator('[bf-s^="MultiInputSyncDemo_"]')).toBeVisible()
    })

    test('syncs value between inputs', async ({ page }) => {
      const demo = page.locator('[bf-s^="MultiInputSyncDemo_"]')
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
