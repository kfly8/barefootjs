import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays hero heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ready-made components for BarefootJS')
  })

  test('displays hero description', async ({ page }) => {
    await expect(page.locator('text=Pick a component')).toBeVisible()
  })

  test('displays Browse All Components CTA', async ({ page }) => {
    const cta = page.locator('a[href="/components"]')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText('Browse All Components')
  })

  test('navigates to components page on CTA click', async ({ page }) => {
    await page.locator('a[href="/components"]').click()
    await expect(page).toHaveURL('/components')
  })
})
