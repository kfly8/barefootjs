import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays hero heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ready-made components for BarefootJS')
  })

  test('displays hero description', async ({ page }) => {
    await expect(page.locator('text=Pick a component')).toBeVisible()
  })

  test('displays component showcase section', async ({ page }) => {
    await expect(page.locator('#components h2')).toContainText('Components')
  })

  test('displays component preview cards', async ({ page }) => {
    await expect(page.locator('a[href="/docs/components/button"]')).toBeVisible()
    await expect(page.locator('a[href="/docs/components/card"]')).toBeVisible()
    await expect(page.locator('a[href="/docs/components/tabs"]')).toBeVisible()
  })

  test('navigates to Button page on click', async ({ page }) => {
    await page.click('a[href="/docs/components/button"]')
    await expect(page).toHaveURL('/docs/components/button')
    await expect(page.locator('h1')).toContainText('Button')
  })
})
