import { test, expect } from '@playwright/test'

test.describe('ThemeSwitcher', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('theme'))
    await page.reload()
  })

  test('displays theme switcher in header', async ({ page }) => {
    await expect(page.locator('header button[aria-label*="theme"]')).toBeVisible()
  })

  test('shows System by default', async ({ page }) => {
    await expect(page.locator('header button:has-text("System")')).toBeVisible()
  })

  test('cycles through themes on click', async ({ page }) => {
    const themeSwitcher = page.locator('header button[aria-label*="theme"]')

    // Initially System
    await expect(themeSwitcher).toContainText('System')

    // Click to switch to Light
    await themeSwitcher.click()
    await expect(themeSwitcher).toContainText('Light')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Click to switch to Dark
    await themeSwitcher.click()
    await expect(themeSwitcher).toContainText('Dark')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Click to switch back to System
    await themeSwitcher.click()
    await expect(themeSwitcher).toContainText('System')
  })

  test('persists theme preference in localStorage', async ({ page }) => {
    const themeSwitcher = page.locator('header button[aria-label*="theme"]')

    // Set to Dark
    await themeSwitcher.click() // System -> Light
    await themeSwitcher.click() // Light -> Dark
    await expect(themeSwitcher).toContainText('Dark')

    // Verify localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(storedTheme).toBe('dark')

    // Reload and verify persistence
    await page.reload()
    await expect(themeSwitcher).toContainText('Dark')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('header contains BarefootJS link', async ({ page }) => {
    await expect(page.locator('header a:has-text("BarefootJS")')).toBeVisible()
    await expect(page.locator('header a:has-text("BarefootJS")')).toHaveAttribute('href', '/')
  })
})
