import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Components')
  })

  test('displays page description', async ({ page }) => {
    await expect(page.locator('text=Beautifully designed components')).toBeVisible()
  })

  test('displays Button component link', async ({ page }) => {
    await expect(page.locator('a[href="/docs/button"]')).toBeVisible()
    await expect(page.locator('a[href="/docs/button"] h2')).toContainText('Button')
  })

  test('displays Card component link', async ({ page }) => {
    await expect(page.locator('a[href="/docs/card"]')).toBeVisible()
    await expect(page.locator('a[href="/docs/card"] h2')).toContainText('Card')
  })

  test('navigates to Button page on click', async ({ page }) => {
    await page.click('a[href="/docs/button"]')
    await expect(page).toHaveURL('/docs/button')
    await expect(page.locator('h1')).toContainText('Button')
  })

  test('navigates to Card page on click', async ({ page }) => {
    await page.click('a[href="/docs/card"]')
    await expect(page).toHaveURL('/docs/card')
    await expect(page.locator('h1')).toContainText('Card')
  })
})
