import { test, expect } from '@playwright/test'

test.describe('Async Counter (Suspense + BarefootJS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async-counter')
  })

  test('shows loading state or resolves quickly', async ({ page }) => {
    // The loading text should be visible initially or resolve quickly
    // Since the async delay is only 1.5s, it may resolve before the page fully loads
    // in test environment. We check that either loading is visible or content is loaded.
    const loading = page.locator('.loading')
    const content = page.locator('text=Data loaded from server')

    // Wait for either loading to be visible or content to appear
    await expect(loading.or(content)).toBeVisible({ timeout: 5000 })
  })

  test('counter is interactive after Suspense resolves', async ({ page }) => {
    // Wait for Suspense to resolve (loading state disappears)
    await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })

    // Check that the async data message is displayed
    await expect(page.locator('text=Data loaded from server')).toBeVisible()

    // Check that Counter is rendered with initial value
    await expect(page.locator('.counter')).toHaveText('0')

    // Click +1 button and verify counter increments
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('1')
  })

  test('counter handles multiple operations after Suspense', async ({ page }) => {
    // Wait for Suspense to resolve
    await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })

    // Increment multiple times
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('3')

    // Check doubled value
    await expect(page.locator('.doubled')).toContainText('doubled: 6')
  })

  test('counter decrement works after Suspense', async ({ page }) => {
    // Wait for Suspense to resolve
    await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })

    // Decrement to negative
    await page.click('button:has-text("-1")')
    await expect(page.locator('.counter')).toHaveText('-1')
  })

  test('counter reset works after Suspense', async ({ page }) => {
    // Wait for Suspense to resolve
    await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })

    // Increment first
    await page.click('button:has-text("+1")')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter')).toHaveText('2')

    // Reset
    await page.click('button:has-text("Reset")')
    await expect(page.locator('.counter')).toHaveText('0')
  })
})
