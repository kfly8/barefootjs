import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
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
    await expect(page.locator('a[href="/components/button"]')).toBeVisible()
    await expect(page.locator('a[href="/components/button"] h2')).toContainText('Button')
  })

  test('navigates to Button page on click', async ({ page }) => {
    await page.click('a[href="/components/button"]')
    await expect(page).toHaveURL('/components/button')
    await expect(page.locator('h1')).toContainText('Button')
  })
})
