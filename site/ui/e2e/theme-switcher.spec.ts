import { test, expect } from '@playwright/test'

test.describe('ThemeSwitcher', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('theme'))
    await page.reload()
  })

  test('displays theme switcher in header', async ({ page }) => {
    await expect(page.locator('header button[aria-label*="mode"]')).toBeVisible()
  })

  test('uses system preference as default', async ({ page }) => {
    // The button should have aria-label that indicates current mode
    const themeSwitcher = page.locator('header button[aria-label*="mode"]')
    await expect(themeSwitcher).toBeVisible()

    // Aria-label should contain "Switch to" indicating toggle action
    const ariaLabel = await themeSwitcher.getAttribute('aria-label')
    expect(ariaLabel).toMatch(/Switch to (light|dark) mode/)
  })

  test('toggles between light and dark themes on click', async ({ page }) => {
    const themeSwitcher = page.locator('header button[aria-label*="mode"]')

    // Get initial state
    const initialLabel = await themeSwitcher.getAttribute('aria-label')
    const startedInLight = initialLabel?.includes('Switch to dark')

    if (startedInLight) {
      // Currently light, click to switch to dark
      await themeSwitcher.click()
      await expect(themeSwitcher).toHaveAttribute('aria-label', 'Switch to light mode')
      await expect(page.locator('html')).toHaveClass(/dark/)

      // Click again to switch back to light
      await themeSwitcher.click()
      await expect(themeSwitcher).toHaveAttribute('aria-label', 'Switch to dark mode')
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    } else {
      // Currently dark, click to switch to light
      await themeSwitcher.click()
      await expect(themeSwitcher).toHaveAttribute('aria-label', 'Switch to dark mode')
      await expect(page.locator('html')).not.toHaveClass(/dark/)

      // Click again to switch back to dark
      await themeSwitcher.click()
      await expect(themeSwitcher).toHaveAttribute('aria-label', 'Switch to light mode')
      await expect(page.locator('html')).toHaveClass(/dark/)
    }
  })

  test('persists theme preference in localStorage', async ({ page }) => {
    const themeSwitcher = page.locator('header button[aria-label*="mode"]')

    // Get initial state and click to switch
    const initialLabel = await themeSwitcher.getAttribute('aria-label')
    const startedInLight = initialLabel?.includes('Switch to dark')

    // Toggle to the opposite state
    await themeSwitcher.click()

    // Verify localStorage has the new value
    const expectedTheme = startedInLight ? 'dark' : 'light'
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(storedTheme).toBe(expectedTheme)

    // Reload and verify persistence
    await page.reload()
    const expectedLabel = startedInLight ? 'Switch to light mode' : 'Switch to dark mode'
    await expect(themeSwitcher).toHaveAttribute('aria-label', expectedLabel)

    if (startedInLight) {
      await expect(page.locator('html')).toHaveClass(/dark/)
    } else {
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    }
  })

  test('header contains logo and UI link', async ({ page }) => {
    await expect(page.locator('header a:has(svg)').first()).toBeVisible()
    await expect(page.locator('header a:has-text("UI")')).toBeVisible()
    await expect(page.locator('header a:has-text("UI")')).toHaveAttribute('href', '/')
  })
})
