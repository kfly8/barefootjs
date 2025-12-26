import { test, expect } from '@playwright/test'

test.describe('Counter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/counter')
  })

  test('displays initial count of 0', async ({ page }) => {
    await expect(page.locator('.counter')).toHaveText('0')
  })

  test('increments count on + button click', async ({ page }) => {
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('1')
  })

  test('decrements count on - button click', async ({ page }) => {
    // First increment to 1
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('1')

    // Then decrement back to 0
    await page.click('button:has-text("-1")')
    await expect(page.locator('.counter')).toHaveText('0')
  })

  test('handles multiple increments', async ({ page }) => {
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('3')
  })

  test('handles negative counts', async ({ page }) => {
    await page.click('button:has-text("-1")')
    await expect(page.locator('.counter')).toHaveText('-1')
  })

  test('shows doubled value', async ({ page }) => {
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('2')
    await expect(page.locator('.doubled')).toContainText('doubled: 4')
  })

  test('resets count to 0', async ({ page }) => {
    // Increment first
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('2')

    // Reset
    await page.click('button:has-text("Reset")')
    await expect(page.locator('.counter')).toHaveText('0')
  })
})
